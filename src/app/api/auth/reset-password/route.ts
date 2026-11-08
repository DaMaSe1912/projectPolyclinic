import { NextResponse } from 'next/server';
import { getDb, saveDb, logAudit } from '@/lib/db';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token dan kata sandi baru wajib diisi' },
        { status: 400 }
      );
    }

    const db = getDb();
    const userIndex = db.users.findIndex((u) => u.resetPasswordToken === token && !u.isMerged);

    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'Tautan atur ulang password tidak valid atau sudah pernah digunakan.' },
        { status: 400 }
      );
    }

    const user = db.users[userIndex];

    if (user.resetPasswordTokenExpiresAt && new Date(user.resetPasswordTokenExpiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Tautan atur ulang password telah kedaluwarsa. Silakan ajukan permohonan baru.' },
        { status: 400 }
      );
    }

    // Validate password strength according to role
    const pwCheck = validatePasswordStrength(newPassword, user.role);
    if (!pwCheck.valid) {
      return NextResponse.json({ error: pwCheck.message }, { status: 400 });
    }

    const { hash, salt } = hashPassword(newPassword);

    user.passwordHash = hash;
    user.passwordSalt = salt;
    user.password = newPassword; // for demo
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiresAt = undefined;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;

    db.users[userIndex] = user;
    saveDb(db);

    logAudit(
      user.name,
      user.role,
      'PASSWORD_RESET_SUCCESS',
      'system',
      `Kata sandi berhasil diperbarui untuk user: ${user.email}`
    );

    return NextResponse.json({
      success: true,
      message: 'Kata sandi berhasil diatur ulang. Silakan masuk menggunakan kata sandi baru Anda.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

