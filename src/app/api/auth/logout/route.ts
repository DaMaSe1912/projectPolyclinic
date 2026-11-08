import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { destroySession, SESSION_COOKIE_NAME, getSession } from '@/lib/auth';
import { logAudit } from '@/lib/db';

export async function POST() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (sessionCookie?.value) {
      const sessionData = getSession(sessionCookie.value);
      if (sessionData) {
        logAudit(sessionData.user.name, sessionData.user.role, 'LOGOUT', 'system', 'Pengguna keluar akun secara manual');
      }
      destroySession(sessionCookie.value);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

