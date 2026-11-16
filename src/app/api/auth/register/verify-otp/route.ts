import { NextResponse } from 'next/server';
import { getDbAsync, saveDbAsync, logAudit } from '@/lib/db';
import { UserAccount } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email;
    const rawOtp = body.otpCode || body.otp || '';

    if (!email || !rawOtp) {
      return NextResponse.json(
        { error: 'Email dan kode verifikasi 6 digit wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(rawOtp).trim().replace(/\D/g, '');

    const db = await getDbAsync();

    // 1. Check if user is already verified (Idempotent success)
    const existingVerifiedUser = db.users.find(
      (u) => u.email?.toLowerCase().trim() === cleanEmail && u.emailVerified && !u.isMerged
    );
    if (existingVerifiedUser) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: 'Akun Anda sudah terverifikasi dan aktif! Silakan beralih ke halaman masuk.',
        email: existingVerifiedUser.email,
      });
    }

    // 2. Check staged user in db.users
    const stagedUserIdx = db.users.findIndex(
      (u) => u.email?.toLowerCase().trim() === cleanEmail && !u.emailVerified && !u.isMerged
    );

    // 3. Check pendingRegistrations
    const pendingIndex = (db.pendingRegistrations || []).findIndex(
      (p) => p.email.toLowerCase() === cleanEmail
    );

    if (stagedUserIdx === -1 && pendingIndex === -1) {
      return NextResponse.json(
        { error: 'Data pendaftaran untuk email ini tidak ditemukan. Silakan lakukan pendaftaran ulang.' },
        { status: 404 }
      );
    }

    // Verify OTP against stagedUser or pending
    const stagedUser = stagedUserIdx !== -1 ? db.users[stagedUserIdx] : null;
    const pending = pendingIndex !== -1 ? db.pendingRegistrations![pendingIndex] : null;

    // Check expiration
    const expiresAt = stagedUser?.verificationTokenExpiresAt || pending?.expiresAt;
    if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
      if (pendingIndex !== -1) db.pendingRegistrations!.splice(pendingIndex, 1);
      await saveDbAsync(db);
      return NextResponse.json(
        { error: 'Kode verifikasi telah kedaluwarsa (berlaku 10 menit). Silakan klik kirim ulang kode.' },
        { status: 400 }
      );
    }

    const expectedOtp = pending?.otp || stagedUser?.recoveryCodes?.[0];
    if (expectedOtp && expectedOtp !== cleanOtp) {
      return NextResponse.json(
        { error: 'Kode verifikasi 6 digit yang Anda masukkan salah. Periksa kembali email Anda.' },
        { status: 400 }
      );
    }

    // OTP Verified! Activate the user
    let activatedUser: UserAccount;

    if (stagedUser) {
      stagedUser.emailVerified = true;
      stagedUser.verificationToken = undefined;
      stagedUser.verificationTokenExpiresAt = undefined;
      stagedUser.recoveryCodes = [];
      db.users[stagedUserIdx] = stagedUser;
      activatedUser = stagedUser;
    } else {
      const newPatientId = `usr-pat-${Date.now()}`;
      activatedUser = {
        id: newPatientId,
        name: pending!.name,
        email: pending!.email,
        phone: pending!.phone,
        nik: pending!.nik,
        dob: pending!.dob,
        gender: pending!.gender,
        role: 'patient',
        password: pending!.password,
        passwordHash: pending!.passwordHash,
        passwordSalt: pending!.passwordSalt,
        emailVerified: true,
        verificationToken: undefined,
        verificationTokenExpiresAt: undefined,
        failedLoginAttempts: 0,
        lockedUntil: null,
        isActive: true,
        familyMembers: [
          {
            id: `fam-${Date.now()}-self`,
            name: pending!.name,
            nik: pending!.nik,
            dob: pending!.dob,
            gender: pending!.gender,
            relationship: 'Diri Sendiri',
          },
        ],
        createdAt: new Date().toISOString(),
      };
      db.users.push(activatedUser);
    }

    if (pendingIndex !== -1) {
      db.pendingRegistrations!.splice(pendingIndex, 1);
    }

    await saveDbAsync(db);

    logAudit(
      activatedUser.name,
      'patient',
      'PATIENT_REGISTERED_VERIFIED',
      'patient',
      `Pasien berhasil menyelesaikan verifikasi email OTP: ${activatedUser.name} (${activatedUser.email}). Akun aktif.`
    );

    return NextResponse.json({
      success: true,
      message: 'Email berhasil diverifikasi! Akun pasien Anda telah aktif. Silakan masuk untuk memulai reservasi antrean.',
      email: activatedUser.email,
    });
  } catch (err: any) {
    console.error('[Verify OTP Error]:', err);
    return NextResponse.json({ error: err.message || 'Gagal memverifikasi kode' }, { status: 500 });
  }
}
