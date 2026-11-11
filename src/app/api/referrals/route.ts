import { NextResponse } from 'next/server';
import { getDbAsync, saveDbAsync, logAudit } from '@/lib/db';
import { Referral } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const db = await getDbAsync();
    let referrals = db.referrals;

    if (status) {
      referrals = referrals.filter((r) => r.status === status);
    }

    return NextResponse.json({ success: true, data: referrals });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      queueId,
      patientName,
      patientNik,
      patientDob,
      patientGender,
      patientPhone,
      allergies,
      relevantMedicalRecord,
      reason,
      destinationHospital,
      initiatedBy = 'nurse',
      nurseName = 'Perawat Poliklinik',
      actorName = 'Perawat',
      actorRole = 'nurse',
    } = body;

    if (!patientName || !reason || !destinationHospital) {
      return NextResponse.json(
        { error: 'Nama pasien, alasan rujukan, dan rumah sakit tujuan wajib diisi' },
        { status: 400 }
      );
    }

    const db = await getDbAsync();
    const newReferral: Referral = {
      id: `ref-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      queueId: queueId || `q-ref-${Date.now()}`,
      patientName,
      patientNik,
      patientDob: patientDob || '1990-01-01',
      patientGender: patientGender || 'L',
      patientPhone: patientPhone || '-',
      allergies: allergies || 'Tidak ada riwayat alergi yang dilaporkan',
      relevantMedicalRecord: relevantMedicalRecord || 'Kondisi klinis memerlukan rujukan lebih lanjut',
      reason,
      destinationHospital,
      initiatedBy,
      nurseName,
      status: initiatedBy === 'doctor' ? 'approved' : 'pending_doctor_approval',
      approvingDoctorName: initiatedBy === 'doctor' ? actorName : undefined,
      createdAt: new Date().toISOString(),
      approvedAt: initiatedBy === 'doctor' ? new Date().toISOString() : undefined,
    };

    db.referrals.unshift(newReferral);
    await saveDbAsync(db);

    logAudit(
      actorName,
      actorRole,
      'REFERRAL_CREATED',
      'referral',
      `Surat rujukan dibuat untuk ${patientName} ke ${destinationHospital}. Status: ${newReferral.status}`
    );

    return NextResponse.json({ success: true, referral: newReferral });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, action, doctorId, doctorName, actorName = 'Dokter', actorRole = 'doctor' } = body;

    const db = await getDbAsync();
    const refIndex = db.referrals.findIndex((r) => r.id === id);

    if (refIndex === -1) {
      return NextResponse.json({ error: 'Surat rujukan tidak ditemukan' }, { status: 404 });
    }

    const referral = db.referrals[refIndex];
    const now = new Date().toISOString();

    if (action === 'approve') {
      referral.status = 'approved';
      referral.approvingDoctorId = doctorId;
      referral.approvingDoctorName = doctorName || actorName;
      referral.approvedAt = now;

      logAudit(
        actorName,
        actorRole,
        'REFERRAL_APPROVED',
        'referral',
        `Surat rujukan untuk ${referral.patientName} telah disetujui oleh ${referral.approvingDoctorName}`
      );
    } else if (action === 'reject') {
      referral.status = 'rejected';
      logAudit(
        actorName,
        actorRole,
        'REFERRAL_REJECTED',
        'referral',
        `Surat rujukan untuk ${referral.patientName} ditolak`
      );
    } else if (action === 'log_print') {
      referral.printedAt = now;
      logAudit(
        actorName,
        actorRole,
        'REFERRAL_PRINTED',
        'referral',
        `Cetak surat rujukan untuk ${referral.patientName} ke ${referral.destinationHospital}`
      );
    }

    db.referrals[refIndex] = referral;
    await saveDbAsync(db);

    return NextResponse.json({ success: true, referral });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
