import { getSupabaseAdmin } from './supabase';
import {
  Doctor,
  QueueItem,
  Referral,
  UserAccount,
  ClinicSettings,
  AuditLog,
  SessionRecord,
  DevEmail,
} from '@/types';
import type { DatabaseSchema } from './db';

export function mapUserToDb(u: UserAccount) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    nik: u.nik,
    dob: u.dob,
    gender: u.gender,
    role: u.role,
    username: u.username,
    password: u.password,
    password_hash: u.passwordHash,
    password_salt: u.passwordSalt,
    doctor_id: u.doctorId || null,
    family_members: u.familyMembers || [],
    is_merged: u.isMerged || false,
    merged_into_id: u.mergedIntoId || null,
    email_verified: u.emailVerified || false,
    verification_token: u.verificationToken || null,
    verification_token_expires_at: u.verificationTokenExpiresAt || null,
    reset_password_token: u.resetPasswordToken || null,
    reset_password_token_expires_at: u.resetPasswordTokenExpiresAt || null,
    failed_login_attempts: u.failedLoginAttempts || 0,
    locked_until: u.lockedUntil || null,
    two_factor_enabled: u.twoFactorEnabled || false,
    two_factor_secret: u.twoFactorSecret || null,
    recovery_codes: u.recoveryCodes || [],
    is_active: u.isActive !== undefined ? u.isActive : true,
    created_at: u.createdAt || new Date().toISOString(),
  };
}

export function mapUserFromDb(row: any): UserAccount {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    nik: row.nik,
    dob: row.dob,
    gender: row.gender,
    role: row.role,
    username: row.username,
    password: row.password,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    doctorId: row.doctor_id,
    familyMembers: row.family_members || [],
    isMerged: row.is_merged,
    mergedIntoId: row.merged_into_id,
    emailVerified: row.email_verified,
    verificationToken: row.verification_token,
    verificationTokenExpiresAt: row.verification_token_expires_at,
    resetPasswordToken: row.reset_password_token,
    resetPasswordTokenExpiresAt: row.reset_password_token_expires_at,
    failedLoginAttempts: row.failed_login_attempts || 0,
    lockedUntil: row.locked_until,
    twoFactorEnabled: row.two_factor_enabled,
    twoFactorSecret: row.two_factor_secret || (row.role === 'admin' ? 'JBSWY3DPEHPK3PXP' : undefined),
    recoveryCodes: Array.isArray(row.recovery_codes)
      ? row.recovery_codes
      : typeof row.recovery_codes === 'string'
      ? (() => {
          try {
            const p = JSON.parse(row.recovery_codes);
            return Array.isArray(p) ? p : [];
          } catch {
            return [];
          }
        })()
      : row.role === 'admin'
      ? ['RECOV-1A2B-3C4D', 'RECOV-5E6F-7G8H', 'RECOV-9I0J-1K2L', 'RECOV-3M4N-5O6P']
      : [],
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export function mapQueueToDb(q: QueueItem) {
  return {
    id: q.id,
    queue_number: q.queueNumber,
    clinic_id: q.clinicId || 'clinic-utama-01',
    doctor_id: q.doctorId,
    doctor_code: q.doctorCode,
    doctor_name: q.doctorName,
    patient_id: q.patientId || null,
    patient_name: q.patientName,
    patient_phone: q.patientPhone,
    patient_nik: q.patientNik || null,
    patient_dob: q.patientDob,
    patient_gender: q.patientGender || null,
    type: q.type,
    slot_time: q.slotTime || null,
    booking_date: q.bookingDate,
    status: q.status,
    call_count: q.callCount || 0,
    is_priority: q.isPriority || false,
    priority_reason: q.priorityReason || null,
    triage_level: q.triageLevel || null,
    triage_complaint: q.triageComplaint || null,
    companion_phone: q.companionPhone || null,
    temporary_id: q.temporaryId || null,
    booking_code: q.bookingCode || null,
    created_at: q.createdAt || new Date().toISOString(),
    checked_in_at: q.checkedInAt || null,
    called_at: q.calledAt || null,
    consultation_started_at: q.consultationStartedAt || null,
    completed_at: q.completedAt || null,
    cancelled_at: q.cancelledAt || null,
    notes: q.notes || null,
  };
}

export function mapQueueFromDb(row: any): QueueItem {
  return {
    id: row.id,
    queueNumber: row.queue_number,
    clinicId: row.clinic_id,
    doctorId: row.doctor_id,
    doctorCode: row.doctor_code,
    doctorName: row.doctor_name,
    patientId: row.patient_id,
    patientName: row.patient_name,
    patientPhone: row.patient_phone,
    patientNik: row.patient_nik,
    patientDob: row.patient_dob,
    patientGender: row.patient_gender,
    type: row.type,
    slotTime: row.slot_time,
    bookingDate: row.booking_date,
    status: row.status,
    callCount: row.call_count || 0,
    isPriority: row.is_priority || false,
    priorityReason: row.priority_reason,
    triageLevel: row.triage_level,
    triageComplaint: row.triage_complaint,
    companionPhone: row.companion_phone,
    temporaryId: row.temporary_id,
    bookingCode: row.booking_code,
    createdAt: row.created_at,
    checkedInAt: row.checked_in_at,
    calledAt: row.called_at,
    consultationStartedAt: row.consultation_started_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    cancelledBy: row.notes?.toLowerCase().includes('pasien') ? 'Pasien' : row.notes?.toLowerCase().includes('petugas') ? 'Petugas' : undefined,
    cancelledByRole: row.notes?.toLowerCase().includes('pasien') ? 'patient' : row.notes?.toLowerCase().includes('petugas') ? 'front_desk' : undefined,
    notes: row.notes,
  };
}

export function mapDoctorToDb(d: Doctor) {
  return {
    id: d.id,
    code: d.code,
    name: d.name,
    specialty: d.specialty,
    room: d.room,
    is_on_duty: d.isOnDuty,
    is_available: d.isAvailable,
    schedule_days: d.scheduleDays,
    shift_hours: d.shiftHours,
    consultation_minutes: d.consultationMinutes,
  };
}

export function mapDoctorFromDb(row: any): Doctor {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    specialty: row.specialty,
    room: row.room,
    isOnDuty: row.is_on_duty,
    isAvailable: row.is_available,
    scheduleDays: row.schedule_days || [],
    shiftHours: row.shift_hours,
    consultationMinutes: row.consultation_minutes || 20,
  };
}

export function mapReferralToDb(r: Referral) {
  return {
    id: r.id,
    queue_id: r.queueId,
    patient_name: r.patientName,
    patient_nik: r.patientNik || null,
    patient_dob: r.patientDob,
    patient_gender: r.patientGender || null,
    patient_phone: r.patientPhone,
    allergies: r.allergies || null,
    relevant_medical_record: r.relevantMedicalRecord,
    reason: r.reason,
    destination_hospital: r.destinationHospital,
    initiated_by: r.initiatedBy,
    nurse_name: r.nurseName || null,
    status: r.status,
    approving_doctor_id: r.approvingDoctorId || null,
    approving_doctor_name: r.approvingDoctorName || null,
    created_at: r.createdAt || new Date().toISOString(),
    approved_at: r.approvedAt || null,
    printed_at: r.printedAt || null,
    departure_time: r.departureTime || null,
  };
}

export function mapReferralFromDb(row: any): Referral {
  return {
    id: row.id,
    queueId: row.queue_id,
    patientName: row.patient_name,
    patientNik: row.patient_nik,
    patientDob: row.patient_dob,
    patientGender: row.patient_gender,
    patientPhone: row.patient_phone,
    allergies: row.allergies,
    relevantMedicalRecord: row.relevant_medical_record,
    reason: row.reason,
    destinationHospital: row.destination_hospital,
    initiatedBy: row.initiated_by,
    nurseName: row.nurse_name,
    status: row.status,
    approvingDoctorId: row.approving_doctor_id,
    approvingDoctorName: row.approving_doctor_name,
    createdAt: row.created_at,
    approvedAt: row.approved_at,
    printedAt: row.printed_at,
    departureTime: row.departure_time,
  };
}

export function mapAuditLogToDb(a: AuditLog) {
  return {
    id: a.id,
    timestamp: a.timestamp,
    actor_name: a.actorName,
    actor_role: a.actorRole,
    action: a.action,
    target_type: a.targetType,
    details: a.details,
    ip: a.ip || null,
  };
}

export function mapAuditLogFromDb(row: any): AuditLog {
  return {
    id: row.id,
    timestamp: row.timestamp,
    actorName: row.actor_name,
    actorRole: row.actor_role,
    action: row.action,
    targetType: row.target_type,
    details: row.details,
    ip: row.ip,
  };
}

export function mapSessionToDb(s: SessionRecord) {
  return {
    id: s.id,
    user_id: s.userId,
    role: s.role,
    email: s.email,
    name: s.name,
    created_at: s.createdAt,
    expires_at: s.expiresAt,
    last_active_at: s.lastActiveAt,
    user_agent: s.userAgent || null,
  };
}

export function mapSessionFromDb(row: any): SessionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    role: row.role,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    lastActiveAt: row.last_active_at,
    userAgent: row.user_agent,
  };
}

export function mapMailToDb(m: DevEmail) {
  return {
    id: m.id,
    to_email: m.to,
    subject: m.subject,
    title: m.title,
    body: m.body,
    link: m.link || null,
    type: m.type,
    sent_at: m.sentAt,
  };
}

export function mapMailFromDb(row: any): DevEmail {
  return {
    id: row.id,
    to: row.to_email,
    subject: row.subject,
    title: row.title,
    body: row.body,
    link: row.link,
    type: row.type,
    sentAt: row.sent_at,
  };
}

/**
 * Async background sync from in-memory / local state to Supabase.
 */
export async function syncToSupabaseAsync(db: DatabaseSchema) {
  try {
    const supabase = getSupabaseAdmin();

    // Sync settings
    if (db.settings) {
      await supabase.from('clinic_settings').upsert({
        id: db.settings.id,
        name: db.settings.name,
        polyclinic_name: db.settings.polyclinicName,
        address: db.settings.address,
        phone: db.settings.phone,
        open_time: db.settings.openTime,
        close_time: db.settings.closeTime,
        is_open_today: db.settings.isOpenToday,
        check_in_opens_minutes_before: db.settings.checkInOpensMinutesBefore,
        cancellation_cutoff_hours: db.settings.cancellationCutoffHours,
        reschedule_hold_slot_hours: db.settings.rescheduleHoldSlotHours,
        max_booking_horizon_days: db.settings.maxBookingHorizonDays,
        last_backup_at: db.settings.lastBackupAt,
      });
    }

    // Sync doctors
    if (db.doctors?.length) {
      await supabase.from('doctors').upsert(db.doctors.map(mapDoctorToDb));
    }

    // Sync users
    if (db.users?.length) {
      await supabase.from('users').upsert(db.users.map(mapUserToDb));
    }

    // Sync queue
    if (db.queue?.length) {
      await supabase.from('queue').upsert(db.queue.map(mapQueueToDb));
    }

    // Sync referrals
    if (db.referrals?.length) {
      await supabase.from('referrals').upsert(db.referrals.map(mapReferralToDb));
    }

    // Sync recent audit logs (last 50)
    if (db.auditLogs?.length) {
      await supabase.from('audit_logs').upsert(db.auditLogs.slice(0, 50).map(mapAuditLogToDb));
    }

    // Sync sessions
    if (db.sessions?.length) {
      await supabase.from('sessions').upsert(db.sessions.map(mapSessionToDb));
    }

    // Sync mail log (last 20)
    if (db.mailLog?.length) {
      await supabase.from('mail_log').upsert(db.mailLog.slice(0, 20).map(mapMailToDb));
    }
  } catch (err: any) {
    console.error('[SupabaseSync] Error syncing to Supabase:', err.message);
  }
}

/**
 * Load complete database schema directly from Supabase.
 * Returns null if Supabase is unreachable or unseeded.
 */
export async function loadFromSupabase(): Promise<DatabaseSchema | null> {
  try {
    const supabase = getSupabaseAdmin();

    const [
      settingsRes,
      doctorsRes,
      usersRes,
      queueRes,
      referralsRes,
      auditRes,
      sessionsRes,
      mailRes,
    ] = await Promise.all([
      supabase.from('clinic_settings').select('*').limit(1),
      supabase.from('doctors').select('*'),
      supabase.from('users').select('*'),
      supabase.from('queue').select('*'),
      supabase.from('referrals').select('*'),
      supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200),
      supabase.from('sessions').select('*'),
      supabase.from('mail_log').select('*').order('sent_at', { ascending: false }).limit(50),
    ]);

    if (usersRes.error || doctorsRes.error) {
      console.warn('[SupabaseSync] Query error from Supabase:', usersRes.error || doctorsRes.error);
      return null;
    }

    // If Supabase has no users and no doctors, it needs initial seeding
    if ((!usersRes.data || usersRes.data.length === 0) && (!doctorsRes.data || doctorsRes.data.length === 0)) {
      return null;
    }

    const settingsRow = settingsRes.data?.[0];
    const settings: ClinicSettings = settingsRow
      ? {
          id: settingsRow.id,
          name: settingsRow.name,
          polyclinicName: settingsRow.polyclinic_name,
          address: settingsRow.address,
          phone: settingsRow.phone,
          openTime: settingsRow.open_time,
          closeTime: settingsRow.close_time,
          isOpenToday: settingsRow.is_open_today,
          checkInOpensMinutesBefore: settingsRow.check_in_opens_minutes_before,
          cancellationCutoffHours: settingsRow.cancellation_cutoff_hours,
          rescheduleHoldSlotHours: settingsRow.reschedule_hold_slot_hours,
          maxBookingHorizonDays: settingsRow.max_booking_horizon_days,
          lastBackupAt: settingsRow.last_backup_at,
        }
      : {
          id: 'clinic-utama-01',
          name: 'Klinik Pratama Sehat Utama',
          polyclinicName: 'Poliklinik Umum (General Clinic)',
          address: 'Jl. Kesehatan Raya No. 128, Jakarta Pusat',
          phone: '021-5550192',
          openTime: '08:00',
          closeTime: '17:00',
          isOpenToday: true,
          checkInOpensMinutesBefore: 60,
          cancellationCutoffHours: 2,
          rescheduleHoldSlotHours: 24,
          maxBookingHorizonDays: 30,
          lastBackupAt: new Date().toISOString(),
        };

    const doctors: Doctor[] = (doctorsRes.data || []).map(mapDoctorFromDb);
    const users: UserAccount[] = (usersRes.data || []).map(mapUserFromDb);
    const queue: QueueItem[] = (queueRes.data || []).map(mapQueueFromDb);
    const referrals: Referral[] = (referralsRes.data || []).map(mapReferralFromDb);
    const auditLogs: AuditLog[] = (auditRes.data || []).map(mapAuditLogFromDb);
    const sessions: SessionRecord[] = (sessionsRes.data || []).map(mapSessionFromDb);
    const mailLog: DevEmail[] = (mailRes.data || []).map(mapMailFromDb);

    return {
      settings,
      doctors,
      users,
      queue,
      referrals,
      auditLogs,
      sessions,
      mailLog,
    };
  } catch (err: any) {
    console.warn('[SupabaseSync] Could not load from Supabase:', err.message);
    return null;
  }
}
