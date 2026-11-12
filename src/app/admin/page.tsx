"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Doctor, AuditLog, UserAccount } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import * as XLSX from 'xlsx';
import {
  ShieldCheck,
  Database,
  Download,
  Upload,
  Users,
  GitMerge,
  FileSpreadsheet,
  FileText,
  Activity,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Lock,
  Mail,
  KeyRound,
  ShieldAlert,
  Sparkles,
  UserPlus,
  UserX,
  UserCheck,
  Clock,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
  Search,
  Filter,
  ClipboardList,
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { user, role, isLoading: authLoading, login } = useAuth();

  // Admin Login States
  const [adminEmail, setAdminEmail] = useState('admin@poliklinik.id');
  const [adminPassword, setAdminPassword] = useState('AdminUtama2026!#');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [loginStep, setLoginStep] = useState<'credentials' | '2fa'>('credentials');
  const [tempToken, setTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isRecoveryCode, setIsRecoveryCode] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState<number | null>(null);
  const [showDemoHelper, setShowDemoHelper] = useState(false);

  // Live TOTP Demo Helper
  const [liveTotp, setLiveTotp] = useState<{
    secret: string;
    totpCode: string;
    secondsLeft: number;
    recoveryCodes: string[];
  } | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(30);

  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<
    'reports' | 'master_doctors' | 'duplicates' | 'backup' | 'audit' | 'staff_mgmt'
  >('reports');

  // Reports state
  const [reportType, setReportType] = useState<'daily' | 'monthly'>('daily');
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientDoctorFilter, setPatientDoctorFilter] = useState('all');

  // Doctors Master State
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Duplicates State
  const [duplicateGroups, setDuplicateGroups] = useState<any[]>([]);
  const [mergeLoading, setMergeLoading] = useState(false);

  // Backup & Restore State
  const [backupRestoreFile, setBackupRestoreFile] = useState<string>('');
  const [restoreStatus, setRestoreStatus] = useState<string>('');
  const [restoreLoading, setRestoreLoading] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Staff Management State
  const [staffList, setStaffList] = useState<UserAccount[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'front_desk' | 'doctor' | 'nurse'>('front_desk');
  const [newStaffDoctorId, setNewStaffDoctorId] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('PoliklinikUtama2026!');
  const [addStaffError, setAddStaffError] = useState('');
  const [addStaffLoading, setAddStaffLoading] = useState(false);

  // Fetch demo TOTP code for live preview
  const fetchDemoTotp = async () => {
    try {
      const res = await fetch(`/api/auth/demo-totp?_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data && data.totpCode) {
        setLiveTotp(data);
        if (typeof data.secondsLeft === 'number') {
          setCountdownSeconds(data.secondsLeft);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDemoTotp();

    const timer = setInterval(() => {
      const epoch = Math.floor(Date.now() / 1000);
      const remaining = 30 - (epoch % 30);
      setCountdownSeconds(remaining);

      // Re-fetch when countdown hits boundary or every 15s to guarantee fresh TOTP
      if (remaining === 30 || remaining === 15) {
        fetchDemoTotp();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch Reports
  const fetchReport = async () => {
    setReportLoading(true);
    try {
      const res = await fetch(`/api/reports?type=${reportType}&date=${reportDate}`);
      const data = await res.json();
      if (data.success) setReportData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setReportLoading(false);
    }
  };

  // Filtered daily patients (Non-sensitive display)
  const filteredDailyPatients = (reportData?.dailyPatients || []).filter((p: any) => {
    const matchesDoctor = patientDoctorFilter === 'all' || p.doctorCode === patientDoctorFilter;
    const matchesSearch =
      !patientSearchQuery.trim() ||
      p.patientName.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
      p.complaint.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
      p.queueNumber.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
      p.doctorName.toLowerCase().includes(patientSearchQuery.toLowerCase());
    return matchesDoctor && matchesSearch;
  });

  // Export Daily/Monthly Patient Data to Excel (Non-Sensitive)
  const handleExportNonSensitiveExcel = () => {
    if (!reportData?.dailyPatients || reportData.dailyPatients.length === 0) {
      alert('Tidak ada data pasien untuk diekspor pada periode ini.');
      return;
    }

    const exportRows = filteredDailyPatients.map((p: any, idx: number) => ({
      No: idx + 1,
      'No. Antrean': p.queueNumber,
      'Nama Pasien': p.patientName,
      'Keluhan / Alasan Kunjungan': p.complaint,
      'Dokter Pemeriksa': p.doctorName,
      'Ruang / Poli': p.room,
      'Waktu Kunjungan': p.time,
      'Jenis Kunjungan': p.type === 'walk_in' ? 'Walk-in' : p.type === 'online' ? 'Online' : 'Darurat',
      Status:
        p.status === 'done'
          ? 'Selesai'
          : p.status === 'calling'
          ? 'Dipanggil'
          : p.status === 'consulting'
          ? 'Konsultasi'
          : p.status === 'waiting'
          ? 'Menunggu'
          : p.status === 'cancelled'
          ? 'Batal'
          : p.status === 'skipped'
          ? 'Dilewati'
          : p.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Pasien');
    XLSX.writeFile(workbook, `Laporan_Pasien_${reportDate}_NonSensitif.xlsx`);
  };

  // Fetch Doctors
  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors');
      const data = await res.json();
      if (data.success) setDoctors(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Duplicates
  const fetchDuplicates = async () => {
    try {
      const res = await fetch('/api/admin/merge-duplicates');
      const data = await res.json();
      if (data.success) setDuplicateGroups(data.duplicateGroups);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      if (data.success) setAuditLogs(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Staff List
  const fetchStaffList = async () => {
    setStaffLoading(true);
    try {
      const res = await fetch('/api/admin/staff');
      const data = await res.json();
      if (data.success) setStaffList(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setStaffLoading(false);
    }
  };

  useEffect(() => {
    if (user && role === 'admin') {
      fetchReport();
      fetchDoctors();
      fetchDuplicates();
      fetchAuditLogs();
      fetchStaffList();
    }
  }, [user, role]);

  // Handle Admin Step 1: Submit Credentials
  const handleAdminCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    setIsLocked(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portal: 'admin',
          email: adminEmail.trim(),
          password: adminPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.isLocked) {
          setIsLocked(true);
          setRemainingMinutes(data.remainingMinutes);
        }
        throw new Error(data.error);
      }

      if (data.require2FA) {
        setTempToken(data.tempToken || '');
        setLoginStep('2fa');
        setLoginError('');
      } else {
        login(data.user);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Gagal masuk');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Admin Step 2: Submit 2FA Code
  const handleAdmin2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    if (!tempToken) {
      setLoginError('Sesi verifikasi kata sandi telah kedaluwarsa. Silakan masukkan kata sandi Anda kembali.');
      setLoginStep('credentials');
      setLoginLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail.trim(),
          code: twoFactorCode.trim(),
          isRecoveryCode,
          tempToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      login(data.user);
    } catch (err: any) {
      setLoginError(err.message || 'Verifikasi 2FA gagal');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Create Staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStaffLoading(true);
    setAddStaffError('');

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStaffName,
          email: newStaffEmail,
          phone: newStaffPhone,
          role: newStaffRole,
          doctorId: newStaffRole === 'doctor' ? newStaffDoctorId : undefined,
          password: newStaffPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsAddStaffOpen(false);
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPhone('');
      fetchStaffList();
      fetchAuditLogs();
      alert('Akun staf baru berhasil dibuat dan didaftarkan.');
    } catch (err: any) {
      setAddStaffError(err.message || 'Gagal membuat akun staf');
    } finally {
      setAddStaffLoading(false);
    }
  };

  // Handle Toggle Active Staff
  const handleToggleStaffActive = async (id: string, currentActive: boolean) => {
    const action = currentActive ? 'menonaktifkan' : 'mengaktifkan kembali';
    if (!confirm(`Apakah Anda yakin ingin ${action} akun staf ini?`)) return;

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      fetchStaffList();
      fetchAuditLogs();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Handle Unlock Staff Account
  const handleUnlockStaff = async (id: string) => {
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, unlock: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      fetchStaffList();
      fetchAuditLogs();
      alert('Akun staf berhasil dibuka kuncinya.');
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Download Encrypted Backup
  const handleDownloadBackup = async () => {
    try {
      const res = await fetch('/api/admin/backup');
      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server mengembalikan respon tidak valid (Status HTTP ${res.status})`);
      }
      if (!res.ok || !data.success) {
        throw new Error(data?.error || `Gagal mengekspor backup (Status ${res.status})`);
      }

      const blob = new Blob([data.encryptedPayload], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename || `backup-polyclinic-${new Date().toISOString().split('T')[0]}.enc`;
      a.click();
      URL.revokeObjectURL(url);
      fetchAuditLogs();
    } catch (e: any) {
      alert('Gagal mendownload backup: ' + e.message);
    }
  };

  // Test Restore Backup
  const handleRestoreBackup = async () => {
    if (!backupRestoreFile.trim()) {
      alert('Silakan tempelkan konten file backup terenkripsi terlebih dahulu.');
      return;
    }
    setRestoreLoading(true);
    setRestoreStatus('');
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encryptedPayload: backupRestoreFile.trim(),
          dryRun: true,
          actorName: user?.name,
          actorRole: 'admin',
        }),
      });
      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server mengembalikan respon tidak valid (Status HTTP ${res.status})`);
      }
      if (!res.ok) throw new Error(data?.error || `Gagal memulihkan backup (Status ${res.status})`);

      setRestoreStatus(`Sukses: ${data.message} (${data.stats?.queueCount || 0} antrean, ${data.stats?.doctorCount || 0} dokter, ${data.stats?.referralCount || 0} rujukan)`);
      fetchAuditLogs();
    } catch (e: any) {
      setRestoreStatus(`Gagal restore: ${e.message}`);
    } finally {
      setRestoreLoading(false);
    }
  };

  // Merge duplicates
  const handleMerge = async (primaryId: string, secondaryId: string) => {
    if (!confirm('Apakah Anda yakin ingin menggabungkan akun duplikat ini? Akun sekunder akan ditandai Merged dan riwayatnya dialihkan ke akun primer.')) return;
    setMergeLoading(true);
    try {
      const res = await fetch('/api/admin/merge-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryPatientId: primaryId,
          secondaryPatientId: secondaryId,
          actorName: user?.name,
          actorRole: 'admin',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message);
      fetchDuplicates();
      fetchAuditLogs();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setMergeLoading(false);
    }
  };

  // Toggle Doctor onDuty / Available
  const handleDoctorToggle = async (doctorId: string, field: 'isOnDuty' | 'isAvailable', currentValue: boolean) => {
    try {
      await fetch('/api/doctors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId,
          [field]: !currentValue,
          actorName: user?.name,
          actorRole: 'admin',
        }),
      });
      fetchDoctors();
      fetchAuditLogs();
    } catch (e) {
      console.error(e);
    }
  };

  // If user is logged in as another role (not admin), redirect to Access Denied
  useEffect(() => {
    if (!authLoading && user && role !== 'admin') {
      router.push('/access-denied');
    }
  }, [user, role, authLoading, router]);

  // If unauthenticated, render Super Admin Sign-in Screen (with 2FA)
  if (!authLoading && (!user || role !== 'admin')) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 py-12 bg-[#0F172A] text-slate-100">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex w-14 h-14 rounded-[16px] bg-[#1E293B] text-[#CA8A04] items-center justify-center font-bold text-2xl mb-3 shadow-lg border border-slate-700">
              <ShieldCheck size={30} />
            </div>
            <h1 className="text-2xl font-headline font-bold text-white">
              Portal Super Admin (IT Admin)
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Pusat Kendali Sistem Poliklinik • Autentikasi 2 Faktor Wajib
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px]">
              <Clock size={12} />
              <span>Sesi idle 15 menit • 2FA TOTP & Recovery Code</span>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-[#1E293B] p-6 sm:p-8 rounded-[16px] shadow-2xl border border-slate-700">
            {loginError && (
              <div
                className={`p-3 rounded-[8px] text-xs flex items-start gap-2 mb-4 ${
                  isLocked
                    ? 'bg-amber-950/50 border border-amber-500/50 text-amber-200'
                    : 'bg-red-950/50 border border-red-500/50 text-red-200'
                }`}
              >
                {isLocked ? (
                  <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-400" />
                ) : (
                  <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-400" />
                )}
                <div>
                  <div className="font-semibold">{loginError}</div>
                  {isLocked && (
                    <div className="text-[11px] mt-1 text-amber-300">
                      Akun Super Admin terkunci selama 15 menit demi keamanan server.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 1: CREDENTIALS */}
            {loginStep === 'credentials' && (
              <form onSubmit={handleAdminCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Alamat Email Super Admin
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@poliklinik.id"
                      required
                      disabled={loginLoading || isLocked}
                      className="w-full px-3 py-2.5 pl-9 rounded-[8px] bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#CA8A04] transition-all disabled:opacity-50"
                    />
                    <Mail size={16} className="absolute left-3 top-3 text-slate-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kata Sandi (Minimal 12 Karakter)
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      disabled={loginLoading || isLocked}
                      className="w-full px-3 py-2.5 pl-9 pr-10 rounded-[8px] bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#CA8A04] transition-all disabled:opacity-50"
                    />
                    <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      disabled={loginLoading || isLocked}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors p-0.5 rounded focus:outline-none"
                      title={showAdminPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      aria-label={showAdminPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    >
                      {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading || isLocked}
                  className="w-full py-2.5 px-4 bg-[#CA8A04] hover:bg-[#A16207] text-slate-950 font-bold text-sm rounded-[8px] transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>{loginLoading ? 'Memeriksa...' : 'Lanjutkan ke Verifikasi 2FA'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* STEP 2: 2FA VERIFICATION */}
            {loginStep === '2fa' && (
              <form onSubmit={handleAdmin2FASubmit} className="space-y-4">
                <div className="text-center pb-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold mb-2">
                    <KeyRound size={22} />
                  </div>
                  <h2 className="text-sm font-bold text-white">
                    {isRecoveryCode ? 'Masukkan Offline Recovery Code' : 'Verifikasi Autentikasi 2 Faktor (2FA)'}
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isRecoveryCode
                      ? 'Gunakan salah satu kode pemulihan darurat yang Anda simpan secara offline.'
                      : 'Buka aplikasi Authenticator (Google Authenticator / Authy) dan masukkan 6 digit kode.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {isRecoveryCode ? 'Kode Pemulihan (Format: RECOV-XXXX-XXXX)' : 'Kode 6-Digit TOTP'}
                  </label>
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTwoFactorCode(val);
                      setLoginError('');
                      if (val.toUpperCase().startsWith('RECOV') || val.includes('-')) {
                        setIsRecoveryCode(true);
                      } else if (val.replace(/[\s-]+/g, '').length === 6 && /^\d+$/.test(val.replace(/[\s-]+/g, ''))) {
                        setIsRecoveryCode(false);
                      }
                    }}
                    placeholder={isRecoveryCode ? 'RECOV-1A2B-3C4D' : 'Contoh: 123456'}
                    required
                    autoFocus
                    maxLength={30}
                    className="w-full px-3 py-2.5 text-center font-mono font-bold tracking-widest text-lg rounded-[8px] bg-slate-900 border border-slate-700 text-amber-400 focus:outline-none focus:ring-2 focus:ring-[#CA8A04]"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecoveryCode(!isRecoveryCode);
                      setTwoFactorCode('');
                      setLoginError('');
                    }}
                    className="text-amber-400 hover:underline"
                  >
                    {isRecoveryCode ? '← Gunakan Aplikasi Authenticator' : 'Gunakan Recovery Code Offline →'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginStep('credentials');
                      setTempToken('');
                      setTwoFactorCode('');
                      setLoginError('');
                    }}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    Ganti Akun
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 px-4 bg-[#CA8A04] hover:bg-[#A16207] text-slate-950 font-bold text-sm rounded-[8px] transition-colors shadow-md disabled:opacity-50"
                >
                  {loginLoading ? 'Memverifikasi 2FA...' : 'Konfirmasi & Masuk Admin'}
                </button>
              </form>
            )}
          </div>

          {/* Toggle for Demo Helper Drawer */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowDemoHelper(!showDemoHelper)}
              className="text-xs text-slate-400 hover:text-amber-400 inline-flex items-center gap-1.5 transition-colors py-1.5 px-3 rounded-md bg-[#1E293B] border border-slate-700 shadow-sm"
            >
              <Sparkles size={13} className="text-amber-400" />
              <span>{showDemoHelper ? 'Sembunyikan Bantuan Demo & 2FA' : 'Mode Demo: Buka Bantuan Kredensial & 2FA'}</span>
            </button>
          </div>

          {/* Demo Helper Drawer for Admin & Live TOTP */}
          {showDemoHelper && (
            <div className="bg-[#1E293B] p-4 rounded-[12px] border border-slate-700 shadow-md space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} />
                  <span>Kredensial Demo Super Admin & Live 2FA</span>
                </div>
                <span className="text-[11px] text-amber-300 font-mono font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  Ganti dlm {countdownSeconds}s
                </span>
              </div>

              <div className="text-[11px] text-slate-300 space-y-1 bg-slate-900 p-2.5 rounded-[8px] border border-slate-800">
                <div><strong>Email:</strong> admin@poliklinik.id</div>
                <div><strong>Password:</strong> AdminUtama2026!# (16 karakter)</div>
                <div><strong>2FA Secret:</strong> {liveTotp?.secret || 'JBSWY3DPEHPK3PXP'}</div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    if (loginStep === 'credentials') {
                      setAdminEmail('admin@poliklinik.id');
                      setAdminPassword('AdminUtama2026!#');
                      setLoginError('Kredensial demo terisi. Silakan klik "Lanjutkan ke Verifikasi 2FA" untuk memvalidasi kata sandi terlebih dahulu.');
                    } else {
                      setIsRecoveryCode(false);
                      if (liveTotp?.totpCode) {
                        setTwoFactorCode(liveTotp.totpCode);
                      }
                      setLoginError('');
                    }
                  }}
                  className="w-full p-2.5 rounded-[6px] bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 text-xs font-mono font-bold flex items-center justify-between gap-1.5 transition-colors"
                >
                  <span>{loginStep === 'credentials' ? 'Isi Password Admin:' : 'Gunakan TOTP Aktif Sekarang:'}</span>
                  <span className="text-white text-sm bg-slate-900 px-2.5 py-0.5 rounded border border-amber-500/50 tracking-wider">
                    {loginStep === 'credentials' ? 'AdminUtama2026!#' : (liveTotp?.totpCode || 'Memuat...')}
                  </span>
                </button>

                <div className="pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                    <span>Pilihan Recovery Code (Klik untuk mengisi):</span>
                    <span className="text-[10px] text-amber-400">Single Use</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(liveTotp?.recoveryCodes && liveTotp.recoveryCodes.length > 0
                      ? liveTotp.recoveryCodes
                      : ['RECOV-1A2B-3C4D', 'RECOV-5E6F-7G8H', 'RECOV-9I0J-1K2L', 'RECOV-3M4N-5O6P']
                    ).map((recCode) => (
                      <button
                        key={recCode}
                        type="button"
                        onClick={() => {
                          if (loginStep === 'credentials') {
                            setAdminEmail('admin@poliklinik.id');
                            setAdminPassword('AdminUtama2026!#');
                            setLoginError('Kata sandi harus divalidasi terlebih dahulu. Klik "Lanjutkan ke Verifikasi 2FA".');
                          } else {
                            setIsRecoveryCode(true);
                            setTwoFactorCode(recCode);
                            setLoginError('');
                          }
                        }}
                        className="p-1.5 rounded-[6px] bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-amber-400/50 text-slate-200 text-[11px] font-mono flex items-center justify-center gap-1 transition-colors"
                        title="Klik untuk mengisi recovery code ini"
                      >
                        <span>{recCode}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If authenticated as Super Admin, render Dashboard
  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 font-body">
      {/* Admin Title Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#CA8A04] bg-[#EAB30815] px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={14} /> Hak Akses Penuh Super Admin (IT)
            </span>
          </div>
          <h1 className="text-2xl font-headline font-bold text-[#0F172A] mt-1">
            Pusat Kendali & Tata Kelola Sistem
          </h1>
          <p className="text-xs text-[#64748B]">
            Master data dokter umum/spesialis, manajemen akun staf, backup terenkripsi, audit kepatuhan UU PDP No. 27/2022, dan analitik laporan
          </p>
        </div>

        {/* Manual Encrypted Backup Quick Button */}
        <Button
          variant="primary"
          size="md"
          onClick={handleDownloadBackup}
          className="gap-2 bg-[#0F172A] shadow-sm"
        >
          <Download size={16} />
          Ekspor Backup Terenkripsi (.enc)
        </Button>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-[#E2E8F0] pb-2">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-lg text-xs font-headline font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-[#0F172A] text-white'
              : 'bg-white text-[#475569] hover:bg-[#F8FAFC]'
          }`}
        >
          <Activity size={15} />
          Laporan Harian & Bulanan
        </button>

        <button
          onClick={() => setActiveTab('staff_mgmt')}
          className={`px-4 py-2 rounded-lg text-xs font-headline font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'staff_mgmt'
              ? 'bg-[#0F172A] text-white'
              : 'bg-white text-[#475569] hover:bg-[#F8FAFC]'
          }`}
        >
          <Users size={15} />
          Kelola Akun Staf Klinik
        </button>

        <button
          onClick={() => setActiveTab('master_doctors')}
          className={`px-4 py-2 rounded-lg text-xs font-headline font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'master_doctors'
              ? 'bg-[#0F172A] text-white'
              : 'bg-white text-[#475569] hover:bg-[#F8FAFC]'
          }`}
        >
          <Users size={15} />
          Master Dokter Poliklinik (5 Dokter)
        </button>

        <button
          onClick={() => setActiveTab('duplicates')}
          className={`px-4 py-2 rounded-lg text-xs font-headline font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'duplicates'
              ? 'bg-[#0F172A] text-white'
              : 'bg-white text-[#475569] hover:bg-[#F8FAFC]'
          }`}
        >
          <GitMerge size={15} />
          Penggabungan Duplikat
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-lg text-xs font-headline font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'backup'
              ? 'bg-[#0F172A] text-white'
              : 'bg-white text-[#475569] hover:bg-[#F8FAFC]'
          }`}
        >
          <Database size={15} />
          Backup & Restore Terenkripsi
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-lg text-xs font-headline font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-[#0F172A] text-white'
              : 'bg-white text-[#475569] hover:bg-[#F8FAFC]'
          }`}
        >
          <Lock size={15} />
          Audit Trail Keamanan
        </button>
      </div>

      {/* TAB: STAFF MANAGEMENT (NEW) */}
      {activeTab === 'staff_mgmt' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold font-headline text-[#0F172A]">
                Manajemen Akun Staf Poliklinik
              </h2>
              <p className="text-xs text-[#64748B]">
                Sesuai PRD: Hanya Super Admin yang dapat membuat, mengubah peran, atau menonaktifkan akun staf.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddStaffOpen(true)}
              className="gap-1.5 bg-[#059669] hover:bg-[#047857]"
            >
              <UserPlus size={15} />
              Tambah Akun Staf Baru
            </Button>
          </div>

          {/* Staff Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-[8px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-body">
                <thead className="bg-[#0F172A] text-white font-headline text-[12px] uppercase">
                  <tr>
                    <th className="py-3 px-4">Nama Staf</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Peran</th>
                    <th className="py-3 px-4">Status Akun</th>
                    <th className="py-3 px-4">Keamanan / Lockout</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {staffList.map((staf) => (
                    <tr key={staf.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">
                        {staf.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#475569]">
                        {staf.email}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-slate-100 text-slate-700">
                          {staf.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {staf.isActive !== false ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Nonaktif (Leaver)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {staf.lockedUntil && new Date(staf.lockedUntil) > new Date() ? (
                          <div className="flex items-center gap-2">
                            <span className="text-amber-700 font-semibold flex items-center gap-1">
                              <ShieldAlert size={13} />
                              Terkunci (5 Gagal)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUnlockStaff(staf.id)}
                              className="text-[10px] text-blue-600 hover:underline font-bold"
                            >
                              Buka Kunci
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500">Normal (0 Gagal)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {staf.role !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleToggleStaffActive(staf.id, staf.isActive !== false)}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                              staf.isActive !== false
                                ? 'border border-red-200 text-red-600 hover:bg-red-50'
                                : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {staf.isActive !== false ? 'Nonaktifkan' : 'Aktifkan Kembali'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tambah Staf Baru */}
      <Modal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        title="Tambah Akun Staf Klinik Baru"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          {addStaffError && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-[8px]">
              {addStaffError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Nama Lengkap Staf *
            </label>
            <input
              type="text"
              value={newStaffName}
              onChange={(e) => setNewStaffName(e.target.value)}
              placeholder="Contoh: dr. Ahmad Fauzi / Ns. Rina"
              required
              className="w-full px-3 py-2 border border-[#CBD5E1] rounded-[8px] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Alamat Email Staf *
            </label>
            <input
              type="email"
              value={newStaffEmail}
              onChange={(e) => setNewStaffEmail(e.target.value)}
              placeholder="staf@poliklinik.id"
              required
              className="w-full px-3 py-2 border border-[#CBD5E1] rounded-[8px] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Peran Staf *
              </label>
              <select
                value={newStaffRole}
                onChange={(e) => setNewStaffRole(e.target.value as any)}
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-[8px] text-sm"
              >
                <option value="front_desk">Front Desk (Resepsionis)</option>
                <option value="doctor">Dokter Poliklinik (Doctor)</option>
                <option value="nurse">Perawat (Nurse)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Nomor Telepon
              </label>
              <input
                type="tel"
                value={newStaffPhone}
                onChange={(e) => setNewStaffPhone(e.target.value)}
                placeholder="0812..."
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-[8px] text-sm"
              />
            </div>
          </div>

          {newStaffRole === 'doctor' && (
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Tautkan ke Master Dokter Poliklinik
              </label>
              <select
                value={newStaffDoctorId}
                onChange={(e) => setNewStaffDoctorId(e.target.value)}
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-[8px] text-sm"
              >
                <option value="">-- Pilih Dokter --</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Poli {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Kata Sandi Awal (Minimal 12 Karakter) *
            </label>
            <input
              type="text"
              value={newStaffPassword}
              onChange={(e) => setNewStaffPassword(e.target.value)}
              placeholder="Minimal 12 karakter..."
              required
              className="w-full px-3 py-2 border border-[#CBD5E1] rounded-[8px] text-sm font-mono"
            />
            <p className="text-[11px] text-[#94A3B8] mt-1">
              Aturan PRD: Password staf minimal 12 karakter untuk melindungi data klinis.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddStaffOpen(false)}
              className="px-4 py-2 border border-[#CBD5E1] rounded-[8px] text-xs font-medium text-[#475569]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={addStaffLoading}
              className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-[8px] text-xs font-medium disabled:opacity-50"
            >
              {addStaffLoading ? 'Menyimpan...' : 'Buat Akun Staf'}
            </button>
          </div>
        </form>
      </Modal>

      {/* TAB 1: REPORTS & ANALYTICS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#475569]">Jenis Laporan:</span>
              <button
                onClick={() => setReportType('daily')}
                className={`px-3 py-1.5 rounded text-xs font-semibold ${
                  reportType === 'daily'
                    ? 'bg-[#0F172A] text-white'
                    : 'bg-[#F1F5F9] text-[#475569]'
                }`}
              >
                Harian
              </button>
              <button
                onClick={() => setReportType('monthly')}
                className={`px-3 py-1.5 rounded text-xs font-semibold ${
                  reportType === 'monthly'
                    ? 'bg-[#0F172A] text-white'
                    : 'bg-[#F1F5F9] text-[#475569]'
                }`}
              >
                Bulanan
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type={reportType === 'daily' ? 'date' : 'month'}
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="px-3 py-1.5 border border-[#CBD5E1] rounded text-xs text-[#0F172A] outline-none"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchReport}
                isLoading={reportLoading}
                className="text-xs"
              >
                Tampilkan
              </Button>
            </div>
          </div>

          {/* Report Summary Cards */}
          {reportData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-xs text-[#64748B]">Total Pasien Terdaftar</div>
                <div className="text-2xl font-bold font-headline text-[#0F172A] mt-1">
                  {reportData.summary.total}
                </div>
                <div className="text-[11px] text-[#059669] mt-1">
                  {reportData.summary.done} Pasien Selesai Dilayani
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-xs text-[#64748B]">Pasien Walk-in</div>
                <div className="text-2xl font-bold font-headline text-[#0F172A] mt-1">
                  {reportData.summary.walkIn}
                </div>
                <div className="text-[11px] text-[#64748B] mt-1">
                  Online: {reportData.summary.online} | Darurat: {reportData.summary.emergency}
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-xs text-[#64748B]">Rata-rata Waktu Tunggu</div>
                <div className="text-2xl font-bold font-headline text-[#0F172A] mt-1">
                  {reportData.summary.avgWaitMinutes} Menit
                </div>
                <div className="text-[11px] text-[#64748B] mt-1">
                  Rata-rata Konsultasi: {reportData.summary.avgConsultMinutes} Menit
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-xs text-[#64748B]">Pasien Dilewati / Batal</div>
                <div className="text-2xl font-bold font-headline text-[#EF4444] mt-1">
                  {reportData.summary.skipped + reportData.summary.cancelled}
                </div>
                <div className="text-[11px] text-[#64748B] mt-1">
                  Prioritas (Lansia/Darurat): {reportData.summary.priorityCount}
                </div>
              </Card>
            </div>
          )}

          {/* Doctor Performance Breakdown */}
          {reportData?.doctorStats && (
            <div className="bg-white border border-[#E2E8F0] rounded-[8px] overflow-hidden shadow-sm">
              <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                <h2 className="font-headline font-bold text-sm text-[#0F172A]">
                  Rincian Kinerja per Dokter
                </h2>
                <span className="text-xs text-[#64748B] font-mono">
                  Periode: {reportDate}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-body">
                  <thead className="bg-[#0F172A] text-white font-headline text-[12px] uppercase">
                    <tr>
                      <th className="py-3 px-4">Dokter & Ruang</th>
                      <th className="py-3 px-4">Total Pasien</th>
                      <th className="py-3 px-4">Selesai Dilayani</th>
                      <th className="py-3 px-4">Rata-rata Konsultasi</th>
                      <th className="py-3 px-4">Rujukan Diterbitkan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {reportData.doctorStats.map((doc: any) => (
                      <tr key={doc.doctorId} className="hover:bg-[#F8FAFC]">
                        <td className="py-3 px-4 font-semibold text-[#0F172A]">
                          Poli {doc.doctorCode} - {doc.doctorName}
                        </td>
                        <td className="py-3 px-4 font-mono">{doc.total}</td>
                        <td className="py-3 px-4 font-bold text-[#059669]">{doc.done}</td>
                        <td className="py-3 px-4">{doc.avgConsultMinutes} Menit</td>
                        <td className="py-3 px-4 font-mono">{doc.referralCount} Rujukan</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABEL LAPORAN KUNJUNGAN PASIEN HARIAN (NON-SENSITIF: PRIVASI UU PDP) */}
          <div className="bg-white border border-[#E2E8F0] rounded-[8px] overflow-hidden shadow-sm">
            <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="text-[#0D9488]" size={18} />
                  <h2 className="font-headline font-bold text-sm text-[#0F172A]">
                    Tabel Laporan Kunjungan Pasien ({reportType === 'daily' ? 'Harian' : 'Bulanan'})
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Bebas Data Sensitif (No NIK / No HP)
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Menampilkan nama pasien, keluhan klinis, dan dokter yang memeriksa sesuai prinsip minimalisasi data privasi.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search box */}
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={patientSearchQuery}
                    onChange={(e) => setPatientSearchQuery(e.target.value)}
                    placeholder="Cari nama, keluhan..."
                    className="pl-8 pr-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0D9488] w-44 md:w-52"
                  />
                </div>

                {/* Filter Dokter */}
                <select
                  value={patientDoctorFilter}
                  onChange={(e) => setPatientDoctorFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-[#CBD5E1] rounded-lg text-[#0F172A] bg-white focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                >
                  <option value="all">Semua Dokter</option>
                  {doctors && doctors.length > 0 ? (
                    doctors.map((d) => (
                      <option key={d.id} value={d.code}>
                        Poli {d.code} - {d.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="A">Poli A - dr. Budi Santoso, Sp.PD</option>
                      <option value="B">Poli B - dr. Siti Rahma, Sp.A</option>
                      <option value="C">Poli C - dr. Hendra Wijaya, Sp.JP</option>
                      <option value="D">Poli D - dr. Anita Kusuma</option>
                      <option value="E">Poli E - dr. Farhan Ramadhan</option>
                    </>
                  )}
                </select>

                {/* Export Excel Non-Sensitif */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportNonSensitiveExcel}
                  className="text-xs flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                >
                  <FileSpreadsheet size={14} />
                  Export Excel
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-body">
                <thead className="bg-[#0F172A] text-white font-headline text-[12px] uppercase">
                  <tr>
                    <th className="py-3 px-4">No. Antrean</th>
                    <th className="py-3 px-4">Nama Pasien</th>
                    <th className="py-3 px-4">Keluhan / Alasan Kunjungan</th>
                    <th className="py-3 px-4">Dokter & Ruang</th>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredDailyPatients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Tidak ada data kunjungan pasien untuk filter atau tanggal yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredDailyPatients.map((patient: any) => (
                      <tr key={patient.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">
                          {patient.queueNumber}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#0F172A]">
                          {patient.patientName}
                        </td>
                        <td className="py-3 px-4 text-[#334155] max-w-xs truncate" title={patient.complaint}>
                          {patient.complaint}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-[#0F172A]">{patient.doctorName}</div>
                          <div className="text-[11px] text-[#64748B]">{patient.room}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#64748B]">
                          {patient.time}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider inline-block ${
                              patient.status === 'done'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : patient.status === 'consulting'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : patient.status === 'calling'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                : patient.status === 'cancelled' || patient.status === 'skipped'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {patient.status === 'done'
                              ? 'Selesai'
                              : patient.status === 'consulting'
                              ? 'Konsultasi'
                              : patient.status === 'calling'
                              ? 'Dipanggil'
                              : patient.status === 'waiting'
                              ? 'Menunggu'
                              : patient.status === 'cancelled'
                              ? 'Batal'
                              : patient.status === 'skipped'
                              ? 'Dilewati'
                              : patient.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer info */}
            <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#64748B]">
              <span>
                Menampilkan <strong className="text-[#0F172A]">{filteredDailyPatients.length}</strong> pasien
                {patientSearchQuery || patientDoctorFilter !== 'all' ? ' (terfilter)' : ''}
              </span>
              <span className="text-[11px] text-slate-500 italic">
                * Data pribadi sensitif (NIK, No. HP, Tanggal Lahir) tidak dipaparkan sesuai Prinsip Perlindungan Data Pribadi (UU PDP).
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER DOCTORS */}
      {activeTab === 'master_doctors' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-[#E2E8F0]">
            <h2 className="text-sm font-bold font-headline text-[#0F172A]">
              Konfigurasi Master Data 5 Dokter Poliklinik Umum
            </h2>
            <p className="text-xs text-[#64748B]">
              Aturan PRD: Maksimal 2 dokter yang bertugas (On Duty) per hari dalam satu waktu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((doc) => (
              <Card key={doc.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#0F172A] text-white">
                      Poli {doc.code}
                    </span>
                    <h3 className="font-headline font-bold text-sm text-[#0F172A] mt-1.5">
                      {doc.name}
                    </h3>
                    <p className="text-xs text-[#059669] font-medium">{doc.specialty}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Chip variant={doc.isOnDuty ? 'success' : 'filter-active'}>
                      {doc.isOnDuty ? 'Piket Aktif' : 'Off Duty'}
                    </Chip>
                    <Chip variant={doc.isAvailable ? 'success' : 'error'}>
                      {doc.isAvailable ? 'Tersedia' : 'Berhalangan'}
                    </Chip>
                  </div>
                </div>

                <div className="text-xs text-[#64748B] space-y-1 bg-[#F8FAFC] p-2.5 rounded">
                  <div>Ruang: <strong>{doc.room}</strong></div>
                  <div>Shift: <strong>{doc.shiftHours}</strong></div>
                  <div>Hari: <strong>{doc.scheduleDays.join(', ')}</strong></div>
                  <div>Durasi Periksa: <strong>{doc.consultationMinutes} Menit / Pasien</strong></div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F1F5F9]">
                  <Button
                    variant={doc.isOnDuty ? 'destructive' : 'primary'}
                    size="sm"
                    onClick={() => handleDoctorToggle(doc.id, 'isOnDuty', doc.isOnDuty)}
                    className="flex-1 text-xs"
                  >
                    {doc.isOnDuty ? 'Tandai Off Duty' : 'Set Jadi On Duty'}
                  </Button>
                  <Button
                    variant={doc.isAvailable ? 'secondary' : 'sage'}
                    size="sm"
                    onClick={() => handleDoctorToggle(doc.id, 'isAvailable', doc.isAvailable)}
                    className={`flex-1 text-xs ${!doc.isAvailable ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold' : ''}`}
                  >
                    {doc.isAvailable ? 'Tandai Berhalangan' : 'Tandai Tersedia Kembali'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DUPLICATE MERGE */}
      {activeTab === 'duplicates' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold font-headline text-[#0F172A]">
                Pencegahan & Penggabungan Akun Pasien Duplikat
              </h2>
              <p className="text-xs text-[#64748B]">
                Sesuai PRD: Deteksi kesamaan Nomor HP, NIK, atau Nama Lengkap + Tanggal Lahir.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={fetchDuplicates}>
              Pindai Ulang
            </Button>
          </div>

          {duplicateGroups.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-[#E2E8F0] text-[#64748B] text-xs">
              <CheckCircle size={32} className="mx-auto mb-2 text-[#059669]" />
              Tidak ditemukan data pasien duplikat dalam sistem.
            </div>
          ) : (
            <div className="space-y-4">
              {duplicateGroups.map((group, idx) => (
                <div key={idx} className="bg-white border border-[#CBD5E1] rounded-[8px] p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                      Grup Duplikat #{idx + 1} ({group.reason})
                    </span>
                    <span className="text-xs text-[#64748B]">{group.records.length} Profil Ditemukan</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {group.records.map((rec: any, rIdx: number) => (
                      <div
                        key={rec.id}
                        className={`p-3 rounded border text-xs space-y-1 ${
                          rIdx === 0
                            ? 'border-[#059669] bg-emerald-50/30'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-[#0F172A]">{rec.name}</strong>
                          {rIdx === 0 && (
                            <span className="text-[10px] font-bold text-[#059669] bg-white px-1.5 py-0.5 rounded border border-[#059669]">
                              Calon Akun Primer
                            </span>
                          )}
                        </div>
                        <div>HP: {rec.phone}</div>
                        <div>NIK: {rec.nik || '-'}</div>
                        <div>Tgl Lahir: {rec.dob}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={mergeLoading}
                      onClick={() => handleMerge(group.records[0].id, group.records[1].id)}
                      className="gap-1.5 bg-[#0F172A]"
                    >
                      <GitMerge size={14} />
                      Gabungkan ke Akun #{group.records[0].name}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ENCRYPTED BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-[#E2E8F0] shadow-sm">
            <h2 className="text-sm font-bold font-headline text-[#0F172A] mb-1">
              Backup Harian Terenkripsi (AES-256-CBC)
            </h2>
            <p className="text-xs text-[#64748B] mb-4">
              Pencadangan manual harian terenkripsi untuk perlindungan data medis klinik sesuai UU PDP No. 27/2022.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] space-y-3">
                <div className="flex items-center gap-2 text-[#0F172A] font-headline font-bold text-sm">
                  <Download size={18} className="text-[#059669]" />
                  Ekspor File Backup
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Unduh file <code>.enc</code> yang dienkripsi dengan kunci AES-256. Simpan file ini di tempat penyimpanan aman klinik.
                </p>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    onClick={handleDownloadBackup}
                    className="w-full gap-2 bg-[#0F172A] text-xs"
                  >
                    <Download size={15} /> Unduh File Backup .enc
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-[#0F172A] font-headline font-bold text-sm">
                    <Upload size={18} className="text-[#EF4444]" />
                    Uji Pemulihan (Test Restore)
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed mb-3">
                    Tempelkan isi file <code>.enc</code> untuk menguji integritas dekripsi dan pemulihan data:
                  </p>
                  <textarea
                    placeholder="Tempelkan string payload terenkripsi (format: iv:hex)..."
                    value={backupRestoreFile}
                    onChange={(e) => setBackupRestoreFile(e.target.value)}
                    className="w-full h-24 p-2 bg-white border border-[#CBD5E1] rounded text-xs font-mono text-[#0F172A] outline-none"
                  />
                  {restoreStatus && (
                    <p className={`text-xs mt-2 p-2 rounded ${restoreStatus.startsWith('Sukses') ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                      {restoreStatus}
                    </p>
                  )}
                </div>
                <div className="pt-2">
                  <Button
                    variant="destructive"
                    onClick={handleRestoreBackup}
                    isLoading={restoreLoading}
                    className="w-full gap-2 text-xs"
                  >
                    <Upload size={15} /> Jalankan Uji Restore Data
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-[#E2E8F0] rounded-[8px] overflow-hidden shadow-sm">
          <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h2 className="font-headline font-bold text-sm text-[#0F172A]">
                Audit Trail & Log Aktivitas Sistem
              </h2>
              <p className="text-[11px] text-[#64748B]">
                Pencatatan riwayat setiap aksi sign-in, kegagalan sign-in, penguncian akun, rujukan, dan perubahan akun staf
              </p>
            </div>
            <span className="text-xs font-mono text-[#64748B]">{auditLogs.length} Entri Log</span>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs font-body">
              <thead className="bg-[#0F172A] text-white font-headline text-[12px] uppercase sticky top-0">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Aktor & Peran</th>
                  <th className="py-3 px-4">Tindakan</th>
                  <th className="py-3 px-4">Objek</th>
                  <th className="py-3 px-4">Rincian Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-2.5 px-4 font-mono text-[#64748B] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-[#0F172A] whitespace-nowrap">
                      {log.actorName} ({log.actorRole})
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-[#059669]">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-4 uppercase text-[#475569]">{log.targetType}</td>
                    <td className="py-2.5 px-4 text-[#334155]">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
