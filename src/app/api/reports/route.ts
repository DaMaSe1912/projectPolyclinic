import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'daily'; // 'daily' | 'monthly'
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const db = getDb();
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
        totalPatients: docVisits.length,
        completedPatients: docCompleted,
        cancelledCount: docCancelled,
        noShowCount: docNoShow,
        avgWaitMinutes: docWaitCount > 0 ? Math.round(docTotalWait / docWaitCount) : 12,
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

    return NextResponse.json({
      success: true,
      reportType: type,
      date,
      summary: {
        totalIssued,
        onlineCount,
        walkInCount,
        emergencyCount,
        completedCount: completedVisits.length,
        noShowCount,
        cancelledCount,
        skippedCount,
        notServedCount,
        doctorUnavailableCount,
        urgentCount,
        avgWaitMinutes,
        noShowRate: totalIssued > 0 ? `${Math.round((noShowCount / totalIssued) * 100)}%` : '0%',
        cancellationRate: totalIssued > 0 ? `${Math.round((cancelledCount / totalIssued) * 100)}%` : '0%',
      },
      perDoctorStats,
      referralCount: filteredReferrals.length,
      referralReasons,
      rawQueue: filteredQueue,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
