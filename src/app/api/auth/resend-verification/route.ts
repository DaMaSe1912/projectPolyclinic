import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDbAsync, saveDbAsync } from '@/lib/db';
import { sendActualEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Alamat email wajib disertakan' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = await getDbAsync();

    const host = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || 'http';

    // 1. Check if user is in pendingRegistrations
    if (db.pendingRegistrations && db.pendingRegistrations.length > 0) {
      const pending = db.pendingRegistrations.find((p) => p.email.toLowerCase() === cleanEmail);
      if (pending) {
        const freshOtp = crypto.randomInt(100000, 999999).toString();
        pending.otp = freshOtp;
        pending.expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        const verifyLink = `${proto}://${host}/verify-email?token=${pending.verificationToken}`;

        await saveDbAsync(db);

        await sendActualEmail({
          to: cleanEmail,
          subject: 'Kode Verifikasi Baru - Pendaftaran Akun Pasien',
          title: 'Kode Verifikasi Akun Pasien Baru',
          body: `Halo ${pending.name},\n\nBerikut adalah kode verifikasi 6-digit baru Anda untuk menyelesaikan pendaftaran akun di Sistem Poliklinik Umum:`,
          otpCode: freshOtp,
          link: verifyLink,
          buttonText: 'Verifikasi Akun Otomatis',
        });

        return NextResponse.json({
          success: true,
          message: `Kode verifikasi baru telah dikirimkan ke ${cleanEmail}. Periksa kotak masuk Gmail Anda.`,
        });
      }
    }

    // 2. Check if user is already in db.users but not yet verified
    const user = db.users.find((u) => u.email?.toLowerCase().trim() === cleanEmail && !u.isMerged);
    if (user) {
      if (user.emailVerified) {
        return NextResponse.json({ error: 'Akun ini sudah terverifikasi. Silakan langsung masuk.' }, { status: 400 });
      }

      const freshOtp = crypto.randomInt(100000, 999999).toString();
      const freshToken = crypto.randomBytes(32).toString('hex');
      user.recoveryCodes = [freshOtp];
      user.verificationToken = freshToken;
      user.verificationTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const verifyLink = `${proto}://${host}/verify-email?token=${freshToken}`;

      await saveDbAsync(db);

      await sendActualEmail({
        to: cleanEmail,
        subject: 'Kode & Tautan Verifikasi Baru - Akun Pasien Poliklinik',
        title: 'Verifikasi Alamat Email Anda',
        body: `Halo ${user.name},\n\nBerikut adalah kode verifikasi 6-digit baru Anda atau klik tombol di bawah ini untuk mengaktifkan akun pasien Anda:`,
        otpCode: freshOtp,
        link: verifyLink,
        buttonText: 'Verifikasi Akun Sekarang',
      });

      return NextResponse.json({
        success: true,
        message: `Kode dan tautan verifikasi baru telah dikirimkan ke ${cleanEmail}. Periksa kotak masuk Gmail Anda.`,
      });
    }

    return NextResponse.json({ error: 'Alamat email tidak terdaftar.' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal mengirim ulang verifikasi' }, { status: 500 });
  }
}
