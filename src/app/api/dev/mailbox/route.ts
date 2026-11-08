import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  return NextResponse.json({
    success: true,
    mailLog: db.mailLog || [],
  });
}

export async function DELETE() {
  const db = getDb();
  db.mailLog = [];
  saveDb(db);
  return NextResponse.json({ success: true, message: 'Kotak masuk dev berhasil dikosongkan' });
}

