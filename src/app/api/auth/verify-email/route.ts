import { NextResponse } from 'next/server';
import { getDbAsync, saveDbAsync, logAudit } from '@/lib/db';

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

    const db = await getDbAsync();

    // Check user directly by verificationToken in db.users
    let userIndex = db.users.findIndex((u) => u.verificationToken === token && !u.isMerged);

    // If not found in db.users, check if it's from a pending registration
    if (userIndex === -1 && db.pendingRegistrations && db.pendingRegistrations.length > 0) {
      const pendingIndex = db.pendingRegistrations.findIndex((p) => p.verificationToken === token);
      if (pendingIndex !== -1) {
        const pending = db.pendingRegistrations[pendingIndex];
        if (new Date(pending.expiresAt) < new Date()) {
          db.pendingRegistrations.splice(pendingIndex, 1);
          await saveDbAsync(db);
          return NextResponse.json(
            { error: 'Tautan verifikasi telah kedaluwarsa. Silakan lakukan pendaftaran ulang.' },
            { status: 400 }
          );
        }

        // Check if an unverified staged user already exists with this email
        const stagedIdx = db.users.findIndex(
          (u) => u.email?.toLowerCase().trim() === pending.email.toLowerCase() && !u.isMerged
        );

        if (stagedIdx !== -1) {
          db.users[stagedIdx].emailVerified = true;
          db.users[stagedIdx].verificationToken = undefined;
          db.users[stagedIdx].verificationTokenExpiresAt = undefined;
          db.users[stagedIdx].recoveryCodes = [];
          db.pendingRegistrations.splice(pendingIndex, 1);
          await saveDbAsync(db);

          logAudit(
            db.users[stagedIdx].name,
            'patient',
            'EMAIL_VERIFIED_LINK',
            'patient',
            `Verifikasi email tautan berhasil untuk ${db.users[stagedIdx].email}`
          );

          return NextResponse.json({
            success: true,
            message: 'Email berhasil diverifikasi! Akun pasien Anda telah aktif.',
            email: db.users[stagedIdx].email,
          });
        }

        const newPatientId = `usr-pat-${Date.now()}`;
        const newPatient: any = {
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
          emailVerified: true,
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
        db.pendingRegistrations.splice(pendingIndex, 1);
        await saveDbAsync(db);

        logAudit(
          newPatient.name,
          'patient',
          'EMAIL_VERIFIED_LINK',
          'patient',
          `Verifikasi email tautan berhasil untuk ${newPatient.email}`
        );

        return NextResponse.json({
          success: true,
          message: 'Email berhasil diverifikasi! Akun pasien Anda telah aktif.',
          email: newPatient.email,
        });
      }
    }

    // If userIndex is still -1, check if an account was recently verified (Idempotent for React Strict Mode / double clicks)
    if (userIndex === -1) {
      const recentAudit = (db.auditLogs || []).find(
        (a) =>
          (a.action === 'EMAIL_VERIFIED' ||
            a.action === 'EMAIL_VERIFIED_LINK' ||
            a.action === 'PATIENT_REGISTERED_VERIFIED') &&
          new Date(a.timestamp).getTime() > Date.now() - 3600000 // Last 60 minutes
      );

      if (recentAudit) {
        return NextResponse.json({
          success: true,
          alreadyVerified: true,
          message: 'Akun Anda sudah berhasil diverifikasi dan aktif. Silakan masuk ke akun Anda.',
          email: recentAudit.actorName,
        });
      }

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
    await saveDbAsync(db);

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
