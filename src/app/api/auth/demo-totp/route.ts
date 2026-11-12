import { NextResponse } from 'next/server';
import { generateTotp } from '@/lib/auth';
import { getDbAsync } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const db = await getDbAsync();
    const admin = db.users.find((u) => u.role === 'admin' && !u.isMerged);
    const adminSecret = admin?.twoFactorSecret || 'JBSWY3DPEHPK3PXP';

    let recoveryCodes: string[] = ['RECOV-1A2B-3C4D', 'RECOV-5E6F-7G8H', 'RECOV-9I0J-1K2L', 'RECOV-3M4N-5O6P'];
    if (Array.isArray(admin?.recoveryCodes) && admin.recoveryCodes.length > 0) {
      recoveryCodes = admin.recoveryCodes;
    } else if (typeof admin?.recoveryCodes === 'string') {
      try {
        const parsed = JSON.parse(admin.recoveryCodes);
        if (Array.isArray(parsed) && parsed.length > 0) recoveryCodes = parsed;
      } catch {}
    }

    const epoch = Math.floor(Date.now() / 1000);
    const currentCode = generateTotp(adminSecret);
    const secondsLeft = 30 - (epoch % 30);

    const response = NextResponse.json({
      secret: adminSecret,
      totpCode: currentCode,
      secondsLeft,
      recoveryCodes,
      timestamp: Date.now(),
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (err: any) {
    const adminSecret = 'JBSWY3DPEHPK3PXP';
    const epoch = Math.floor(Date.now() / 1000);
    const response = NextResponse.json({
      secret: adminSecret,
      totpCode: generateTotp(adminSecret),
      secondsLeft: 30 - (epoch % 30),
      recoveryCodes: ['RECOV-1A2B-3C4D', 'RECOV-5E6F-7G8H', 'RECOV-9I0J-1K2L', 'RECOV-3M4N-5O6P'],
      timestamp: Date.now(),
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  }
}
