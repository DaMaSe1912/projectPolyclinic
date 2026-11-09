import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb, saveDb, logAudit } from '@/lib/db';
import { hashPassword, validatePasswordStrength, sendDevEmail } from '@/lib/auth';
import { UserAccount } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, phone, nik, dob, gender, checkDuplicatesOnly } = body;

    if (!name || !email || !phone || !dob) {
      return NextResponse.json(
        { error: 'Nama lengkap, email, nomor telepon, dan tanggal lahir wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanName = name.trim();
    const cleanDob = dob.trim();

    const db = getDb();

    // Check duplicate email
    const existingByEmail = db.users.find(
      (u) => u.email?.toLowerCase().trim() === cleanEmail && !u.isMerged
    );

    // Check duplicate phone
    const existingByPhone = db.users.find(
      (u) => u.phone === cleanPhone && u.role === 'patient' && !u.isMerged
    );

    // Check duplicate NIK if provided
    const existingByNik = nik && nik.trim()
      ? db.users.find(
          (u) => u.nik && u.nik.trim() === nik.trim() && u.role === 'patient' && !u.isMerged
        )
      : null;

    // Check potential duplicate by Name + DOB
    const existingByNameDob = db.users.find(
      (u) =>
        u.name.toLowerCase().trim() === cleanName.toLowerCase() &&
        u.dob === cleanDob &&
        u.role === 'patient' &&
        !u.isMerged
    );

    const duplicateMatch = existingByEmail || existingByPhone || existingByNik || existingByNameDob;

    if (checkDuplicatesOnly) {
      return NextResponse.json({
        hasDuplicate: !!duplicateMatch,
        matchedPatient: duplicateMatch
          ? {
              id: duplicateMatch.id,
              name: duplicateMatch.name,
              phone: duplicateMatch.phone,
              dob: duplicateMatch.dob,
              nik: duplicateMatch.nik ? `${duplicateMatch.nik.slice(0, 6)}******` : undefined,
            }
          : null,
      });
    }

    if (existingByEmail) {
      return NextResponse.json(
        {
          error: `Alamat email ${cleanEmail} sudah terdaftar. Silakan langsung masuk.`,
          isDuplicate: true,
          matchedPatient: existingByEmail,
        },
        { status: 409 }
      );
    }

    if (existingByPhone) {
      return NextResponse.json(
        {
          error: `Nomor telepon ${cleanPhone} sudah terdaftar atas nama ${existingByPhone.name}. Silakan langsung masuk.`,
          isDuplicate: true,
          matchedPatient: existingByPhone,
        },
        { status: 409 }
      );
    }

    if (existingByNik) {
      return NextResponse.json(
        {
          error: `NIK ${nik} sudah terdaftar atas nama ${existingByNik.name}. Hubungi front desk jika data tertukar.`,
          isDuplicate: true,
          matchedPatient: existingByNik,
        },
        { status: 409 }
      );
    }

    // Validate password (min 8 characters for patients)
    const pwCheck = validatePasswordStrength(password, 'patient');
    if (!pwCheck.valid) {
      return NextResponse.json({ error: pwCheck.message }, { status: 400 });
    }

    const { hash, salt } = hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    const newPatientId = `usr-pat-${Date.now()}`;
    const newPatient: UserAccount = {
      id: newPatientId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      nik: nik ? nik.trim() : undefined,
      dob: cleanDob,
      gender: gender || 'L',
      role: 'patient',
      password: password, // preserved for demo display
      passwordHash: hash,
      passwordSalt: salt,
      emailVerified: false,
      verificationToken,
      verificationTokenExpiresAt: tokenExpires,
      failedLoginAttempts: 0,
      lockedUntil: null,
      isActive: true,
      familyMembers: [
        {
          id: `fam-${Date.now()}-self`,
          name: cleanName,
          nik: nik ? nik.trim() : undefined,
          dob: cleanDob,
          gender: gender || 'L',
          relationship: 'Diri Sendiri',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    db.users.push(newPatient);
    saveDb(db);

    // Send verification email via Dev Mailbox
    const host = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const verifyLink = `${proto}://${host}/verify-email?token=${verificationToken}`;

    sendDevEmail({
      to: cleanEmail,
      subject: 'Verifikasi Akun Email Pasien - Klinik Pratama Sehat Utama',
      title: 'Verifikasi Alamat Email Anda',
      body: `Halo ${cleanName},\n\nTerima kasih telah mendaftar di Sistem Antrean Poliklinik Umum Klinik Pratama Sehat Utama. Untuk mengaktifkan akun Anda dan mulai melakukan reservasi antrean online, silakan klik tautan verifikasi di bawah ini:`,
      link: verifyLink,
      type: 'verification',
    });

    logAudit(
      newPatient.name,
      'patient',
      'PATIENT_REGISTERED',
      'patient',
      `Pasien baru terdaftar: ${newPatient.name} (${newPatient.email}). Tautan verifikasi email dikirim.`
    );

    return NextResponse.json({
      success: true,
      message: 'Registrasi berhasil! Tautan verifikasi telah dikirim ke email Anda. Silakan verifikasi untuk dapat masuk.',
      email: cleanEmail,
      verificationToken,
      verifyLink,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan' }, { status: 500 });
  }
}
