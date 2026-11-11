import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession, sanitizeUser, SESSION_COOKIE_NAME, getRoleIdleTimeoutMs } from '@/lib/auth';
import { getDbAsync, saveDbAsync, logAudit } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ user: null, role: 'guest' });
    }

    const sessionData = getSession(sessionCookie.value);
    if (!sessionData) {
      // Session expired or invalid
      const res = NextResponse.json({ user: null, role: 'guest', expired: true });
      res.cookies.delete(SESSION_COOKIE_NAME);
      return res;
    }

    const { user, session } = sessionData;
    const idleLimitMs = getRoleIdleTimeoutMs(user.role);

    return NextResponse.json({
      user: sanitizeUser(user),
      role: user.role,
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
        lastActiveAt: session.lastActiveAt,
        idleLimitMs,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ user: null, role: 'guest', error: err.message });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const sessionData = getSession(sessionCookie.value);
    if (!sessionData) {
      return NextResponse.json({ error: 'Sesi tidak valid atau telah berakhir' }, { status: 401 });
    }

    const body = await request.json();
    const { newFamilyMember, name, phone, nik, dob, gender } = body;

    const db = await getDbAsync();
    const userIndex = db.users.findIndex((u) => u.id === sessionData.user.id && !u.isMerged);
    if (userIndex === -1) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    const user = db.users[userIndex];

    if (newFamilyMember) {
      if (!user.familyMembers) user.familyMembers = [];
      user.familyMembers.push(newFamilyMember);
      logAudit(
        user.name,
        user.role,
        'FAMILY_MEMBER_ADDED',
        'patient',
        `Menambahkan anggota keluarga baru: ${newFamilyMember.name} (${newFamilyMember.relationship})`
      );
    }

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (nik) user.nik = nik.trim();
    if (dob) user.dob = dob;
    if (gender) user.gender = gender;

    db.users[userIndex] = user;
    await saveDbAsync(db);

    return NextResponse.json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
