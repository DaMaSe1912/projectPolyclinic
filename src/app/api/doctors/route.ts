import { NextResponse } from 'next/server';
import { getDbAsync, saveDbAsync, logAudit } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDbAsync();
    const todayStr = new Date().toISOString().split('T')[0];

    // Enrich each doctor with today's queue count
    const doctorsWithStats = db.doctors.map((doc) => {
      const activeVisits = db.queue.filter(
        (q) =>
          q.doctorId === doc.id &&
          q.bookingDate === todayStr &&
          ['in_consultation', 'called', 'waiting', 'checked_in'].includes(q.status)
      );
      const bookedCount = db.queue.filter(
        (q) => q.doctorId === doc.id && q.bookingDate === todayStr && q.status === 'booked'
      ).length;

      return {
        ...doc,
        currentWaitingCount: activeVisits.length,
        todayBookedCount: bookedCount,
      };
    });

    return NextResponse.json({ success: true, data: doctorsWithStats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { doctorId, isOnDuty, isAvailable, actorName = 'Admin', actorRole = 'admin' } = body;

    const db = await getDbAsync();
    const docIndex = db.doctors.findIndex((d) => d.id === doctorId);

    if (docIndex === -1) {
      return NextResponse.json({ error: 'Dokter tidak ditemukan' }, { status: 404 });
    }

    const doctor = db.doctors[docIndex];
    const todayStr = new Date().toISOString().split('T')[0];

    // Check affected patients if setting unavailable or off-duty
    const affectedQueue = db.queue.filter(
      (q) =>
        q.doctorId === doctor.id &&
        q.bookingDate === todayStr &&
        ['booked', 'checked_in', 'waiting'].includes(q.status)
    );

    if (isAvailable === false && doctor.isAvailable === true) {
      // Mark active queues as 'doctor_unavailable' per PRD
      affectedQueue.forEach((q) => {
        q.status = 'doctor_unavailable';
      });
      logAudit(
        actorName,
        actorRole,
        'DOCTOR_UNAVAILABLE',
        'doctor',
        `${doctor.name} dinyatakan tidak tersedia. ${affectedQueue.length} pasien terdampak.`
      );
    }

    if (typeof isOnDuty === 'boolean') {
      doctor.isOnDuty = isOnDuty;
    }
    if (typeof isAvailable === 'boolean') {
      doctor.isAvailable = isAvailable;
    }

    db.doctors[docIndex] = doctor;
    await saveDbAsync(db);

    logAudit(
      actorName,
      actorRole,
      'DOCTOR_STATUS_UPDATE',
      'doctor',
      `Status ${doctor.name} diperbarui: duty=${doctor.isOnDuty}, available=${doctor.isAvailable}`
    );

    return NextResponse.json({
      success: true,
      doctor,
      affectedPatientsCount: affectedQueue.length,
      affectedPatients: affectedQueue.map((p) => ({
        id: p.id,
        name: p.patientName,
        queueNumber: p.queueNumber,
        phone: p.patientPhone,
        status: p.status,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
