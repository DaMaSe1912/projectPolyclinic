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
import { syncToSupabaseAsync, loadFromSupabase } from './supabaseSync';

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

const isVercel = process.env.VERCEL === '1' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
const LOCAL_DATA_DIR = path.join(process.cwd(), 'data');
const LOCAL_DB_FILE = path.join(LOCAL_DATA_DIR, 'db.json');
const DATA_DIR = isVercel ? '/tmp/polyclinic_data' : LOCAL_DATA_DIR;
const DB_FILE = isVercel ? '/tmp/polyclinic_data/db.json' : LOCAL_DB_FILE;

let memoryDb: DatabaseSchema | null = null;

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
    id: 'usr-doc-c',
    name: 'dr. Hendra Wijaya, Sp.JP',
    email: 'dr.hendra@poliklinik.id',
    phone: '08666666666',
    role: 'doctor',
    doctorId: 'doc-c',
    username: 'dr_hendra',
    password: 'DokterHendra2026!',
    passwordSalt: 'c23ffa5124690edaffded4eec3832ed2',
    passwordHash: '8703d27d58185a9b5d4d7fccc620eea14cff55d570c88b73c37b68423ad9c3414335b21d9af2b2d7009808b40c5000d6155a0217044a1f0971d97fc2d5f5923d',
    emailVerified: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-doc-d',
    name: 'dr. Anita Kusuma',
    email: 'dr.anita@poliklinik.id',
    phone: '08777777777',
    role: 'doctor',
    doctorId: 'doc-d',
    username: 'dr_anita',
    password: 'DokterAnita2026!',
    passwordSalt: '4cab8c1eda92dae89f48dd5753f84de1',
    passwordHash: '496f10a42712be3d4eb34aa6233a8eb5ab65103248b97410c2d741259dc8cb191915b41da7bc8368d9680907d85b31d01df56336d7a93c38d2cc60f4ab1d2d6b',
    emailVerified: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-doc-e',
    name: 'dr. Farhan Ramadhan',
    email: 'dr.farhan@poliklinik.id',
    phone: '08888888888',
    role: 'doctor',
    doctorId: 'doc-e',
    username: 'dr_farhan',
    password: 'DokterFarhan2026!',
    passwordSalt: '0149f1f782f09ba4b250777a1093a0e6',
    passwordHash: 'c9215af0acaf9b607985a805d42bcd2d89de791ef501ecc18f4bcfc68ba5bc8545ab55e6628e99363f0218b8de86245ee512c70105047e7ce1cb59494a7d930f',
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
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {
      // Ignored if cannot create (e.g. read-only fallback)
    }
  }
}

export function getDb(): DatabaseSchema {
  if (memoryDb) {
    return memoryDb;
  }
  ensureDataDir();

  // On Vercel, copy initial seeded data from local workspace to writable /tmp
  if (isVercel && !fs.existsSync(DB_FILE) && fs.existsSync(LOCAL_DB_FILE)) {
    try {
      fs.copyFileSync(LOCAL_DB_FILE, DB_FILE);
    } catch (e) {
      console.warn('[DB] Could not copy initial DB to /tmp, will initialize from memory:', e);
    }
  }

  if (!fs.existsSync(DB_FILE)) {
    let initialData: DatabaseSchema;
    if (fs.existsSync(LOCAL_DB_FILE)) {
      try {
        initialData = JSON.parse(fs.readFileSync(LOCAL_DB_FILE, 'utf-8'));
      } catch {
        initialData = {
          settings: INITIAL_SETTINGS,
          doctors: INITIAL_DOCTORS,
          users: INITIAL_USERS,
          queue: INITIAL_QUEUE,
          referrals: INITIAL_REFERRALS,
          auditLogs: INITIAL_AUDIT_LOGS,
          sessions: [],
          mailLog: [],
        };
      }
    } else {
      initialData = {
        settings: INITIAL_SETTINGS,
        doctors: INITIAL_DOCTORS,
        users: INITIAL_USERS,
        queue: INITIAL_QUEUE,
        referrals: INITIAL_REFERRALS,
        auditLogs: INITIAL_AUDIT_LOGS,
        sessions: [],
        mailLog: [],
      };
    }
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    } catch (err: any) {
      console.warn('[DB] Could not write initial DB to disk:', err.message);
    }
    memoryDb = initialData;
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
    memoryDb = data;
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
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(fallback, null, 2), 'utf-8');
    } catch (e: any) {
      console.warn('[DB] Could not write fallback to disk:', e.message);
    }
    memoryDb = fallback;
    return fallback;
  }
}

export function saveDb(data: DatabaseSchema): void {
  memoryDb = data;
  lastSupabaseFetchTime = Date.now();
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('[DB] Write to disk suppressed (serverless read-only mode):', err.message);
  }
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    syncToSupabaseAsync(data).catch((err) => {
      console.error('[DB] Supabase async sync error:', err);
    });
  }
}

let lastSupabaseFetchTime = 0;
const SUPABASE_CACHE_TTL_MS = 1000;

/**
 * Loads the database, prioritizing Supabase Cloud PostgreSQL when available.
 * Guarantees all distributed serverless instances on Vercel see identical data.
 */
export async function getDbAsync(): Promise<DatabaseSchema> {
  const now = Date.now();
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && now - lastSupabaseFetchTime > SUPABASE_CACHE_TTL_MS) {
    const cloudDb = await loadFromSupabase();
    if (cloudDb && cloudDb.users && cloudDb.users.length > 0) {
      memoryDb = cloudDb;
      lastSupabaseFetchTime = now;
      try {
        ensureDataDir();
        fs.writeFileSync(DB_FILE, JSON.stringify(cloudDb, null, 2), 'utf-8');
      } catch {}
      return cloudDb;
    } else if (cloudDb === null) {
      // First boot on Supabase: Seed cloud tables with local baseline data
      const localData = getDb();
      await syncToSupabaseAsync(localData);
      lastSupabaseFetchTime = now;
      return localData;
    }
  }

  return getDb();
}

/**
 * Saves database updates to both local fallback and Supabase Cloud synchronously.
 * Guarantees data persistence before serverless lambda execution freezes.
 */
export async function saveDbAsync(data: DatabaseSchema): Promise<void> {
  memoryDb = data;
  lastSupabaseFetchTime = Date.now();
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('[DB] Write to disk suppressed:', err.message);
  }
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    await syncToSupabaseAsync(data);
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
