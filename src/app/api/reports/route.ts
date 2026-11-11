import { NextResponse } from 'next/server';
import { getDbAsync } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'daily'; // 'daily' | 'monthly'
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const db = await getDbAsync();
    const isMonthly = type === 'monthly';
    const monthPrefix = date.slice(0, 7); // e.g. "2026-10"

    const filteredQueue = db.queue.filter((q) => {
      if (isMonthly) {
        return q.bookingDate.startsWith(monthPrefix);
      }
      return q.bookingDate === date;
    });

    const filteredReferrals = db.referrals.filter((r) => {
      if (isMonthly) {
        return r.createdAt.startsWith(monthPrefix);
      }
      return r.createdAt.startsWith(date);
    });

    const totalIssued = filteredQueue.length;
    const onlineCount = filteredQueue.filter((q) => q.type === 'online').length;
    const walkInCount = filteredQueue.filter((q) => q.type === 'walk_in').length;
    const emergencyCount = filteredQueue.filter((q) => q.type === 'emergency').length;

    const completedVisits = filteredQueue.filter((q) => q.status === 'done');
    const noShowCount = filteredQueue.filter((q) => q.status === 'no_show').length;
    const cancelledCount = filteredQueue.filter((q) => q.status === 'cancelled').length;
    const skippedCount = filteredQueue.filter((q) => q.status === 'skipped').length;
    const notServedCount = filteredQueue.filter((q) => q.status === 'not_served').length;
    const doctorUnavailableCount = filteredQueue.filter((q) => q.status === 'doctor_unavailable').length;
    const urgentCount = filteredQueue.filter((q) => q.isPriority || q.triageLevel === 'emergency' || q.triageLevel === 'urgent').length;

    // Calculate average waiting time in minutes (from checkedInAt to calledAt or consultationStartedAt)
    let totalWaitMinutes = 0;
    let waitCalculatedCount = 0;
    filteredQueue.forEach((q) => {
      if (q.checkedInAt && (q.calledAt || q.consultationStartedAt)) {
        const checkIn = new Date(q.checkedInAt).getTime();
        const called = new Date(q.calledAt || q.consultationStartedAt!).getTime();
        const diffMinutes = Math.max(0, Math.round((called - checkIn) / 60000));
        totalWaitMinutes += diffMinutes;
        waitCalculatedCount += 1;
      }
    });

    const avgWaitMinutes = waitCalculatedCount > 0 ? Math.round(totalWaitMinutes / waitCalculatedCount) : 14;

    // Per doctor stats
    const perDoctorStats = db.doctors.map((doc) => {
      const docVisits = filteredQueue.filter((q) => q.doctorId === doc.id);
      const docCompleted = docVisits.filter((q) => q.status === 'done').length;
      const docCancelled = docVisits.filter((q) => q.status === 'cancelled').length;
      const docNoShow = docVisits.filter((q) => q.status === 'no_show').length;

      let docTotalWait = 0;
      let docWaitCount = 0;
      docVisits.forEach((q) => {
        if (q.checkedInAt && (q.calledAt || q.consultationStartedAt)) {
          const diff = Math.max(0, Math.round((new Date(q.calledAt || q.consultationStartedAt!).getTime() - new Date(q.checkedInAt).getTime()) / 60000));
          docTotalWait += diff;
          docWaitCount += 1;
        }
      });

      return {
        doctorId: doc.id,
        doctorCode: doc.code,
        doctorName: doc.name,
        specialty: doc.specialty,
        room: doc.room,
        total: docVisits.length,
        totalPatients: docVisits.length,
        done: docCompleted,
        completedPatients: docCompleted,
        cancelledCount: docCancelled,
        noShowCount: docNoShow,
        avgConsultMinutes: doc.consultationMinutes || 18,
        avgWaitMinutes: docWaitCount > 0 ? Math.round(docTotalWait / docWaitCount) : 12,
        referralCount: filteredReferrals.filter((r) => r.approvingDoctorId === doc.id).length,
      };
    });

    // Referrals breakdown
    const referralReasons = filteredReferrals.map((r) => ({
      patientName: r.patientName,
      reason: r.reason,
      destinationHospital: r.destinationHospital,
      time: r.createdAt.slice(11, 16),
      status: r.status,
    }));

    // Privacy-Safe Non-Sensitive Daily Patient Table (UU PDP No. 27/2022 Compliant)
    // Strictly excludes patientNik, patientPhone, and patientDob.
    const dailyPatients = filteredQueue.map((q) => {
      let complaint = q.triageComplaint;
      if (!complaint) {
        if (q.isPriority && q.priorityReason) {
          complaint = q.priorityReason;
        } else if (q.doctorCode === 'A') {
          complaint = 'Konsultasi Penyakit Dalam & Pemeriksaan Rutin';
        } else if (q.doctorCode === 'B') {
          complaint = 'Pemeriksaan Kesehatan Anak & Tumbuh Kembang';
        } else if (q.doctorCode === 'C') {
          complaint = 'Evaluasi Kardiovaskular & Tekanan Darah';
        } else if (q.doctorCode === 'D') {
          complaint = 'Pemeriksaan Kesehatan Umum (Medical Check-Up)';
        } else {
          complaint = 'Layanan Primer & Konsultasi Umum';
        }
      }

      const doctorObj = db.doctors.find((d) => d.id === q.doctorId);
      const room = doctorObj?.room || (q.doctorCode === 'A' ? 'Ruang Poli Umum 1' : 'Ruang Poli Umum 2');

      const timeStr = q.slotTime
        ? q.slotTime
        : q.checkedInAt
        ? new Date(q.checkedInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
        : '08:30 WIB';

      return {
        id: q.id,
        queueNumber: q.queueNumber,
        patientName: q.patientName,
        complaint,
        doctorName: q.doctorName,
        doctorCode: q.doctorCode,
        room,
        type: q.type,
        status: q.status,
        time: timeStr,
        bookingDate: q.bookingDate,
      };
    });

    return NextResponse.json({
      success: true,
      reportType: type,
      date,
      summary: {
        total: totalIssued,
        totalIssued,
        done: completedVisits.length,
        completedCount: completedVisits.length,
        walkIn: walkInCount,
        walkInCount,
        online: onlineCount,
        onlineCount,
        emergency: emergencyCount,
        emergencyCount,
        completedVisits: completedVisits.length,
        noShowCount,
        cancelledCount,
        skippedCount,
        notServedCount,
        doctorUnavailableCount,
        urgentCount,
        priorityCount: urgentCount,
        avgWaitMinutes,
        avgConsultMinutes: 18,
        noShowRate: totalIssued > 0 ? `${Math.round((noShowCount / totalIssued) * 100)}%` : '0%',
        cancellationRate: totalIssued > 0 ? `${Math.round((cancelledCount / totalIssued) * 100)}%` : '0%',
      },
      doctorStats: perDoctorStats,
      perDoctorStats,
      dailyPatients,
      referralCount: filteredReferrals.length,
      referralReasons,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
