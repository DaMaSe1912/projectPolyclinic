import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: 'Nomor telepon wajib diisi' }, { status: 400 });
    }

    const db = getDb();
    const existingPatient = db.users.find((u) => u.phone === phone.trim() && u.role === 'patient');

    return NextResponse.json({
      success: true,
      message: `Kode verifikasi OTP berhasil dikirim ke ${phone}`,
      isRegistered: !!existingPatient,
      patientName: existingPatient?.name,
      devOtp: '123456', // Displayed in development mode for seamless testing
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
