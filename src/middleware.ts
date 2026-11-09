import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const GATE_COOKIE_NAME = 'admin_gate_pass';
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'sehat-utama-it-2026';
const EXPECTED_GATE_TOKEN = `gate_pass_${ADMIN_SECRET_KEY}`;

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAdminApi = pathname.startsWith('/api/admin/');

  // If not accessing admin routes, proceed normally
  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  // 1. Check if the URL provides the secret key via query parameter (?key=... / ?access_key=... / ?secret=...)
  const keyParam =
    searchParams.get('key') ||
    searchParams.get('access_key') ||
    searchParams.get('secret');

  if (keyParam && keyParam.trim() === ADMIN_SECRET_KEY) {
    // Valid secret key provided!
    // Clean the URL by stripping the secret key from query parameters (so it does not leak in browser history)
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete('key');
    cleanUrl.searchParams.delete('access_key');
    cleanUrl.searchParams.delete('secret');

    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set({
      name: GATE_COOKIE_NAME,
      value: EXPECTED_GATE_TOKEN,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 4, // 4 hours access window
    });
    return response;
  }

  // 2. Check if the client already holds a valid gate pass cookie
  const gateCookie = request.cookies.get(GATE_COOKIE_NAME);
  if (gateCookie?.value === EXPECTED_GATE_TOKEN) {
    return NextResponse.next();
  }

  // 3. Fallback: Block all unauthorized public requests with a pure 404 masquerade
  if (isAdminApi) {
    return NextResponse.json({ error: 'Endpoint tidak ditemukan' }, { status: 404 });
  }

  // For admin pages, rewrite to the 404 page (public sees standard "404 Not Found")
  return NextResponse.rewrite(new URL('/_not-found', request.url));
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
};

