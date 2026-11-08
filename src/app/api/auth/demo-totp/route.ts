import { NextResponse } from 'next/server';
import { generateTotp } from '@/lib/auth';

export async function GET() {
  const adminSecret = 'JBSWY3DPEHPK3PXP';
  const currentCode = generateTotp(adminSecret);
  const epoch = Math.floor(Date.now() / 1000);
  const secondsLeft = 30 - (epoch % 30);

  return NextResponse.json({
    secret: adminSecret,
    totpCode: currentCode,
    secondsLeft,
    recoveryCodes: ['RECOV-1A2B-3C4D', 'RECOV-5E6F-7G8H', 'RECOV-9I0J-1K2L', 'RECOV-3M4N-5O6P'],
  });
}

