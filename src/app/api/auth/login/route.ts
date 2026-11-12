import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDbAsync, saveDbAsync, logAudit } from '@/lib/db';
import {
  verifyPassword,
  checkAccountLockout,
  createSession,
  sanitizeUser,
  createTwoFactorChallenge,
  SESSION_COOKIE_NAME,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  getRoleIdleTimeoutMs,
} from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, portal } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email atau password salah.' },
        { status: 400 }
      );
    }

    if (!portal || !['patient', 'staff', 'admin'].includes(portal)) {
      return NextResponse.json(
        { error: 'Portal masuk tidak valid.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const db = await getDbAsync();

    // Find active user by email
    const userIndex = db.users.findIndex(
      (u) => u.email?.toLowerCase().trim() === cleanEmail && !u.isMerged
    );

    if (userIndex === -1) {
      logAudit(cleanEmail, 'guest', 'LOGIN_FAILED', 'system', `Percobaan login gagal untuk email: ${cleanEmail} (Email tidak terdaftar)`);
      return NextResponse.json(
        { error: 'Email atau password salah.' },
        { status: 401 }
      );
    }

    const user = db.users[userIndex];

    // Check account lockout
    const lockout = checkAccountLockout(user);
    if (lockout.isLocked) {
      logAudit(user.name, user.role, 'LOGIN_BLOCKED_LOCKOUT', 'system', `Percobaan masuk saat akun terkunci. Sisa waktu: ${lockout.remainingMinutes} menit`);
      return NextResponse.json(
        {
          error: `Akun Anda terkunci sementara selama 15 menit karena telah mencapai 5 kali percobaan gagal. Silakan coba kembali dalam ${lockout.remainingMinutes} menit.`,
          isLocked: true,
          remainingMinutes: lockout.remainingMinutes,
        },
        { status: 423 }
      );
    }

    // Portal matching rule:
    // "Each role signs in through its own page, but the account decides the role, never the page.
    // Opening another role's page shows 'Access denied'."
    if (portal === 'patient' && user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Akses ditolak: Akun staf klinik harus masuk melalui portal khusus staf (/staff).' },
        { status: 403 }
      );
    }

    if (portal === 'staff' && (user.role !== 'front_desk' && user.role !== 'doctor' && user.role !== 'nurse')) {
      return NextResponse.json(
        { error: 'Akses ditolak: Akun ini bukan akun staf poliklinik atau harus masuk melalui portal yang sesuai.' },
        { status: 403 }
      );
    }

    if (portal === 'admin' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya akun Super Admin (IT Admin) yang dapat masuk ke portal ini.' },
        { status: 403 }
      );
    }

    // Verify Password
    let isPasswordValid = false;
    if (user.passwordHash && user.passwordSalt) {
      isPasswordValid = verifyPassword(cleanPassword, user.passwordHash, user.passwordSalt);
    } else if (user.password) {
      // Legacy fallback
      isPasswordValid = user.password === cleanPassword || user.password === `pin:${cleanPassword}`;
    }

    if (!isPasswordValid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
        logAudit(
          user.name,
          user.role,
          'ACCOUNT_LOCKED',
          'system',
          `Akun terkunci selama 15 menit setelah ${user.failedLoginAttempts} kali percobaan gagal.`
        );
      } else {
        logAudit(
          user.name,
          user.role,
          'LOGIN_FAILED',
          'system',
          `Password salah untuk user: ${cleanEmail}. Percobaan: ${user.failedLoginAttempts}/${MAX_FAILED_ATTEMPTS}`
        );
      }

      db.users[userIndex] = user;
      await saveDbAsync(db);

      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        return NextResponse.json(
          {
            error: 'Akun Anda terkunci sementara selama 15 menit karena telah mencapai 5 kali percobaan gagal.',
            isLocked: true,
            remainingMinutes: 15,
          },
          { status: 423 }
        );
      }

      return NextResponse.json(
        { error: 'Email atau password salah.' },
        { status: 401 }
      );
    }

    // Check email verification for patient
    if (user.role === 'patient' && user.emailVerified === false) {
      return NextResponse.json(
        {
          error: 'Email Anda belum diverifikasi. Silakan periksa tautan verifikasi di kotak masuk email Anda.',
          needsEmailVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    // Reset failed login counter on success
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    db.users[userIndex] = user;
    await saveDbAsync(db);

    // If role is Admin, require second factor (2FA)
    if (user.role === 'admin' && user.twoFactorEnabled) {
      const tempToken = createTwoFactorChallenge(user.id);
      logAudit(user.name, user.role, '2FA_CHALLENGE', 'system', 'Menunggu verifikasi faktor kedua (TOTP/Recovery Code)');
      return NextResponse.json({
        success: true,
        require2FA: true,
        tempToken,
        email: user.email,
        name: user.name,
      });
    }

    // Create session and set HttpOnly cookie
    const userAgent = request.headers.get('user-agent') || undefined;
    const session = createSession(user, userAgent);

    logAudit(user.name, user.role, 'LOGIN_SUCCESS', 'system', `Berhasil masuk sebagai ${user.role}`);

    const safeUser = sanitizeUser(user);
    // Cookie lifetime:
    // Patient: 14 days per PRD
    // Staff & Admin: 24 hours (shift limit). Dynamic idle timeout (5m/10m/15m) is enforced on client & server
    const maxAgeSeconds = user.role === 'patient'
      ? 14 * 24 * 60 * 60
      : 24 * 60 * 60;

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      role: user.role,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: session.id,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeSeconds,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Terjadi kesalahan sistem' },
      { status: 500 }
    );
  }
}
