import { NextResponse } from 'next/server';
import { getDbAsync, saveDbAsync, logAudit } from '@/lib/db';
import { UserAccount } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otpCode } = body;

    if (!email || !otpCode) {
      return NextResponse.json(
        { error: 'Email dan kode verifikasi 6 digit wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim().replace(/\D/g, '');

    const db = await getDbAsync();

    if (!db.pendingRegistrations || db.pendingRegistrations.length === 0) {
      return NextResponse.json(
        { error: 'Data pendaftaran tidak ditemukan atau sudah kedaluwarsa. Silakan ulangi pendaftaran.' },
        { status: 404 }
      );
    }

    const pendingIndex = db.pendingRegistrations.findIndex(
      (p) => p.email.toLowerCase() === cleanEmail
    );

    if (pendingIndex === -1) {
      return NextResponse.json(
        { error: 'Data pendaftaran untuk email ini tidak ditemukan. Silakan lakukan pendaftaran ulang.' },
        { status: 404 }
      );
    }

    const pending = db.pendingRegistrations[pendingIndex];

    // Check expiration
    if (new Date(pending.expiresAt).getTime() < Date.now()) {
      db.pendingRegistrations.splice(pendingIndex, 1);
      await saveDbAsync(db);
      return NextResponse.json(
        { error: 'Kode verifikasi telah kedaluwarsa (berlaku 10 menit). Silakan minta kode baru.' },
        { status: 400 }
      );
    }

    // Check OTP match
    if (pending.otp !== cleanOtp) {
      return NextResponse.json(
        { error: 'Kode verifikasi 6 digit yang Anda masukkan salah. Periksa kembali email Anda.' },
        { status: 400 }
      );
    }

    // OTP Verified! Create user in db.users with emailVerified = true
    const newPatientId = `usr-pat-${Date.now()}`;
    const newPatient: UserAccount = {
      id: newPatientId,
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
      nik: pending.nik,
      dob: pending.dob,
      gender: pending.gender,
      role: 'patient',
      password: pending.password,
      passwordHash: pending.passwordHash,
      passwordSalt: pending.passwordSalt,
      emailVerified: true, // Verified immediately!
      verificationToken: undefined,
      verificationTokenExpiresAt: undefined,
      failedLoginAttempts: 0,
      lockedUntil: null,
      isActive: true,
      familyMembers: [
        {
          id: `fam-${Date.now()}-self`,
          name: pending.name,
          nik: pending.nik,
          dob: pending.dob,
          gender: pending.gender,
          relationship: 'Diri Sendiri',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    db.users.push(newPatient);

    // Remove from pending registrations
    db.pendingRegistrations.splice(pendingIndex, 1);

    await saveDbAsync(db);

    logAudit(
      newPatient.name,
      'patient',
      'PATIENT_REGISTERED_VERIFIED',
      'patient',
      `Pasien berhasil menyelesaikan verifikasi email OTP: ${newPatient.name} (${newPatient.email}). Akun aktif.`
    );

    return NextResponse.json({
      success: true,
      message: 'Email berhasil diverifikasi! Akun pasien Anda telah aktif. Silakan masuk untuk memulai reservasi antrean.',
      email: newPatient.email,
    });
  } catch (err: any) {
    console.error('[Verify OTP Error]:', err);
    return NextResponse.json({ error: err.message || 'Gagal memverifikasi kode' }, { status: 500 });
  }
}
