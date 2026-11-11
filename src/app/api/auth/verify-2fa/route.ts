import { NextResponse } from 'next/server';
import { getDbAsync, saveDbAsync, logAudit } from '@/lib/db';
import {
  verifyTotp,
  createSession,
  sanitizeUser,
  SESSION_COOKIE_NAME,
  getRoleIdleTimeoutMs,
} from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code, isRecoveryCode } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email dan kode autentikasi 2FA wajib diisi' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim().toUpperCase();
    const db = await getDbAsync();

    const userIndex = db.users.findIndex(
      (u) => u.email?.toLowerCase().trim() === cleanEmail && u.role === 'admin' && !u.isMerged
    );

    if (userIndex === -1) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    const user = db.users[userIndex];

    let verified = false;

    if (isRecoveryCode) {
      if (user.recoveryCodes && user.recoveryCodes.includes(cleanCode)) {
        verified = true;
        // Consume the recovery code (single use)
        user.recoveryCodes = user.recoveryCodes.filter((c) => c !== cleanCode);
        db.users[userIndex] = user;
        await saveDbAsync(db);
        logAudit(
          user.name,
          user.role,
          '2FA_RECOVERY_USED',
          'system',
          `Pemulihan akun 2FA menggunakan recovery code. Sisa kode: ${user.recoveryCodes.length}`
        );
      } else {
        return NextResponse.json(
          { error: 'Kode pemulihan (Recovery Code) tidak valid atau sudah digunakan.' },
          { status: 400 }
        );
      }
    } else {
      if (!user.twoFactorSecret) {
        return NextResponse.json({ error: 'Konfigurasi 2FA belum diatur' }, { status: 400 });
      }

      verified = verifyTotp(cleanCode, user.twoFactorSecret);
      if (!verified) {
        logAudit(user.name, user.role, '2FA_FAILED', 'system', 'Kode TOTP yang dimasukkan salah');
        return NextResponse.json(
          { error: 'Kode autentikasi 6-digit salah atau telah kedaluwarsa. Silakan periksa kembali aplikasi Authenticator Anda.' },
          { status: 400 }
        );
      }
    }

    // Success! Create session and set cookie
    const userAgent = request.headers.get('user-agent') || undefined;
    const session = createSession(user, userAgent);

    logAudit(user.name, user.role, 'LOGIN_SUCCESS', 'system', 'Berhasil masuk Super Admin setelah verifikasi 2FA');

    // Cookie lifetime: 24 hours for Admin. Dynamic idle timeout (15 mins) is enforced on client & server
    const maxAgeSeconds = 24 * 60 * 60;
    const response = NextResponse.json({
      success: true,
      user: sanitizeUser(user),
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

