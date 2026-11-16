import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDbAsync, saveDbAsync, logAudit } from '@/lib/db';
import { sendDevEmail } from '@/lib/auth';
import { sendActualEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = await getDbAsync();
    const userIndex = db.users.findIndex(
      (u) => u.email?.toLowerCase().trim() === cleanEmail && !u.isMerged
    );

    // Generic response: don't reveal if user exists or not
    const genericResponse = {
      success: true,
      message: 'Jika alamat email terdaftar di sistem, tautan atur ulang password telah dikirimkan ke kotak masuk Anda.',
    };

    if (userIndex === -1) {
      logAudit(cleanEmail, 'guest', 'PASSWORD_RESET_ATTEMPT_UNKNOWN', 'system', `Permintaan reset password untuk email tidak dikenal: ${cleanEmail}`);
      return NextResponse.json(genericResponse);
    }

    const user = db.users[userIndex];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpiresAt = expiresAt;
    db.users[userIndex] = user;
    await saveDbAsync(db);

    const host = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const resetLink = `${proto}://${host}/reset-password?token=${resetToken}`;

    sendDevEmail({
      to: cleanEmail,
      subject: 'Permintaan Atur Ulang Password - Klinik Pratama Sehat Utama',
      title: 'Atur Ulang Password Anda',
      body: `Halo ${user.name},\n\nKami menerima permintaan untuk mengatur ulang kata sandi akun Anda. Klik tombol atau tautan di bawah ini untuk membuat kata sandi baru. Tautan ini berlaku selama 60 menit.`,
      link: resetLink,
      type: 'password_reset',
    });

    // Send real email via Gmail SMTP
    await sendActualEmail({
      to: cleanEmail,
      subject: 'Atur Ulang Kata Sandi - Klinik Pratama Sehat Utama',
      title: 'Atur Ulang Kata Sandi Akun Pasien',
      body: `Halo ${user.name},\n\nKami menerima permintaan untuk mengatur ulang kata sandi akun pasien Anda di Klinik Pratama Sehat Utama.\n\nKlik tombol di bawah ini untuk membuat kata sandi baru. Tautan ini berlaku selama 60 menit. Jika Anda tidak meminta reset kata sandi, abaikan email ini.`,
      link: resetLink,
      buttonText: 'Atur Ulang Kata Sandi',
    });

    logAudit(
      user.name,
      user.role,
      'PASSWORD_RESET_REQUESTED',
      'system',
      `Tautan reset password dikirimkan ke email: ${user.email}`
    );

    return NextResponse.json({
      ...genericResponse,
      resetLink, // returned for test convenience in dev
      resetToken,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

