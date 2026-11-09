import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local if present
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('🚀 Memulai migrasi data dari data/db.json ke Supabase...');
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  if (!fs.existsSync(dbPath)) {
    console.error('❌ data/db.json tidak ditemukan.');
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

  // 1. Clinic Settings
  if (rawData.settings) {
    const s = rawData.settings;
    const { error } = await supabase.from('clinic_settings').upsert({
      id: s.id,
      name: s.name,
      polyclinic_name: s.polyclinicName,
      address: s.address,
      phone: s.phone,
      open_time: s.openTime,
      close_time: s.closeTime,
      is_open_today: s.isOpenToday,
      check_in_opens_minutes_before: s.checkInOpensMinutesBefore,
      cancellation_cutoff_hours: s.cancellationCutoffHours,
      reschedule_hold_slot_hours: s.rescheduleHoldSlotHours,
      max_booking_horizon_days: s.maxBookingHorizonDays,
      last_backup_at: s.lastBackupAt,
    });
    if (error) console.error('Error clinic_settings:', error.message);
    else console.log('✅ clinic_settings berhasil dimigrasi.');
  }

  // 2. Doctors
  if (Array.isArray(rawData.doctors)) {
    const doctors = rawData.doctors.map((d) => ({
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
    }));
    const { error } = await supabase.from('doctors').upsert(doctors);
    if (error) console.error('Error doctors:', error.message);
    else console.log(`✅ ${doctors.length} doctors berhasil dimigrasi.`);
  }

  // 3. Users
  const userList = Array.isArray(rawData.users) ? [...rawData.users] : [];
  
  // Ensure demo patients exist so queue foreign keys are satisfied
  if (!userList.find(u => u.id === 'usr-patient-3')) {
    userList.push({
      id: 'usr-patient-3',
      name: 'Dimas Satria',
      email: 'dimas.satria@gmail.com',
      phone: '081399887766',
      nik: '3171031202950004',
      dob: '1995-02-12',
      gender: 'L',
      role: 'patient',
      emailVerified: true,
      isActive: true,
    });
  }
  if (!userList.find(u => u.id === 'usr-patient-4')) {
    userList.push({
      id: 'usr-patient-4',
      name: 'Clara Veronica',
      email: 'clara.veronica@gmail.com',
      phone: '081912344321',
      nik: '3171044405010005',
      dob: '2001-05-04',
      gender: 'P',
      role: 'patient',
      emailVerified: true,
      isActive: true,
    });
  }

  const users = userList.map((u) => ({
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
  }));

  const { error: userErr } = await supabase.from('users').upsert(users);
  if (userErr) console.error('Error users:', userErr.message);
  else console.log(`✅ ${users.length} users berhasil dimigrasi.`);

  const validUserIds = new Set(users.map((u) => u.id));

  // 4. Queue
  if (Array.isArray(rawData.queue)) {
    const queueItems = rawData.queue.map((q) => ({
      id: q.id,
      queue_number: q.queueNumber,
      clinic_id: q.clinicId || 'clinic-utama-01',
      doctor_id: q.doctorId,
      doctor_code: q.doctorCode,
      doctor_name: q.doctorName,
      patient_id: q.patientId && validUserIds.has(q.patientId) ? q.patientId : null,
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
    }));
    const { error } = await supabase.from('queue').upsert(queueItems);
    if (error) console.error('Error queue:', error.message);
    else console.log(`✅ ${queueItems.length} antrean berhasil dimigrasi.`);
  }

  // 5. Referrals
  if (Array.isArray(rawData.referrals)) {
    const referrals = rawData.referrals.map((r) => ({
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
    }));
    const { error } = await supabase.from('referrals').upsert(referrals);
    if (error) console.error('Error referrals:', error.message);
    else console.log(`✅ ${referrals.length} referrals berhasil dimigrasi.`);
  }

  // 6. Audit Logs
  if (Array.isArray(rawData.auditLogs)) {
    const logs = rawData.auditLogs.map((a) => ({
      id: a.id,
      timestamp: a.timestamp,
      actor_name: a.actorName,
      actor_role: a.actorRole,
      action: a.action,
      target_type: a.targetType,
      details: a.details,
      ip: a.ip || null,
    }));
    const { error } = await supabase.from('audit_logs').upsert(logs);
    if (error) console.error('Error audit_logs:', error.message);
    else console.log(`✅ ${logs.length} audit logs berhasil dimigrasi.`);
  }

  console.log('🎉 Migrasi selesai!');
}

migrate();

