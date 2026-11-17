"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import SehatUtamaLogo from '@/components/SehatUtamaLogo';
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
  Eye,
  EyeOff,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');

  // Patient Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState<number | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);

  // Patient Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regPhone, setRegPhone] = useState('');
  const [regNik, setRegNik] = useState('');
  const [regDob, setRegDob] = useState('1992-05-18');
  const [regGender, setRegGender] = useState<'L' | 'P'>('L');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccessMessage, setRegSuccessMessage] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);

  // OTP Verification States
  const [regStep, setRegStep] = useState<'form' | 'otp' | 'success'>('form');
  const [regOtp, setRegOtp] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendLoginVerificationSent, setResendLoginVerificationSent] = useState(false);

  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

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

  // Submit Register (Step 1: Validate & Send OTP)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccessMessage('');
    setDuplicateWarning(null);

    if (regPassword !== regConfirmPassword) {
      setRegError('Konfirmasi kata sandi tidak cocok. Harap periksa kembali.');
      return;
    }

    if (regPassword.length < 8) {
      setRegError('Kata sandi minimal harus terdiri dari 8 karakter.');
      return;
    }

    setRegLoading(true);

    try {
      const res = await fetch('/api/auth/register/send-otp', {
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

      setRegStep('otp');
      setOtpCountdown(60);
      setRegSuccessMessage(data.message || `Kode OTP telah dikirim ke ${regEmail}.`);
    } catch (err: any) {
      setRegError(err.message || 'Gagal mengirimkan kode verifikasi email.');
    } finally {
      setRegLoading(false);
    }
  };

  // Submit OTP Verification (Step 2: Confirm 6-Digit OTP)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regOtp || regOtp.trim().length !== 6) {
      setRegError('Masukkan 6 digit kode verifikasi OTP.');
      return;
    }

    setRegLoading(true);

    try {
      const res = await fetch('/api/auth/register/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.trim(),
          otp: regOtp.trim(),
          otpCode: regOtp.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRegStep('success');
      setLoginEmail(regEmail);
      setRegSuccessMessage(data.message || 'Akun Anda berhasil diverifikasi dan diaktifkan!');
    } catch (err: any) {
      setRegError(err.message || 'Kode verifikasi tidak valid atau telah kedaluwarsa.');
    } finally {
      setRegLoading(false);
    }
  };

  // Resend OTP for Registration
  const handleResendOtp = async () => {
    if (otpCountdown > 0 || resendLoading) return;
    setResendLoading(true);
    setRegError('');

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setOtpCountdown(60);
      setRegSuccessMessage('Kode verifikasi baru telah dikirimkan ke email Anda.');
    } catch (err: any) {
      setRegError(err.message || 'Gagal mengirim ulang kode verifikasi.');
    } finally {
      setResendLoading(false);
    }
  };

  // Resend Verification from Login tab
  const handleResendLoginVerification = async () => {
    if (!loginEmail || resendLoading) return;
    setResendLoading(true);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResendLoginVerificationSent(true);
    } catch (err: any) {
      setLoginError(err.message || 'Gagal mengirim ulang email verifikasi.');
    } finally {
      setResendLoading(false);
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
    <div className="flex-1 flex items-center justify-center p-4 py-12 bg-[#FAFBFC]">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-block mb-3">
            <SehatUtamaLogo className="w-12 h-12 shadow-md shadow-teal-700/10" />
          </div>
          <h1 className="text-2xl font-headline font-extrabold text-[#0F172A]">
            Portal Pasien Poliklinik
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Klinik Pratama Sehat Utama • Poliklinik Umum
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
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 space-y-4">
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
                      <div className="mt-2 pt-2 border-t border-red-200">
                        <p className="text-[11px] text-red-600 mb-2">
                          Email Anda belum diverifikasi. Silakan periksa inbox / spam email Anda, atau kirim ulang verifikasi di bawah ini:
                        </p>
                        {resendLoginVerificationSent ? (
                          <div className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200 font-medium flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                            Email verifikasi baru telah dikirimkan ke {loginEmail}. Silakan periksa kotak masuk Anda.
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendLoginVerification}
                            disabled={resendLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-[6px] transition-colors disabled:opacity-50"
                          >
                            <Mail size={13} />
                            {resendLoading ? 'Mengirim Ulang...' : 'Kirim Ulang Email Verifikasi'}
                          </button>
                        )}
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
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loginLoading || isLocked}
                    className="w-full px-3 py-2 pl-9 pr-10 rounded-[8px] border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent transition-all disabled:bg-slate-100"
                  />
                  <Lock size={16} className="absolute left-3 top-2.5 text-[#94A3B8]" />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    disabled={loginLoading || isLocked}
                    className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#0F172A] transition-colors p-0.5 rounded focus:outline-none"
                    title={showLoginPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    aria-label={showLoginPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-[#64748B] flex items-center justify-between">
                <span>Sesi tersimpan hingga 14 hari di perangkat ini</span>
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
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 space-y-4">
            {regStep === 'success' ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-bold font-headline text-[#0F172A]">
                  Pendaftaran & Verifikasi Berhasil!
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed">
                  {regSuccessMessage || 'Akun pasien Anda telah aktif dan siap digunakan.'}
                </p>
                <div className="p-3 bg-emerald-50 rounded-[8px] border border-emerald-200 text-xs text-emerald-800 text-left">
                  Silakan masuk menggunakan email <strong>{regEmail}</strong> dan kata sandi yang telah Anda daftarkan.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setRegStep('form');
                  }}
                  className="w-full py-2.5 px-4 bg-[#0F172A] hover:bg-[#020617] text-white text-sm font-medium rounded-[8px] transition-colors shadow-sm"
                >
                  Beralih ke Halaman Masuk
                </button>
              </div>
            ) : regStep === 'otp' ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold mb-2">
                    <Mail size={24} />
                  </div>
                  <h3 className="text-lg font-bold font-headline text-[#0F172A]">
                    Verifikasi Email Pasien
                  </h3>
                  <p className="text-xs text-[#64748B] mt-1">
                    Kode verifikasi 6-digit telah dikirimkan ke:
                  </p>
                  <p className="text-xs font-semibold text-teal-800 bg-teal-50 py-1 px-2 rounded-md inline-block mt-1">
                    {regEmail}
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {regError && (
                    <div className="p-3 rounded-[8px] text-xs bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-600" />
                      <div>{regError}</div>
                    </div>
                  )}

                  {regSuccessMessage && (
                    <div className="p-3 rounded-[8px] text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-start gap-2">
                      <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                      <div>{regSuccessMessage}</div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-[#334155] mb-1.5 text-center">
                      Masukkan 6 Digit Kode OTP
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={regOtp}
                      onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      required
                      autoFocus
                      className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold py-3 px-4 rounded-[8px] border-2 border-teal-500 focus:outline-none focus:ring-2 focus:ring-[#059669] text-[#0F172A]"
                    />
                    <p className="text-[11px] text-center text-[#64748B] mt-1.5">
                      Periksa kotak masuk atau folder spam di email Anda.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={regLoading || regOtp.length !== 6}
                    className="w-full py-2.5 px-4 bg-[#059669] hover:bg-[#047857] text-white text-sm font-medium rounded-[8px] transition-colors shadow-sm disabled:opacity-50"
                  >
                    {regLoading ? 'Memverifikasi...' : 'Konfirmasi & Aktifkan Akun'}
                  </button>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setRegStep('form');
                        setRegError('');
                      }}
                      className="text-[#64748B] hover:text-[#0F172A] inline-flex items-center gap-1 font-medium"
                    >
                      <ArrowLeft size={14} />
                      Ubah Data / Email
                    </button>

                    {otpCountdown > 0 ? (
                      <span className="text-[#94A3B8]">
                        Kirim ulang ({otpCountdown}s)
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resendLoading}
                        className="text-[#059669] hover:underline font-semibold inline-flex items-center gap-1"
                      >
                        <RefreshCw size={13} className={resendLoading ? 'animate-spin' : ''} />
                        {resendLoading ? 'Mengirim...' : 'Kirim Ulang Kode'}
                      </button>
                    )}
                  </div>
                </form>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#334155] mb-1">
                      Kata Sandi (Min. 8 Karakter) *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Minimal 8 karakter..."
                        required
                        className="w-full px-3 py-2 pl-9 pr-10 rounded-[8px] border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                      />
                      <Lock size={16} className="absolute left-3 top-2.5 text-[#94A3B8]" />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#0F172A] transition-colors p-0.5 rounded focus:outline-none"
                        title={showRegPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                        aria-label={showRegPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      >
                        {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#334155] mb-1">
                      Konfirmasi Kata Sandi *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi..."
                        required
                        className="w-full px-3 py-2 pl-9 pr-10 rounded-[8px] border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                      />
                      <Lock size={16} className="absolute left-3 top-2.5 text-[#94A3B8]" />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#0F172A] transition-colors p-0.5 rounded focus:outline-none"
                        title={showRegConfirmPassword ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'}
                        aria-label={showRegConfirmPassword ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'}
                      >
                        {showRegConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {regConfirmPassword && regPassword !== regConfirmPassword && (
                  <p className="text-[11px] text-red-600 font-medium">
                    Konfirmasi kata sandi belum cocok dengan kata sandi di atas.
                  </p>
                )}
                {regConfirmPassword && regPassword === regConfirmPassword && (
                  <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 size={13} /> Kata sandi dan konfirmasi cocok
                  </p>
                )}

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
                  * Kode verifikasi 6 digit akan dikirimkan langsung ke email Anda untuk memvalidasi dan mengaktifkan akun.
                </p>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-2.5 px-4 bg-[#059669] hover:bg-[#047857] text-white text-sm font-medium rounded-[8px] transition-colors shadow-sm disabled:opacity-50"
                >
                  {regLoading ? 'Mengirim Kode Verifikasi...' : 'Daftar & Kirim Kode Verifikasi'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: FORGOT PASSWORD */}
        {activeTab === 'forgot' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 space-y-4">
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
                  Tautan pemulihan kata sandi telah dikirimkan ke email Anda. Silakan periksa kotak masuk atau folder spam Anda.
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
