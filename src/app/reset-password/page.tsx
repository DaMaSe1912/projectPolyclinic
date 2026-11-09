"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, CheckCircle2, AlertTriangle, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Token reset password tidak valid atau tidak disertakan pada tautan.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Kata sandi minimal harus terdiri dari 8 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Gagal mengatur ulang kata sandi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-16 bg-[#F8FAFC]">
      <div className="w-full max-w-md bg-white rounded-[16px] shadow-sm border border-[#E2E8F0] p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-[12px] bg-[#0F172A] text-white flex items-center justify-center font-bold text-xl mb-3 shadow-md">
            <KeyRound size={22} className="text-[#10B981]" />
          </div>
          <h1 className="text-2xl font-bold font-headline text-[#0F172A]">
            Atur Ulang Kata Sandi
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Masukkan kata sandi baru yang aman untuk akun Anda
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-lg font-bold font-headline text-[#0F172A]">
              Kata Sandi Berhasil Diperbarui!
            </h2>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Anda sekarang dapat masuk ke akun Anda menggunakan kata sandi yang baru.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0F172A] hover:bg-[#020617] text-white text-sm font-medium rounded-[8px] transition-colors shadow-sm"
              >
                <span>Masuk Sekarang</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-[8px] text-xs text-red-700 flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter..."
                  required
                  className="w-full px-3 py-2 pl-9 pr-10 rounded-[8px] border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent transition-all"
                />
                <Lock size={15} className="absolute left-3 top-3 text-[#94A3B8]" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#0F172A] transition-colors p-0.5 rounded focus:outline-none"
                  title={showNewPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  aria-label={showNewPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-1">
                Minimal 8 karakter untuk pasien, 12 karakter untuk staf.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Konfirmasi Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi..."
                  required
                  className="w-full px-3 py-2 pl-9 pr-10 rounded-[8px] border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent transition-all"
                />
                <Lock size={15} className="absolute left-3 top-3 text-[#94A3B8]" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#0F172A] transition-colors p-0.5 rounded focus:outline-none"
                  title={showConfirmPassword ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'}
                  aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#0F172A] hover:bg-[#020617] text-white text-sm font-medium rounded-[8px] transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-xs text-[#059669] hover:underline font-medium"
              >
                Batal dan kembali ke halaman masuk
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[#64748B]">Memuat...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

