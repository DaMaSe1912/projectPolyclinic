export type UserRole = 
  | 'guest'
  | 'patient'
  | 'front_desk'
  | 'doctor'
  | 'nurse'
  | 'admin';

export interface FamilyMember {
  id: string;
  name: string;
  nik?: string;
  dob: string;
  gender: 'L' | 'P';
  relationship: 'Diri Sendiri' | 'Anak' | 'Orang Tua' | 'Pasangan' | 'Lainnya';
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  nik?: string;
  dob?: string;
  gender?: 'L' | 'P';
  role: UserRole;
  username?: string;
  password?: string; // legacy or demo display
  passwordHash?: string;
  passwordSalt?: string;
  doctorId?: string; // if role is doctor
  familyMembers?: FamilyMember[];
  isMerged?: boolean;
  mergedIntoId?: string;
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiresAt?: string;
  resetPasswordToken?: string;
  resetPasswordTokenExpiresAt?: string;
  failedLoginAttempts: number;
  lockedUntil?: string | null;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string; // base32 for TOTP
  recoveryCodes?: string[];
  isActive?: boolean;
  createdAt: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  role: UserRole;
  email: string;
  name: string;
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string;
  userAgent?: string;
}

export interface DevEmail {
  id: string;
  to: string;
  subject: string;
  title: string;
  body: string;
  link?: string;
  type: 'verification' | 'password_reset' | 'staff_welcome';
  sentAt: string;
}

export interface Doctor {
  id: string;
  code: string; // 'A', 'B', 'C', 'D', 'E'
  name: string;
  specialty: string;
  room: string;
  isOnDuty: boolean;
  isAvailable: boolean;
  scheduleDays: string[];
  shiftHours: string;
  consultationMinutes: number;
}

export type QueueStatus =
  | 'booked'              // Online booking confirmed
  | 'checked_in'          // Patient checked in at polyclinic
  | 'waiting'             // In waiting room
  | 'called'              // Doctor/Nurse calling number
  | 'in_consultation'     // Inside doctor room
  | 'done'                // Consultation finished
  | 'skipped'             // Skipped after 3 calls
  | 'cancelled'           // Cancelled before consultation
  | 'no_show'             // Exceeded 30 min after skipped
  | 'not_served'          // Unserved at closing time
  | 'doctor_unavailable'; // Doctor unavailable / cancelled session

export type QueueType = 'online' | 'walk_in' | 'emergency';

export type TriageLevel = 'routine' | 'urgent' | 'emergency';

export interface QueueItem {
  id: string;
  queueNumber: string; // e.g. A-001, B-002, TMP-0042
  clinicId: string; // prepared for multi-clinic future
  doctorId: string;
  doctorCode: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientNik?: string;
  patientDob: string;
  patientGender?: 'L' | 'P';
  type: QueueType;
  slotTime?: string; // e.g. "08:30 - 09:00"
  bookingDate: string; // YYYY-MM-DD
  status: QueueStatus;
  callCount: number; // 0, 1, 2, 3
  isPriority: boolean;
  priorityReason?: string;
  triageLevel?: TriageLevel;
  triageComplaint?: string;
  companionPhone?: string;
  temporaryId?: string;
  bookingCode?: string;
  createdAt: string;
  checkedInAt?: string;
  calledAt?: string;
  consultationStartedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  notes?: string;
}

export interface Referral {
  id: string;
  queueId: string;
  patientName: string;
  patientNik?: string;
  patientDob: string;
  patientGender?: 'L' | 'P';
  patientPhone: string;
  allergies?: string;
  relevantMedicalRecord: string;
  reason: string;
  destinationHospital: string;
  initiatedBy: 'nurse' | 'doctor';
  nurseName?: string;
  status: 'pending_doctor_approval' | 'approved' | 'rejected';
  approvingDoctorId?: string;
  approvingDoctorName?: string;
  createdAt: string;
  approvedAt?: string;
  printedAt?: string;
  departureTime?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetType: 'queue' | 'patient' | 'doctor' | 'referral' | 'system' | 'backup';
  details: string;
  ip?: string;
}

export interface ClinicSettings {
  id: string;
  name: string;
  polyclinicName: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
  isOpenToday: boolean;
  checkInOpensMinutesBefore: number; // 60 mins
  cancellationCutoffHours: number;    // 2 hours
  rescheduleHoldSlotHours: number;    // 24 hours
  maxBookingHorizonDays: number;      // 30 days
  lastBackupAt?: string;
}
