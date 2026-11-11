import { NextResponse } from 'next/server';
import { getDbAsync, saveDbAsync, logAudit } from '@/lib/db';
import { QueueItem, QueueStatus, TriageLevel } from '@/types';
import { resolveDoctorForSlot } from '@/lib/doctorSchedule';

// Helper to generate next queue number for a doctor code
function generateNextNumber(doctorCode: string, existingQueue: QueueItem[], isEmergency: boolean): string {
  if (isEmergency) {
    const emergCount = existingQueue.filter((q) => q.queueNumber.startsWith('TMP-')).length;
    const num = (emergCount + 1).toString().padStart(4, '0');
    return `TMP-${num}`;
  }

  const prefix = doctorCode.toUpperCase();
  const doctorNums = existingQueue
    .filter((q) => q.queueNumber.startsWith(`${prefix}-`))
    .map((q) => {
      const parts = q.queueNumber.split('-');
      return parseInt(parts[1], 10) || 0;
    });

  const nextVal = (doctorNums.length > 0 ? Math.max(...doctorNums) : 0) + 1;
  return `${prefix}-${nextVal.toString().padStart(3, '0')}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const status = searchParams.get('status');
    const patientId = searchParams.get('patientId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const db = await getDbAsync();
    let items = db.queue.filter((q) => q.bookingDate === date);

    if (doctorId) {
      items = items.filter((q) => q.doctorId === doctorId);
    }
    if (status) {
      items = items.filter((q) => q.status === status);
    }
    if (patientId) {
      items = items.filter((q) => q.patientId === patientId);
    }

    // Sort order:
    // 1. In consultation & Called first
    // 2. Urgent / Priority patients
    // 3. Checked-in & Waiting ordered by checkedInAt / slotTime
    // 4. Booked but not yet checked in
    // 5. Done / Skipped / Cancelled
    const statusWeight: Record<QueueStatus, number> = {
      in_consultation: 1,
      called: 2,
      waiting: 3,
      checked_in: 4,
      booked: 5,
      skipped: 6,
      doctor_unavailable: 7,
      done: 8,
      cancelled: 9,
      no_show: 10,
      not_served: 11,
    };

    items.sort((a, b) => {
      const weightA = statusWeight[a.status] || 99;
      const weightB = statusWeight[b.status] || 99;
      if (weightA !== weightB) return weightA - weightB;

      // Priority boost for waiting/checked_in
      if ((a.status === 'waiting' || a.status === 'checked_in') && (b.status === 'waiting' || b.status === 'checked_in')) {
        if (a.isPriority && !b.isPriority) return -1;
        if (!a.isPriority && b.isPriority) return 1;
      }

      const timeA = new Date(a.checkedInAt || a.createdAt).getTime();
      const timeB = new Date(b.checkedInAt || b.createdAt).getTime();
      return timeA - timeB;
    });

    return NextResponse.json({
      success: true,
      data: items,
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      type, // 'online' | 'walk_in' | 'emergency'
      doctorId,
      patientId,
      patientName,
      patientPhone,
      patientNik,
      patientDob,
      patientGender,
      slotTime,
      bookingDate = new Date().toISOString().split('T')[0],
      isPriority = false,
      priorityReason,
      triageLevel = 'routine',
      triageComplaint,
      companionPhone,
      actorName = 'System',
      actorRole = 'patient',
    } = body;

    const db = await getDbAsync();
    let doctor = db.doctors.find((d) => d.id === doctorId);

    // If online booking, automatically resolve authoritative doctor practicing for the chosen slot and date
    if (type === 'online' && slotTime) {
      const resolved = resolveDoctorForSlot(db.doctors, slotTime, bookingDate, doctorId);
      if (resolved) {
        doctor = resolved;
      }
    }

    if (!doctor) {
      return NextResponse.json({ error: 'Dokter poliklinik tidak ditemukan atau tidak ada jadwal praktik pada sesi tersebut' }, { status: 404 });
    }

    if (!doctor.isAvailable) {
      return NextResponse.json(
        { error: `${doctor.name} sedang berhalangan / tidak tersedia untuk melayani antrean hari ini.` },
        { status: 400 }
      );
    }

    const isEmergency = type === 'emergency' || triageLevel === 'emergency';
    const queueId = `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let queueNumber = '';
    let status: QueueStatus = 'booked';
    let checkedInAt: string | undefined = undefined;
    let bookingCode: string | undefined = undefined;

    if (type === 'online') {
      bookingCode = `BK-${doctor.code}${Math.floor(1000 + Math.random() * 9000)}`;
      status = 'booked';
      // Online booking gets queue number upon check-in per PRD,
      // but we store a placeholder or temp reference
      queueNumber = `PENDING-${bookingCode}`;
    } else {
      // Walk-in and Emergency get number immediately at reception
      queueNumber = generateNextNumber(doctor.code, db.queue, isEmergency);
      status = isEmergency ? 'waiting' : 'checked_in';
      checkedInAt = new Date().toISOString();
    }

    const newQueueItem: QueueItem = {
      id: queueId,
      queueNumber,
      clinicId: db.settings.id,
      doctorId: doctor.id,
      doctorCode: doctor.code,
      doctorName: doctor.name,
      patientId: patientId || `walkin-${Date.now()}`,
      patientName: patientName || (isEmergency ? 'Pasien Darurat' : 'Pasien Umum'),
      patientPhone: patientPhone || companionPhone || '-',
      patientNik,
      patientDob: patientDob || '1990-01-01',
      patientGender: patientGender || 'L',
      type,
      slotTime: type === 'online' ? slotTime : undefined,
      bookingDate,
      status,
      callCount: 0,
      isPriority: isPriority || isEmergency,
      priorityReason: isEmergency ? `Triase Darurat: ${triageComplaint || 'Gawat Darurat Medis'}` : priorityReason,
      triageLevel: triageLevel as TriageLevel,
      triageComplaint,
      companionPhone,
      temporaryId: isEmergency ? queueNumber : undefined,
      bookingCode,
      createdAt: new Date().toISOString(),
      checkedInAt,
    };

    db.queue.push(newQueueItem);
    await saveDbAsync(db);

    logAudit(
      actorName,
      actorRole,
      type === 'emergency' ? 'EMERGENCY_REGISTRATION' : type === 'walk_in' ? 'WALKIN_REGISTRATION' : 'ONLINE_BOOKING',
      'queue',
      `Pendaftaran antrean ${queueNumber} untuk ${newQueueItem.patientName} (${doctor.name})`
    );

    return NextResponse.json({ success: true, item: newQueueItem });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, action, actorName = 'Staf', actorRole = 'front_desk', priorityReason, newSlotTime, newDoctorId } = body;

    const db = await getDbAsync();
    const queueIndex = db.queue.findIndex((q) => q.id === id);

    if (queueIndex === -1) {
      return NextResponse.json({ error: 'Data antrean tidak ditemukan' }, { status: 404 });
    }

    const item = db.queue[queueIndex];
    const now = new Date().toISOString();

    switch (action) {
      case 'check_in': {
        // Issue actual queue number if it was an online booking
        if (item.queueNumber.startsWith('PENDING-') || !item.queueNumber) {
          item.queueNumber = generateNextNumber(item.doctorCode, db.queue, false);
        }
        item.status = 'checked_in';
        item.checkedInAt = now;
        logAudit(actorName, actorRole, 'QUEUE_CHECK_IN', 'queue', `Pasien ${item.patientName} check-in, nomor antrean ${item.queueNumber}`);
        break;
      }

      case 'call': {
        item.callCount += 1;
        item.status = 'called';
        item.calledAt = now;
        logAudit(actorName, actorRole, 'QUEUE_CALL', 'queue', `Memanggil nomor ${item.queueNumber} (panggilan ke-${item.callCount})`);
        break;
      }

      case 'recall': {
        item.callCount += 1;
        item.calledAt = now;
        if (item.callCount >= 3) {
          // PRD rule: called up to 3 times, then marked Skipped
          item.status = 'skipped';
          logAudit(actorName, actorRole, 'QUEUE_MAX_CALLS_SKIPPED', 'queue', `Nomor ${item.queueNumber} telah dipanggil 3 kali, otomatis dilewati (Skipped)`);
        } else {
          item.status = 'called';
          logAudit(actorName, actorRole, 'QUEUE_RECALL', 'queue', `Panggil ulang nomor ${item.queueNumber} (panggilan ke-${item.callCount})`);
        }
        break;
      }

      case 'start_consultation': {
        item.status = 'in_consultation';
        item.consultationStartedAt = now;
        logAudit(actorName, actorRole, 'CONSULTATION_START', 'queue', `Mulai konsultasi dengan ${item.patientName} (${item.queueNumber})`);
        break;
      }

      case 'finish': {
        item.status = 'done';
        item.completedAt = now;
        logAudit(actorName, actorRole, 'QUEUE_FINISH', 'queue', `Selesai konsultasi nomor ${item.queueNumber} (${item.patientName})`);
        break;
      }

      case 'skip': {
        item.status = 'skipped';
        logAudit(actorName, actorRole, 'QUEUE_SKIP', 'queue', `Melewati nomor antrean ${item.queueNumber}`);
        break;
      }

      case 're_enter': {
        // PRD rule: One re-entry at the end of the queue within 30 minutes
        item.status = 'waiting';
        item.callCount = 0;
        item.checkedInAt = now; // Put at end of waiting queue
        logAudit(actorName, actorRole, 'QUEUE_REENTER', 'queue', `Re-entry nomor antrean ${item.queueNumber} ke ujung antrean`);
        break;
      }

      case 'undo_call': {
        // Doctor can recall or undo last call
        item.status = 'waiting';
        if (item.callCount > 0) item.callCount -= 1;
        logAudit(actorName, actorRole, 'QUEUE_UNDO_CALL', 'queue', `Undo panggilan untuk nomor ${item.queueNumber}`);
        break;
      }

      case 'set_priority': {
        if (!priorityReason) {
          return NextResponse.json({ error: 'Alasan prioritas wajib diisi oleh staf' }, { status: 400 });
        }
        item.isPriority = true;
        item.priorityReason = priorityReason;
        logAudit(actorName, actorRole, 'SET_PRIORITY', 'queue', `Prioritas diberikan ke ${item.queueNumber}: ${priorityReason}`);
        break;
      }

      case 'cancel': {
        if (item.status === 'checked_in' && actorRole === 'patient') {
          return NextResponse.json(
            { error: 'Pembatalan setelah check-in hanya dapat dilakukan oleh Front Desk / Resepsionis.' },
            { status: 403 }
          );
        }
        item.status = 'cancelled';
        item.cancelledAt = now;
        logAudit(actorName, actorRole, 'QUEUE_CANCEL', 'queue', `Membatalkan antrean ${item.queueNumber} (${item.patientName})`);
        break;
      }

      case 'reschedule': {
        item.status = 'cancelled';
        item.cancelledAt = now;

        const targetDoctor = newDoctorId
          ? db.doctors.find((d) => d.id === newDoctorId)
          : resolveDoctorForSlot(db.doctors, newSlotTime || item.slotTime || '', item.bookingDate, item.doctorId) ||
            db.doctors.find((d) => d.id === item.doctorId);
        const newBookingCode = `BK-${targetDoctor?.code || item.doctorCode}${Math.floor(1000 + Math.random() * 9000)}`;

        const rescheduledItem: QueueItem = {
          ...item,
          id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          queueNumber: `PENDING-${newBookingCode}`,
          doctorId: targetDoctor?.id || item.doctorId,
          doctorCode: targetDoctor?.code || item.doctorCode,
          doctorName: targetDoctor?.name || item.doctorName,
          slotTime: newSlotTime || item.slotTime,
          status: 'booked',
          bookingCode: newBookingCode,
          callCount: 0,
          checkedInAt: undefined,
          calledAt: undefined,
          completedAt: undefined,
          cancelledAt: undefined,
          createdAt: now,
        };

        db.queue.push(rescheduledItem);
        logAudit(actorName, actorRole, 'QUEUE_RESCHEDULE', 'queue', `Jadwal ulang ${item.patientName} ke slot ${newSlotTime} (${targetDoctor?.name})`);
        break;
      }

      default:
        return NextResponse.json({ error: `Aksi ${action} tidak dikenali` }, { status: 400 });
    }

    db.queue[queueIndex] = item;
    await saveDbAsync(db);

    return NextResponse.json({ success: true, item });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
