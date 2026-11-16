import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDbAsync, saveDbAsync } from '@/lib/db';
import { hashPassword, validatePasswordStrength, validateEmailFormat } from '@/lib/auth';
import { sendActualEmail } from '@/lib/email';
import { PendingRegistration } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, phone, nik, dob, gender } = body;

    if (!name || !email || !phone || !dob || !password) {
      return NextResponse.json(
        { error: 'Semua kolom bertanda bintang (*) wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanName = name.trim();
    const cleanDob = dob.trim();

    // 1. Strict Email Format & Domain Validation
    const emailCheck = validateEmailFormat(cleanEmail);
    if (!emailCheck.valid) {
      return NextResponse.json({ error: emailCheck.message }, { status: 400 });
    }

    // 2. Password Strength Check
    const pwCheck = validatePasswordStrength(password, 'patient');
    if (!pwCheck.valid) {
      return NextResponse.json({ error: pwCheck.message }, { status: 400 });
    }

    const db = await getDbAsync();

    // 3. Duplicate Checks
    const existingByEmail = db.users.find(
      (u) => u.email?.toLowerCase().trim() === cleanEmail && !u.isMerged
    );
    if (existingByEmail) {
      return NextResponse.json(
        {
          error: `Alamat email ${cleanEmail} sudah terdaftar. Silakan beralih ke tab Masuk.`,
          isDuplicate: true,
        },
        { status: 409 }
      );
    }

    const existingByPhone = db.users.find(
      (u) => u.phone === cleanPhone && u.role === 'patient' && !u.isMerged
    );
    if (existingByPhone) {
      return NextResponse.json(
        {
          error: `Nomor telepon ${cleanPhone} sudah terdaftar atas nama ${existingByPhone.name}.`,
          isDuplicate: true,
        },
        { status: 409 }
      );
    }

    if (nik && nik.trim()) {
      const existingByNik = db.users.find(
        (u) => u.nik && u.nik.trim() === nik.trim() && u.role === 'patient' && !u.isMerged
      );
      if (existingByNik) {
        return NextResponse.json(
          {
            error: `NIK ${nik} sudah terdaftar atas nama ${existingByNik.name}. Hubungi front desk jika data tertukar.`,
            isDuplicate: true,
          },
          { status: 409 }
        );
      }
    }

    // 4. Generate 6-Digit Numeric OTP & Verification Token
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry

    const { hash, salt } = hashPassword(password);

    if (!db.pendingRegistrations) {
      db.pendingRegistrations = [];
    }

    // Remove any previous pending registration for this email
    db.pendingRegistrations = db.pendingRegistrations.filter(
      (p) => p.email.toLowerCase() !== cleanEmail
    );

    const pendingItem: PendingRegistration = {
      email: cleanEmail,
      otp: otpCode,
      name: cleanName,
      phone: cleanPhone,
      password: password,
      passwordHash: hash,
      passwordSalt: salt,
      dob: cleanDob,
      gender: gender || 'L',
      nik: nik ? nik.trim() : undefined,
      verificationToken,
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    db.pendingRegistrations.push(pendingItem);

    // Save also to mailLog for internal audit
    if (!db.mailLog) db.mailLog = [];
    const host = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const verifyLink = `${proto}://${host}/verify-email?token=${verificationToken}`;

    db.mailLog.unshift({
      id: `mail-otp-${Date.now()}`,
      to: cleanEmail,
      subject: 'Kode Verifikasi Pendaftaran Pasien - Klinik Pratama Sehat Utama',
      title: 'Verifikasi Akun Email Pasien Anda',
      body: `Halo ${cleanName},\n\nTerima kasih telah mendaftar di Sistem Antrean Poliklinik Umum Klinik Pratama Sehat Utama.\n\nMasukkan 6-digit kode verifikasi di bawah ini pada layar pendaftaran Anda untuk mengaktifkan akun:`,
      link: verifyLink,
      type: 'verification',
      sentAt: new Date().toISOString(),
    });

    await saveDbAsync(db);

    // 5. Send Real Email via Gmail SMTP
    const emailSent = await sendActualEmail({
      to: cleanEmail,
      subject: 'Kode Verifikasi Pendaftaran Pasien - Klinik Pratama Sehat Utama',
      title: 'Verifikasi Akun Email Pasien Anda',
      body: `Halo ${cleanName},\n\nTerima kasih telah mendaftar di Sistem Antrean Poliklinik Umum Klinik Pratama Sehat Utama.\n\nBerikut adalah 6-digit kode verifikasi Anda untuk menyelesaikan pendaftaran akun:`,
      otpCode,
      link: verifyLink,
      buttonText: 'Verifikasi Akun Otomatis',
    });

    console.log(`[Register OTP] Sent OTP to ${cleanEmail}. Success: ${emailSent}`);

    return NextResponse.json({
      success: true,
      message: `Kode verifikasi telah dikirim ke alamat email ${cleanEmail}. Periksa kotak masuk atau spam di Gmail Anda.`,
      email: cleanEmail,
      expiresInMinutes: 10,
    });
  } catch (err: any) {
    console.error('[Register OTP Error]:', err);
    return NextResponse.json({ error: err.message || 'Gagal mengirim kode verifikasi' }, { status: 500 });
  }
}
