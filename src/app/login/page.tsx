"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  User,
  Lock,
  Mail,
  AlertTriangle,
  ArrowRight,
  UserPlus,
  CheckCircle2,
  ShieldAlert,
  KeyRound,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');

  // Patient Login State
  const [loginEmail, setLoginEmail] = useState('bambang.wijaya@gmail.com');
  const [loginPassword, setLoginPassword] = useState('PasienBambang123');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState<number | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);

  // Patient Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regNik, setRegNik] = useState('');
  const [regDob, setRegDob] = useState('1992-05-18');
  const [regGender, setRegGender] = useState<'L' | 'P'>('L');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccessMessage, setRegSuccessMessage] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

  // Patient Demo Accounts
  const patientDemos = [
    {
      name: 'Bambang Wijaya',
      email: 'bambang.wijaya@gmail.com',
      pass: 'PasienBambang123',
      phone: '081234567890',
      note: 'Akun Terverifikasi • 2 Anggota Keluarga',
    },
    {
      name: 'Ibu Ratna Kumala',
      email: 'ratna.kumala@gmail.com',
      pass: 'PasienRatna123',
      phone: '087812345678',
      note: 'Akun Terverifikasi • Pasien Prioritas Lansia',
    },
  ];

  const handleQuickFill = (item: typeof patientDemos[0]) => {
    setLoginEmail(item.email);
    setLoginPassword(item.pass);
    setLoginError('');
    setIsLocked(false);
    setNeedsVerification(false);
  };

  // Submit Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    setIsLocked(false);
    setNeedsVerification(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portal: 'patient',
          email: loginEmail.trim(),
          password: loginPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.isLocked) {
          setIsLocked(true);
          setRemainingMinutes(data.remainingMinutes);
        }
        if (data.needsEmailVerification) {
          setNeedsVerification(true);
        }
        throw new Error(data.error);
      }

      login(data.user);
      router.push('/pasien');
    } catch (err: any) {
      setLoginError(err.message || 'Gagal masuk');
    } finally {
      setLoginLoading(false);
    }
  };

  // Submit Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError('');
    setRegSuccessMessage('');
    setDuplicateWarning(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          phone: regPhone,
          nik: regNik,
          dob: regDob,
          gender: regGender,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.isDuplicate) {
          setDuplicateWarning(data.matchedPatient);
        }
        throw new Error(data.error);
      }

      setRegSuccessMessage(data.message || 'Registrasi berhasil! Tautan verifikasi telah dikirimkan ke email Anda.');
      setLoginEmail(regEmail);
    } catch (err: any) {
      setRegError(err.message || 'Gagal mendaftar');
    } finally {
      setRegLoading(false);
    }
  };

  // Submit Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setForgotSuccess(data.message);
    } catch (err: any) {
      setForgotError(err.message || 'Gagal mengajukan reset kata sandi');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12 bg-gradient-to-b from-[#F0FDFA]/60 via-[#FAFBFC] to-white">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 text-white items-center justify-center font-headline font-bold text-xl mb-3 shadow-md">
            <span className="text-emerald-300">✦</span>V
          </div>
          <h1 className="text-2xl font-headline font-extrabold text-[#0F172A]">
            Portal Pasien Poliklinik
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Klinik Pratama Sehat Utama • Poliklinik Gigi & Mulut
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'login'
                ? 'bg-white text-teal-900 shadow-sm font-bold'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Masuk Akun
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'register'
                ? 'bg-white text-teal-900 shadow-sm font-bold'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Daftar Baru
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('forgot')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'forgot'
                ? 'bg-white text-teal-900 shadow-sm font-bold'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Lupa Password
          </button>
        </div>

        {/* TAB 1: LOGIN */}
        {activeTab === 'login' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-cozy border border-teal-100/80 space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div
                  className={`p-3 rounded-[8px] text-xs flex items-start gap-2 ${
                    isLocked
                      ? 'bg-amber-50 border border-amber-300 text-amber-800'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {isLocked ? (
                    <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-600" />
                  ) : (
                    <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-600" />
                  )}
                  <div>
                    <div className="font-semibold">{loginError}</div>
                    {isLocked && (
                      <div className="text-[11px] mt-1 text-amber-700">
                        Akun Anda terkunci sementara selama 15 menit karena 5 kali percobaan gagal.
                      </div>
                    )}
                    {needsVerification && (
                      <div className="text-[11px] mt-1 text-red-600">
                        Buka simulasi <strong>Dev Mailbox</strong> di pojok kanan bawah untuk klik tautan verifikasi email secara instan.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Alamat Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    disabled={loginLoading || isLocked}
                    className="w-full px-3 py-2 pl-9 rounded-[8px] border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent transition-all disabled:bg-slate-100"
                  />
                  <Mail size={16} className="absolute left-3 top-2.5 text-[#94A3B8]" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#334155]">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(loginEmail);
                      setActiveTab('forgot');
                    }}
                    className="text-[11px] text-[#059669] hover:underline font-medium"
                  >
                    Lupa kata sandi?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loginLoading || isLocked}
                    className="w-full px-3 py-2 pl-9 rounded-[8px] border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent transition-all disabled:bg-slate-100"
                  />
                  <Lock size={16} className="absolute left-3 top-2.5 text-[#94A3B8]" />
                </div>
              </div>

              <div className="text-[11px] text-[#64748B] flex items-center justify-between">
                <span>✓ Sesi tersimpan hingga 14 hari di perangkat ini</span>
              </div>

              <button
                type="submit"
                disabled={loginLoading || isLocked}
                className="w-full py-2.5 px-4 bg-[#0F172A] hover:bg-[#020617] text-white text-sm font-medium rounded-[8px] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{loginLoading ? 'Memverifikasi...' : 'Masuk ke Antrean Saya'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: REGISTER */}
        {activeTab === 'register' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-cozy border border-teal-100/80 space-y-4">
            {regSuccessMessage ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-bold font-headline text-[#0F172A]">
                  Pendaftaran Berhasil!
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed">
                  {regSuccessMessage}
                </p>
                <div className="p-3 bg-emerald-50 rounded-[8px] border border-emerald-200 text-xs text-emerald-800 text-left space-y-1">
                  <div className="font-bold">Tips Cepat Pengujian:</div>
                  <div>
                    Klik tombol <strong>Dev Mailbox</strong> di pojok kanan bawah layar untuk melihat email verifikasi dan klik tautan aktivasi dengan 1 klik.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="w-full py-2.5 px-4 bg-[#0F172A] hover:bg-[#020617] text-white text-sm font-medium rounded-[8px] transition-colors shadow-sm"
                >
                  Beralih ke Halaman Masuk
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3.5">
                {regError && (
                  <div className="p-3 rounded-[8px] text-xs bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-600" />
                    <div>{regError}</div>
                  </div>
                )}

                {duplicateWarning && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-[8px] text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-amber-600" />
                      Apakah ini Anda?
                    </div>
                    <div>Data serupa ditemukan: <strong>{duplicateWarning.name}</strong> ({duplicateWarning.phone})</div>
                    <div className="text-[11px] text-amber-700">Jika akun ini milik Anda, silakan langsung masuk tanpa membuat akun baru.</div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Nama Lengkap Pasien *
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Contoh: Andi Pratama"
                    required
                    className="w-full px-3 py-2 rounded-[8px] border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#334155] mb-1">
                      Alamat Email *
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="andi@gmail.com"
                      required
                      className="w-full px-3 py-2 rounded-[8px] border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#334155] mb-1">
                      Nomor HP (WhatsApp) *
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="08123456789"
                      required
                      className="w-full px-3 py-2 rounded-[8px] border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Kata Sandi (Minimal 8 Karakter) *
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimal 8 karakter..."
                    required
                    className="w-full px-3 py-2 rounded-[8px] border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#334155] mb-1">
                      Tanggal Lahir *
                    </label>
                    <input
                      type="date"
                      value={regDob}
                      onChange={(e) => setRegDob(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-[8px] border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#334155] mb-1">
                      Jenis Kelamin
                    </label>
                    <select
                      value={regGender}
                      onChange={(e) => setRegGender(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-[8px] border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]"
                    >
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    NIK KTP (Opsional namun disarankan)
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={regNik}
                    onChange={(e) => setRegNik(e.target.value)}
                    placeholder="16 digit NIK sesuai KTP..."
                    className="w-full px-3 py-2 rounded-[8px] border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]"
                  />
                </div>

                <p className="text-[11px] text-[#64748B]">
                  * Setelah pendaftaran, tautan verifikasi akan dikirimkan ke email Anda untuk mengaktifkan akun.
                </p>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-2.5 px-4 bg-[#059669] hover:bg-[#047857] text-white text-sm font-medium rounded-[8px] transition-colors shadow-sm disabled:opacity-50"
                >
                  {regLoading ? 'Mendaftarkan Akun...' : 'Daftar & Kirim Email Verifikasi'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: FORGOT PASSWORD */}
        {activeTab === 'forgot' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-cozy border border-teal-100/80 space-y-4">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold mb-2">
                <KeyRound size={20} />
              </div>
              <h2 className="text-lg font-bold font-headline text-[#0F172A]">
                Lupa Kata Sandi Akun Pasien
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                Masukkan email Anda dan kami akan mengirimkan tautan untuk membuat kata sandi baru.
              </p>
            </div>

            {forgotSuccess ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={28} />
                </div>
                <p className="text-xs text-[#475569]">{forgotSuccess}</p>
                <div className="p-3 bg-emerald-50 rounded-[8px] border border-emerald-200 text-xs text-emerald-800 text-left">
                  Tautan reset dapat dilihat langsung pada panel <strong>Dev Mailbox</strong> di pojok kanan bawah layar.
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs text-[#059669] hover:underline font-medium"
                >
                  Kembali ke halaman masuk
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {forgotError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-[8px] text-xs text-red-700">
                    {forgotError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                    Alamat Email Terdaftar
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="nama@email.com"
                      required
                      className="w-full px-3 py-2 pl-9 rounded-[8px] border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]"
                    />
                    <Mail size={16} className="absolute left-3 top-2.5 text-[#94A3B8]" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 px-4 bg-[#0F172A] hover:bg-[#020617] text-white text-sm font-medium rounded-[8px] transition-colors shadow-sm disabled:opacity-50"
                >
                  {forgotLoading ? 'Mengirim...' : 'Kirim Tautan Atur Ulang'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-xs text-[#64748B] hover:text-[#0F172A]"
                  >
                    Batal dan kembali ke halaman masuk
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Demo Accounts Quick-Fill Drawer */}
        <div className="bg-white p-4 rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A] mb-3">
            <Sparkles size={14} className="text-[#059669]" />
            <span>Akun Pasien Demo (Pengujian Instan)</span>
          </div>

          <div className="space-y-2">
            {patientDemos.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  handleQuickFill(item);
                  setActiveTab('login');
                }}
                className="w-full text-left p-2.5 rounded-[8px] border border-[#E2E8F0] hover:border-[#059669] hover:bg-[#F0FDF4] transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded bg-slate-100 text-slate-700 group-hover:bg-[#059669] group-hover:text-white transition-colors">
                    <User size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#0F172A] leading-tight">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-[#64748B] mt-0.5">
                      {item.email} • {item.note}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-[#059669] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Gunakan ↵
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Walk-in notice */}
        <div className="text-center text-xs text-[#64748B]">
          Pasien tanpa email?{' '}
          <span className="text-[#0F172A] font-medium">
            Front desk dapat mendaftarkan langsung sebagai pasien walk-in di klinik tanpa akun login.
          </span>
        </div>
      </div>
    </div>
  );
}
