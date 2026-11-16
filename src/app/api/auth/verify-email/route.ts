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

    // 1. Check user directly by verificationToken in db.users
    let userIndex = db.users.findIndex((u) => u.verificationToken === token && !u.isMerged);

    if (userIndex !== -1) {
      const user = db.users[userIndex];

      if (user.emailVerified) {
        return NextResponse.json({
          success: true,
          alreadyVerified: true,
          message: 'Akun pasien Anda sudah berstatus aktif dan terverifikasi. Anda dapat langsung masuk ke portal pasien.',
          email: user.email,
        });
      }

      if (user.verificationTokenExpiresAt && new Date(user.verificationTokenExpiresAt) < new Date()) {
        return NextResponse.json(
          { error: 'Tautan verifikasi telah kedaluwarsa. Silakan lakukan pendaftaran ulang atau masuk untuk minta tautan baru.' },
          { status: 400 }
        );
      }

      user.emailVerified = true;
      user.recoveryCodes = [];
      db.users[userIndex] = user;
      await saveDbAsync(db);

      logAudit(
        user.name,
        user.role,
        'EMAIL_VERIFIED_LINK',
        'patient',
        `Verifikasi email tautan berhasil untuk ${user.email}`
      );

      return NextResponse.json({
        success: true,
        message: 'Email berhasil diverifikasi! Akun pasien Anda telah aktif.',
        email: user.email,
      });
    }

    // 2. Check pendingRegistrations
    if (db.pendingRegistrations && db.pendingRegistrations.length > 0) {
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
          db.users[stagedIdx].verificationToken = pending.verificationToken;
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
          verificationToken: pending.verificationToken,
          verificationTokenExpiresAt: pending.expiresAt,
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

    // 3. Fallback: Check if token exists in mailLog (to recognize already-verified patients)
    const mailRecord = (db.mailLog || []).find(
      (m: any) => m.link && m.link.includes(token)
    );
    if (mailRecord) {
      const emailTarget = (mailRecord.to || (mailRecord as any).to_email || '').toLowerCase().trim();
      const existingUser = db.users.find(
        (u) => u.email?.toLowerCase().trim() === emailTarget && !u.isMerged
      );
      if (existingUser && existingUser.emailVerified) {
        return NextResponse.json({
          success: true,
          alreadyVerified: true,
          message: 'Akun pasien Anda sudah berstatus aktif dan terverifikasi. Anda dapat langsung masuk ke portal pasien.',
          email: existingUser.email,
        });
      }
    }

    // 4. Fallback: Check recent audit logs (within 24 hours)
    const recentAudit = (db.auditLogs || []).find(
      (a) =>
        (a.action === 'EMAIL_VERIFIED' ||
          a.action === 'EMAIL_VERIFIED_LINK' ||
          a.action === 'PATIENT_REGISTERED_VERIFIED') &&
        new Date(a.timestamp).getTime() > Date.now() - 24 * 3600000
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
      { error: 'Token verifikasi tidak valid atau telah kedaluwarsa. Silakan masuk atau minta tautan baru.' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
