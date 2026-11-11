import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDbAsync, saveDbAsync, logAudit } from '@/lib/db';

const BACKUP_SECRET_KEY = process.env.BACKUP_ENCRYPTION_KEY || 'KlinikPratamaSehatUtamaPoliklinikUmumSecretKey2026!';

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
  if (parts.length !== 2) throw new Error('Format file backup tidak valid. File harus memiliki pemisah IV heksadesimal.');
  const iv = Buffer.from(parts[0], 'hex');
  const key = crypto.createHash('sha256').update(BACKUP_SECRET_KEY).digest();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function GET() {
  try {
    const db = await getDbAsync();
    const rawJson = JSON.stringify(db);
    const encryptedPayload = encryptData(rawJson);

    logAudit('IT Admin', 'admin', 'BACKUP_EXPORT', 'backup', 'Super Admin mengekspor backup terenkripsi data klinik');

    db.settings.lastBackupAt = new Date().toISOString();
    await saveDbAsync(db);

    const filename = `backup-polyclinic-${new Date().toISOString().split('T')[0]}.enc`;

    return NextResponse.json({
      success: true,
      encryptedPayload,
      filename,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { encryptedPayload, encryptedData, dryRun = false, actorName = 'IT Admin' } = body;
    const rawCipher = (encryptedPayload || encryptedData || '').trim();

    if (!rawCipher) {
      return NextResponse.json({ error: 'File terenkripsi wajib disertakan' }, { status: 400 });
    }

    const decryptedJson = decryptData(rawCipher);
    const parsedData = JSON.parse(decryptedJson);

    if (!parsedData.settings || !parsedData.doctors || !parsedData.queue) {
      return NextResponse.json({ error: 'Struktur data backup tidak valid' }, { status: 400 });
    }

    if (!dryRun) {
      await saveDbAsync(parsedData);
    }

    logAudit(
      actorName,
      'admin',
      dryRun ? 'BACKUP_TEST_VALIDATE' : 'BACKUP_RESTORE_APPLIED',
      'backup',
      dryRun
        ? 'Super Admin menguji dekripsi integritas file backup (Dry Run - Sukses)'
        : 'Super Admin memulihkan basis data klinik dari file backup terenkripsi'
    );

    return NextResponse.json({
      success: true,
      message: dryRun
        ? 'Uji integritas backup AES-256 berhasil! File valid dan dapat dipulihkan.'
        : 'Restore data klinik dari file backup terenkripsi berhasil!',
      stats: {
        queueCount: Array.isArray(parsedData.queue) ? parsedData.queue.length : 0,
        doctorCount: Array.isArray(parsedData.doctors) ? parsedData.doctors.length : 0,
        referralCount: Array.isArray(parsedData.referrals) ? parsedData.referrals.length : 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: `Gagal memulihkan backup: ${err.message}` }, { status: 400 });
  }
}
