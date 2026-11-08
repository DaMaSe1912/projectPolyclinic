import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb, saveDb, logAudit } from '@/lib/db';

const BACKUP_SECRET_KEY = process.env.BACKUP_ENCRYPTION_KEY || 'KlinikSehatUtamaSecretKey2026DentalCare99!';

function encryptData(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(BACKUP_SECRET_KEY).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decryptData(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 2) throw new Error('Format file backup tidak valid');
  const iv = Buffer.from(parts[0], 'hex');
  const key = crypto.createHash('sha256').update(BACKUP_SECRET_KEY).digest();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function GET() {
  try {
    const db = getDb();
    const rawJson = JSON.stringify(db);
    const encryptedPayload = encryptData(rawJson);

    logAudit('IT Admin', 'admin', 'BACKUP_EXPORT', 'backup', 'Super Admin mengekspor backup terenkripsi data klinik');

    db.settings.lastBackupAt = new Date().toISOString();
    saveDb(db);

    return new Response(encryptedPayload, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="backup-polyclinic-${new Date().toISOString().split('T')[0]}.enc"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { encryptedData, actorName = 'IT Admin' } = body;

    if (!encryptedData) {
      return NextResponse.json({ error: 'File terenkripsi wajib disertakan' }, { status: 400 });
    }

    const decryptedJson = decryptData(encryptedData.trim());
    const parsedData = JSON.parse(decryptedJson);

    if (!parsedData.settings || !parsedData.doctors || !parsedData.queue) {
      return NextResponse.json({ error: 'Struktur data backup tidak valid' }, { status: 400 });
    }

    saveDb(parsedData);

    logAudit(
      actorName,
      'admin',
      'BACKUP_RESTORE_TEST',
      'backup',
      `Super Admin berhasil memverifikasi dan memulihkan data dari backup terenkripsi`
    );

    return NextResponse.json({
      success: true,
      message: 'Restore data klinik dari file backup terenkripsi berhasil!',
      queueCount: parsedData.queue.length,
      doctorsCount: parsedData.doctors.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: `Gagal memulihkan backup: ${err.message}` }, { status: 400 });
  }
}
