-- ====================================================================
-- POLIKLINIK UMUM (GENERAL CLINIC) - SUPABASE POSTGRESQL SCHEMA
-- ====================================================================

-- 1. CLINIC SETTINGS
CREATE TABLE IF NOT EXISTS clinic_settings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  polyclinic_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  open_time TEXT NOT NULL DEFAULT '08:00',
  close_time TEXT NOT NULL DEFAULT '17:00',
  is_open_today BOOLEAN NOT NULL DEFAULT TRUE,
  check_in_opens_minutes_before INT NOT NULL DEFAULT 60,
  cancellation_cutoff_hours INT NOT NULL DEFAULT 2,
  reschedule_hold_slot_hours INT NOT NULL DEFAULT 24,
  max_booking_horizon_days INT NOT NULL DEFAULT 30,
  last_backup_at TIMESTAMPTZ
);

-- 2. DOCTORS (5 Master Doctors, max 2 on-duty at same time)
CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY,
  code VARCHAR(5) NOT NULL,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  room TEXT NOT NULL,
  is_on_duty BOOLEAN NOT NULL DEFAULT FALSE,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  schedule_days JSONB NOT NULL DEFAULT '[]'::jsonb,
  shift_hours TEXT NOT NULL,
  consultation_minutes INT NOT NULL DEFAULT 20
);

-- 3. USERS (Patients, Staff Front Desk, Doctors, Nurses, Admin)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  nik TEXT,
  dob TEXT,
  gender VARCHAR(2),
  role VARCHAR(20) NOT NULL,
  username TEXT,
  password TEXT,
  password_hash TEXT,
  password_salt TEXT,
  doctor_id TEXT REFERENCES doctors(id) ON DELETE SET NULL,
  family_members JSONB DEFAULT '[]'::jsonb,
  is_merged BOOLEAN DEFAULT FALSE,
  merged_into_id TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  verification_token_expires_at TIMESTAMPTZ,
  reset_password_token TEXT,
  reset_password_token_expires_at TIMESTAMPTZ,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMPTZ,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  recovery_codes JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. QUEUE (Realtime Queue for Walk-in & Online Bookings)
CREATE TABLE IF NOT EXISTS queue (
  id TEXT PRIMARY KEY,
  queue_number TEXT NOT NULL,
  clinic_id TEXT NOT NULL DEFAULT 'clinic-utama-01',
  doctor_id TEXT REFERENCES doctors(id) ON DELETE RESTRICT,
  doctor_code VARCHAR(5) NOT NULL,
  doctor_name TEXT NOT NULL,
  patient_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_nik TEXT,
  patient_dob TEXT NOT NULL,
  patient_gender VARCHAR(2),
  type VARCHAR(20) NOT NULL,
  slot_time TEXT,
  booking_date DATE NOT NULL,
  status VARCHAR(30) NOT NULL,
  call_count INT DEFAULT 0,
  is_priority BOOLEAN DEFAULT FALSE,
  priority_reason TEXT,
  triage_level VARCHAR(20),
  triage_complaint TEXT,
  companion_phone TEXT,
  temporary_id TEXT,
  booking_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  checked_in_at TIMESTAMPTZ,
  called_at TIMESTAMPTZ,
  consultation_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  notes TEXT
);

-- 5. REFERRALS (Surat Rujukan Eksternal)
CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  queue_id TEXT,
  patient_name TEXT NOT NULL,
  patient_nik TEXT,
  patient_dob TEXT NOT NULL,
  patient_gender VARCHAR(2),
  patient_phone TEXT NOT NULL,
  allergies TEXT,
  relevant_medical_record TEXT NOT NULL,
  reason TEXT NOT NULL,
  destination_hospital TEXT NOT NULL,
  initiated_by VARCHAR(20) NOT NULL,
  nurse_name TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending_doctor_approval',
  approving_doctor_id TEXT,
  approving_doctor_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  printed_at TIMESTAMPTZ,
  departure_time TIMESTAMPTZ
);

-- 6. AUDIT LOGS (Compliance & Security Audit Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  actor_name TEXT NOT NULL,
  actor_role VARCHAR(20) NOT NULL,
  action TEXT NOT NULL,
  target_type VARCHAR(20) NOT NULL,
  details TEXT NOT NULL,
  ip TEXT
);

-- 7. SESSIONS (Server-side Session Store with Idle Timeout)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_active_at TIMESTAMPTZ NOT NULL,
  user_agent TEXT
);

-- 8. MAIL LOG (In-App Dev Mailbox Log)
CREATE TABLE IF NOT EXISTS mail_log (
  id TEXT PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  type VARCHAR(30) NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES for fast lookup
CREATE INDEX IF NOT EXISTS idx_queue_booking_date_status ON queue (booking_date, status);
CREATE INDEX IF NOT EXISTS idx_queue_doctor ON queue (doctor_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs (timestamp DESC);

-- ENABLE SUPABASE REALTIME on queue table (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'queue'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE queue;
  END IF;
END $$;

