import { NextResponse } from 'next/server';
import { getDb, saveDb, logAudit } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const patients = db.users.filter((u) => u.role === 'patient' && !u.isMerged);

    // Find suspected duplicates (matching phone, or matching NIK, or matching lower(name) + dob)
    const duplicateGroups: Array<{ reason: string; patients: typeof patients }> = [];
    const visited = new Set<string>();

    for (let i = 0; i < patients.length; i++) {
      const p1 = patients[i];
      if (visited.has(p1.id)) continue;

      const group = [p1];
      for (let j = i + 1; j < patients.length; j++) {
        const p2 = patients[j];
        if (visited.has(p2.id)) continue;

        let matchReason = '';
        if (p1.phone && p2.phone && p1.phone === p2.phone) {
          matchReason = 'Nomor Telepon Sama';
        } else if (p1.nik && p2.nik && p1.nik === p2.nik) {
          matchReason = 'NIK Sama';
        } else if (
          p1.name.trim().toLowerCase() === p2.name.trim().toLowerCase() &&
          p1.dob &&
          p1.dob === p2.dob
        ) {
          matchReason = 'Nama & Tanggal Lahir Sama';
        }

        if (matchReason) {
          group.push(p2);
          visited.add(p2.id);
        }
      }

      if (group.length > 1) {
        visited.add(p1.id);
        duplicateGroups.push({
          reason: 'Kemungkinan Duplikasi Terdeteksi',
          patients: group,
        });
      }
    }

    return NextResponse.json({ success: true, duplicateGroups, allPatients: patients });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { primaryPatientId, secondaryPatientId, actorName = 'Super Admin', actorRole = 'admin' } = body;

    if (actorRole !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Super Admin yang dapat menggabungkan data.' }, { status: 403 });
    }

    const db = getDb();
    const primary = db.users.find((u) => u.id === primaryPatientId);
    const secondary = db.users.find((u) => u.id === secondaryPatientId);

    if (!primary || !secondary) {
      return NextResponse.json({ error: 'Data pasien tidak ditemukan' }, { status: 404 });
    }

    // Mark secondary as merged into primary (nothing deleted per PRD)
    secondary.isMerged = true;
    secondary.mergedIntoId = primary.id;

    // Move any queue history from secondary to primary
    db.queue.forEach((q) => {
      if (q.patientId === secondary.id) {
        q.patientId = primary.id;
        q.patientName = primary.name;
      }
    });

    // Merge family members if any
    if (secondary.familyMembers && secondary.familyMembers.length > 0) {
      primary.familyMembers = primary.familyMembers || [];
      secondary.familyMembers.forEach((fm) => {
        if (!primary.familyMembers!.some((existing) => existing.name === fm.name && existing.dob === fm.dob)) {
          primary.familyMembers!.push(fm);
        }
      });
    }

    saveDb(db);

    logAudit(
      actorName,
      'admin',
      'MERGE_PATIENT_ACCOUNTS',
      'patient',
      `Super Admin menggabungkan akun duplikat: ${secondary.name} (${secondary.id}) digabung ke ${primary.name} (${primary.id})`
    );

    return NextResponse.json({
      success: true,
      message: `Akun ${secondary.name} berhasil digabungkan ke ${primary.name}`,
      primary,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
