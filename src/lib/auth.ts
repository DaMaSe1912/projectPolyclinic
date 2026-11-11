import crypto from 'crypto';
import { getDb, saveDb, logAudit } from './db';
import { UserAccount, UserRole, SessionRecord, DevEmail } from '@/types';

// ==========================================
// 1. Password Hashing & Salt
// ==========================================

export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const computed = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computed, 'hex'));
  } catch {
    return false;
  }
}

// Password rules: at least 8 for patient, at least 12 for staff
export function validatePasswordStrength(password: string, role: UserRole): { valid: boolean; message?: string } {
  const minLength = role === 'patient' ? 8 : 12;
  if (!password || password.length < minLength) {
    return {
      valid: false,
      message: `Password harus memiliki minimal ${minLength} karakter untuk peran ${role === 'patient' ? 'pasien' : 'staf klinik'}.`,
    };
  }
  return { valid: true };
}

// ==========================================
// 2. TOTP (RFC 6238) Implementation in Native Node.js
// ==========================================

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateTotpSecret(length: number = 20): string {
  const bytes = crypto.randomBytes(length);
  let secret = '';
  for (let i = 0; i < bytes.length; i++) {
    secret += BASE32_ALPHABET[bytes[i] % BASE32_ALPHABET.length];
  }
  return secret;
}

function base32ToBuffer(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export function generateTotp(secretBase32: string, stepOffset: number = 0, timeStepSeconds: number = 30): string {
  const key = base32ToBuffer(secretBase32);
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / timeStepSeconds) + stepOffset;

  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(timeStep), 0);

  const hmac = crypto.createHmac('sha1', key).update(timeBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

export function verifyTotp(token: string, secretBase32: string): boolean {
  if (!token || !secretBase32) return false;
  const cleanToken = token.trim();
  // Check -1, 0, +1 time-step windows (30s window with clock drift tolerance)
  for (const offset of [0, -1, 1]) {
    const expected = generateTotp(secretBase32, offset);
    if (expected === cleanToken) {
      return true;
    }
  }
  return false;
}

export function generateRecoveryCodes(count: number = 4): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    codes.push(`RECOV-${part1}-${part2}`);
  }
  return codes;
}

// ==========================================
// 3. Lockout & Rate Limit Rules
// ==========================================

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function checkAccountLockout(user: UserAccount): { isLocked: boolean; remainingMinutes?: number } {
  if (user.lockedUntil) {
    const lockTime = new Date(user.lockedUntil).getTime();
    const now = Date.now();
    if (lockTime > now) {
      const remainingMinutes = Math.ceil((lockTime - now) / 60000);
      return { isLocked: true, remainingMinutes };
    }
  }
  return { isLocked: false };
}

// ==========================================
// 4. Session & Idle Timeout Rules
// ==========================================

export const SESSION_COOKIE_NAME = 'polyclinic_session';

// Idle timeout per role in milliseconds:
// Front desk: 10 mins (600,000 ms)
// Doctor/Nurse: 5 mins (300,000 ms) on tablet
// Admin: 15 mins (900,000 ms)
// Patient: 14 days (14 * 24 * 60 * 60 * 1000 ms)
export function getRoleIdleTimeoutMs(role: UserRole): number {
  switch (role) {
    case 'front_desk':
      return 10 * 60 * 1000;
    case 'doctor':
    case 'nurse':
      return 5 * 60 * 1000;
    case 'admin':
      return 15 * 60 * 1000;
    case 'patient':
      return 14 * 24 * 60 * 60 * 1000;
    default:
      return 15 * 60 * 1000;
  }
}

export function createSession(user: UserAccount, userAgent?: string): SessionRecord {
  const db = getDb();
  if (!db.sessions) db.sessions = [];

  const now = new Date();
  const idleTimeout = getRoleIdleTimeoutMs(user.role);
  const expiresAt = new Date(now.getTime() + idleTimeout);

  const session: SessionRecord = {
    id: `sess-${crypto.randomBytes(24).toString('hex')}`,
    userId: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    lastActiveAt: now.toISOString(),
    userAgent,
  };

  db.sessions.push(session);
  saveDb(db);
  return session;
}

export function getSession(sessionId: string): { session: SessionRecord; user: UserAccount } | null {
  if (!sessionId) return null;
  const db = getDb();
  if (!db.sessions) return null;

  const session = db.sessions.find((s) => s.id === sessionId);
  if (!session) return null;

  const user = db.users.find((u) => u.id === session.userId && !u.isMerged);
  if (!user || user.isActive === false) return null;

  // Check idle timeout
  const now = Date.now();
  const lastActive = new Date(session.lastActiveAt).getTime();
  const idleTimeout = getRoleIdleTimeoutMs(session.role);

  if (now - lastActive > idleTimeout) {
    // Session expired due to idle!
    destroySession(sessionId);
    logAudit(user.name, user.role, 'SESSION_EXPIRED_IDLE', 'system', `Sesi otomatis berakhir karena idle (> ${idleTimeout / 60000} menit)`);
    return null;
  }

  // Touch session
  session.lastActiveAt = new Date().toISOString();
  session.expiresAt = new Date(now + idleTimeout).toISOString();
  saveDb(db);

  return { session, user };
}

export function destroySession(sessionId: string): void {
  const db = getDb();
  if (!db.sessions) return;
  db.sessions = db.sessions.filter((s) => s.id !== sessionId);
  saveDb(db);
}

// ==========================================
// 5. Dev Mailbox & Email Dispatcher
// ==========================================

export function sendDevEmail({
  to,
  subject,
  title,
  body,
  link,
  type,
}: {
  to: string;
  subject: string;
  title: string;
  body: string;
  link?: string;
  type: 'verification' | 'password_reset' | 'staff_welcome';
}): DevEmail {
  const db = getDb();
  if (!db.mailLog) db.mailLog = [];

  const emailRecord: DevEmail = {
    id: `mail-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    to,
    subject,
    title,
    body,
    link,
    type,
    sentAt: new Date().toISOString(),
  };

  db.mailLog.unshift(emailRecord);
  if (db.mailLog.length > 50) {
    db.mailLog = db.mailLog.slice(0, 50);
  }
  saveDb(db);

  // Server console output for instant dev visibility
  console.log('====================================================');
  console.log(`[DEV MAILBOX] Email Dikirim ke: ${to}`);
  console.log(`Subjek : ${subject}`);
  if (link) {
    console.log(`Tautan : ${link}`);
  }
  console.log('====================================================');

  return emailRecord;
}

// Sanitize user for client transfer (never leak sensitive fields)
export function sanitizeUser(user: UserAccount): Partial<UserAccount> {
  const {
    password: _p,
    passwordHash: _ph,
    passwordSalt: _ps,
    twoFactorSecret: _tfs,
    verificationToken: _vt,
    resetPasswordToken: _rpt,
    ...safe
  } = user;
  return safe;
}

