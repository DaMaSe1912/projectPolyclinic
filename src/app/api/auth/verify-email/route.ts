import { NextResponse } from 'next/server';
import { getDb, saveDb, logAudit } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
  }

  // Redirect to the frontend verify-email page which renders the user feedback
  return NextResponse.redirect(new URL(`/verify-email?token=${encodeURIComponent(token)}`, request.url));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token verifikasi wajib disertakan' }, { status: 400 });
    }

    const db = getDb();
    const userIndex = db.users.findIndex((u) => u.verificationToken === token && !u.isMerged);

    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'Token verifikasi tidak valid atau akun telah diverifikasi sebelumnya.' },
        { status: 400 }
      );
    }

    const user = db.users[userIndex];

    if (user.verificationTokenExpiresAt && new Date(user.verificationTokenExpiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Token verifikasi telah kedaluwarsa. Silakan minta tautan verifikasi baru.' },
        { status: 400 }
      );
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;

    db.users[userIndex] = user;
    saveDb(db);

    logAudit(
      user.name,
      user.role,
      'EMAIL_VERIFIED',
      'patient',
      `Verifikasi email berhasil untuk ${user.email}`
    );

    return NextResponse.json({
      success: true,
      message: 'Email Anda berhasil diverifikasi! Sekarang Anda dapat masuk ke akun Anda.',
      email: user.email,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
