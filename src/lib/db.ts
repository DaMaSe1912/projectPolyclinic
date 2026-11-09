import fs from 'fs';
import path from 'path';
import {
  UserAccount,
  Doctor,
  QueueItem,
  Referral,
  AuditLog,
  ClinicSettings,
  QueueStatus,
  TriageLevel,
  SessionRecord,
  DevEmail,
} from '@/types';
import { syncToSupabaseAsync } from './supabaseSync';

export interface DatabaseSchema {
  settings: ClinicSettings;
  doctors: Doctor[];
  users: UserAccount[];
  queue: QueueItem[];
  referrals: Referral[];
  auditLogs: AuditLog[];
  sessions: SessionRecord[];
  mailLog: DevEmail[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const INITIAL_SETTINGS: ClinicSettings = {
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

const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'doc-a',
    code: 'A',
    name: 'dr. Budi Santoso, Sp.PD',
    specialty: 'Spesialis Penyakit Dalam (Konsultasi Medis Lanjut)',
    room: 'Ruang Poli Umum 1',
    isOnDuty: true,
    isAvailable: true,
    scheduleDays: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
    shiftHours: '08:30 - 12:30',
    consultationMinutes: 20,
  },
  {
    id: 'doc-b',
    code: 'B',
    name: 'dr. Siti Rahma, Sp.A',
    specialty: 'Spesialis Anak & Tumbuh Kembang Keluarga',
    room: 'Ruang Poli Umum 2',
    isOnDuty: true,
    isAvailable: true,
    scheduleDays: ['Senin', 'Rabu', 'Jumat', 'Sabtu'],
    shiftHours: '13:00 - 17:00',
    consultationMinutes: 20,
  },
  {
    id: 'doc-c',
    code: 'C',
    name: 'dr. Hendra Wijaya, Sp.JP',
    specialty: 'Spesialis Jantung & Pembuluh Darah (Kardiovaskular)',
    room: 'Ruang Poli Umum 1',
    isOnDuty: false,
    isAvailable: true,
    scheduleDays: ['Selasa', 'Kamis'],
    shiftHours: '13:00 - 17:00',
    consultationMinutes: 25,
  },
  {
    id: 'doc-d',
    code: 'D',
    name: 'dr. Anita Kusuma',
    specialty: 'Dokter Umum & Pemeriksaan Kesehatan (MCU)',
    room: 'Ruang Poli Umum 2',
    isOnDuty: false,
    isAvailable: true,
    scheduleDays: ['Selasa', 'Kamis'],
    shiftHours: '08:30 - 12:30',
    consultationMinutes: 20,
  },
  {
    id: 'doc-e',
    code: 'E',
    name: 'dr. Farhan Ramadhan',
    specialty: 'Dokter Umum & Layanan Primer Keluarga',
    room: 'Ruang Poli Umum 1',
    isOnDuty: false,
    isAvailable: true,
    scheduleDays: ['Sabtu', 'Minggu'],
    shiftHours: '09:00 - 14:00',
    consultationMinutes: 15,
  },
];

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-admin',
    name: 'Ahmad Pratama, S.Kom',
    email: 'admin@poliklinik.id',
    phone: '08111111111',
    role: 'admin',
    username: 'admin',
    password: 'AdminUtama2026!#',
    passwordSalt: '1e6e1e521a63828d9de4c8eb13f514da',
    passwordHash: '42284f3c455cc36c97cdeddb1498756376e2c996721d90f650090c1dd5eab72cf877ebf9f18579942f2fb882cfa05f45babb0f8779eccd88f6c9681c7b446280',
    emailVerified: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    twoFactorEnabled: true,
    twoFactorSecret: 'JBSWY3DPEHPK3PXP',
    recoveryCodes: ['RECOV-1A2B-3C4D', 'RECOV-5E6F-7G8H', 'RECOV-9I0J-1K2L', 'RECOV-3M4N-5O6P'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-frontdesk',
    name: 'Dewi Lestari (Resepsionis)',
    email: 'resepsionis@poliklinik.id',
    phone: '08222222222',
    role: 'front_desk',
    username: 'resepsionis',
    password: 'StafFrontDesk2026!',
    passwordSalt: '2af1c123fa6697aaee8f1998e8e5be30',
    passwordHash: '53137d1cc567a8d88acbf6ebd082cef835d98e496367b17c19b385ee4b0082f3c5c8221b355c25f58f7a91a384fe4ead2e3f0e4afd9dc7ee05b8cfd532bf1b3e',
    emailVerified: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-doc-a',
    name: 'dr. Budi Santoso, Sp.PD',
    email: 'dr.budi@poliklinik.id',
    phone: '08333333333',
    role: 'doctor',
    doctorId: 'doc-a',
    username: 'dr_budi',
    password: 'DokterBudi2026!',
    passwordSalt: '2b13d6058434462a998df62ecca2a2d4',
    passwordHash: '8838592239c0a41e95e2c85eed935d491754d227d6f9db7d79f815b1f862e6b26d5eed847b3ab95a24da5a94857b52cd31066534c908406e23d71a04fe56d5f3',
    emailVerified: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-doc-b',
    name: 'dr. Siti Rahma, Sp.A',
    email: 'dr.siti@poliklinik.id',
    phone: '08444444444',
    role: 'doctor',
    doctorId: 'doc-b',
    username: 'dr_siti',
    password: 'DokterSiti2026!',
    passwordSalt: '1ea81a05b252ad9bb1fcbb8dd6861a85',
    passwordHash: '7cba39b5e34bf28c280f855a180d9b742751fddd9199babb045c5b021e6cec37393f46cf7141dc29227654eee7ce243fa79b2e6b51e47984fb25b06e7fea1bda',
    emailVerified: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-nurse',
    name: 'Ns. Maya Putri, S.Kep',
    email: 'perawat.maya@poliklinik.id',
    phone: '08555555555',
    role: 'nurse',
    username: 'perawat_maya',
    password: 'PerawatMaya2026!',
    passwordSalt: 'c3b31d3488a8f8f788b9d686065159f1',
    passwordHash: '52be27a4cca73783637d66dd8135ca576f90775306e050ad2184bfda0fbfa458d0f93af2bee1131363635e4bebcca4fb8797591db5cd0c929179ea29b8aac541',
    emailVerified: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-patient-1',
    name: 'Bambang Wijaya',
    email: 'bambang.wijaya@gmail.com',
    phone: '081234567890',
    nik: '3171012304850001',
    dob: '1985-04-23',
    gender: 'L',
    role: 'patient',
    password: 'PasienBambang123',
    passwordSalt: 'ed7740c7c619e39708e6776106498d9c',
    passwordHash: '79ef53c411846626599bfd3db3b6bbf4c2423d22753ff3a81b505cb0b279a103eb39a5268d1acf8f4028a98b5a6612404fabfe23c574a1af089547f3d052a76a',
    emailVerified: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    isActive: true,
    familyMembers: [
      {
        id: 'fam-1-self',
        name: 'Bambang Wijaya',
        nik: '3171012304850001',
        dob: '1985-04-23',
        gender: 'L',
        relationship: 'Diri Sendiri',
      },
      {
        id: 'fam-1-child',
        name: 'Anisa Wijaya',
        nik: '3171016509140002',
        dob: '2014-09-25',
        gender: 'P',
        relationship: 'Anak',
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-patient-2',
    name: 'Ibu Ratna Kumala',
    email: 'ratna.kumala@gmail.com',
    phone: '087812345678',
    nik: '3171025501500003',
    dob: '1950-01-15',
    gender: 'P',
    role: 'patient',
    password: 'PasienRatna123',
    passwordSalt: 'cb9552167e96a29c1c3683f673a01921',
    passwordHash: '527f5807409d3682cea2033c23d677af075b05b3036d4f42c5aa86dca6a68908f3d304c1f1f7ba84067e2da60cd64ae0f918f3eadcb778bec7f1d8413302248b',
    emailVerified: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    isActive: true,
    familyMembers: [
      {
        id: 'fam-2-self',
        name: 'Ibu Ratna Kumala',
        nik: '3171025501500003',
        dob: '1950-01-15',
        gender: 'P',
        relationship: 'Diri Sendiri',
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

const todayStr = new Date().toISOString().split('T')[0];

const INITIAL_QUEUE: QueueItem[] = [
  {
    id: 'q-001',
    queueNumber: 'A-001',
    clinicId: 'clinic-utama-01',
    doctorId: 'doc-a',
    doctorCode: 'A',
    doctorName: 'dr. Budi Santoso, Sp.PD',
    patientId: 'usr-patient-1',
    patientName: 'Bambang Wijaya',
    patientPhone: '081234567890',
    patientNik: '3171012304850001',
    patientDob: '1985-04-23',
    patientGender: 'L',
    type: 'online',
    slotTime: '08:30 - 09:00',
    bookingDate: todayStr,
    status: 'in_consultation',
    callCount: 1,
    isPriority: false,
    bookingCode: 'BK-A0830',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    checkedInAt: new Date(Date.now() - 1800000).toISOString(),
    calledAt: new Date(Date.now() - 600000).toISOString(),
    consultationStartedAt: new Date(Date.now() - 500000).toISOString(),
  },
  {
    id: 'q-002',
    queueNumber: 'A-002',
    clinicId: 'clinic-utama-01',
    doctorId: 'doc-a',
    doctorCode: 'A',
    doctorName: 'dr. Budi Santoso, Sp.PD',
    patientId: 'usr-patient-2',
    patientName: 'Ibu Ratna Kumala',
    patientPhone: '087812345678',
    patientNik: '3171025501500003',
    patientDob: '1950-01-15',
    patientGender: 'P',
    type: 'walk_in',
    bookingDate: todayStr,
    status: 'waiting',
    callCount: 0,
    isPriority: true,
    priorityReason: 'Lansia (Usia > 70 tahun)',
    createdAt: new Date(Date.now() - 1500000).toISOString(),
    checkedInAt: new Date(Date.now() - 1500000).toISOString(),
  },
  {
    id: 'q-003',
    queueNumber: 'A-003',
    clinicId: 'clinic-utama-01',
    doctorId: 'doc-a',
    doctorCode: 'A',
    doctorName: 'dr. Budi Santoso, Sp.PD',
    patientId: 'usr-patient-3',
    patientName: 'Dimas Satria',
    patientPhone: '081399887766',
    patientNik: '3171031202950004',
    patientDob: '1995-02-12',
    patientGender: 'L',
    type: 'online',
    slotTime: '09:00 - 09:30',
    bookingDate: todayStr,
    status: 'checked_in',
    callCount: 0,
    isPriority: false,
    bookingCode: 'BK-A0900',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    checkedInAt: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: 'q-004',
    queueNumber: 'B-001',
    clinicId: 'clinic-utama-01',
    doctorId: 'doc-b',
    doctorCode: 'B',
    doctorName: 'dr. Siti Rahma, Sp.A',
    patientId: 'usr-patient-4',
    patientName: 'Clara Veronica',
    patientPhone: '081912344321',
    patientNik: '3171044405010005',
    patientDob: '2001-05-04',
    patientGender: 'P',
    type: 'online',
    slotTime: '13:00 - 13:30',
    bookingDate: todayStr,
    status: 'checked_in',
    callCount: 0,
    isPriority: false,
    bookingCode: 'BK-B1300',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    checkedInAt: new Date(Date.now() - 300000).toISOString(),
  },
];

const INITIAL_REFERRALS: Referral[] = [
  {
    id: 'ref-001',
    queueId: 'q-demo-ref',
    patientName: 'Hendra Gunawan',
    patientNik: '3171051508820008',
    patientDob: '1982-08-15',
    patientGender: 'L',
    patientPhone: '081298765432',
    allergies: 'Alergi Penisilin',
    relevantMedicalRecord: 'Hipertensi urgensi dengan tekanan darah 180/110 mmHg disertai pusing berputar dan riwayat diabetes melitus.',
    reason: 'Memerlukan penanganan spesialis penyakit dalam rawat inap dan pemantauan kardiovaskular lanjutan.',
    destinationHospital: 'RSUD Tarakan Jakarta Pusat',
    initiatedBy: 'nurse',
    nurseName: 'Ns. Maya Putri, S.Kep',
    status: 'approved',
    approvingDoctorId: 'doc-a',
    approvingDoctorName: 'dr. Budi Santoso, Sp.PD',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    approvedAt: new Date(Date.now() - 7000000).toISOString(),
    printedAt: new Date(Date.now() - 6900000).toISOString(),
  },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-001',
    timestamp: new Date(Date.now() - 8000000).toISOString(),
    actorName: 'Ahmad Pratama (IT Admin)',
    actorRole: 'admin',
    action: 'SYSTEM_INIT',
    targetType: 'system',
    details: 'Inisialisasi sistem antrean Poliklinik Umum versi 1.0',
  },
  {
    id: 'aud-002',
    timestamp: new Date(Date.now() - 7000000).toISOString(),
    actorName: 'dr. Budi Santoso, Sp.PD',
    actorRole: 'doctor',
    action: 'REFERRAL_APPROVED',
    targetType: 'referral',
    details: 'Menyetujui surat rujukan pasien Hendra Gunawan ke RSUD Tarakan',
  },
];

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getDb(): DatabaseSchema {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      settings: INITIAL_SETTINGS,
      doctors: INITIAL_DOCTORS,
      users: INITIAL_USERS,
      queue: INITIAL_QUEUE,
      referrals: INITIAL_REFERRALS,
      auditLogs: INITIAL_AUDIT_LOGS,
      sessions: [],
      mailLog: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const data: DatabaseSchema = JSON.parse(content);
    if (!data.sessions) data.sessions = [];
    if (!data.mailLog) data.mailLog = [];

    // Ensure seed users have email and security fields populated
    let modified = false;
    for (const initUser of INITIAL_USERS) {
      const idx = data.users.findIndex((u) => u.id === initUser.id);
      if (idx === -1) {
        data.users.push(initUser);
        modified = true;
      } else {
        const u = data.users[idx];
        if (!u.email || !u.passwordHash || u.emailVerified === undefined) {
          data.users[idx] = {
            ...initUser,
            ...u,
            email: initUser.email,
            password: initUser.password,
            passwordHash: initUser.passwordHash,
            passwordSalt: initUser.passwordSalt,
            emailVerified: true,
            failedLoginAttempts: 0,
            lockedUntil: null,
            twoFactorEnabled: initUser.twoFactorEnabled,
            twoFactorSecret: initUser.twoFactorSecret,
            recoveryCodes: initUser.recoveryCodes,
            isActive: true,
          };
          modified = true;
        }
      }
    }
    if (modified) {
      saveDb(data);
    }
    return data;
  } catch (err) {
    console.error('Error reading DB, re-initializing:', err);
    const fallback: DatabaseSchema = {
      settings: INITIAL_SETTINGS,
      doctors: INITIAL_DOCTORS,
      users: INITIAL_USERS,
      queue: INITIAL_QUEUE,
      referrals: INITIAL_REFERRALS,
      auditLogs: INITIAL_AUDIT_LOGS,
      sessions: [],
      mailLog: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
}

export function saveDb(data: DatabaseSchema): void {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    syncToSupabaseAsync(data).catch((err) => {
      console.error('[DB] Supabase async sync error:', err);
    });
  }
}

export function logAudit(
  actorName: string,
  actorRole: any,
  action: string,
  targetType: 'queue' | 'patient' | 'doctor' | 'referral' | 'system' | 'backup',
  details: string
): void {
  const db = getDb();
  const log: AuditLog = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    actorName,
    actorRole,
    action,
    targetType,
    details,
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }
  saveDb(db);
}
