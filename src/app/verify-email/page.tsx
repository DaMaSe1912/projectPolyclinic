"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertTriangle, ArrowRight, Mail } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Token verifikasi tidak ditemukan pada tautan.');
      return;
    }

    const doVerify = async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setSuccess(true);
        if (data.email) setUserEmail(data.email);
      } catch (err: any) {
        setError(err.message || 'Verifikasi email gagal.');
      } finally {
        setLoading(false);
      }
    };

    doVerify();
  }, [token]);

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-16 bg-[#F8FAFC]">
      <div className="w-full max-w-md bg-white rounded-[16px] shadow-sm border border-[#E2E8F0] p-8 text-center space-y-6">
        {loading ? (
          <div className="py-8 space-y-4">
            <div className="w-12 h-12 mx-auto border-3 border-[#059669] border-t-transparent rounded-full animate-spin" />
            <h2 className="text-lg font-bold font-headline text-[#0F172A]">
              Memverifikasi Alamat Email...
            </h2>
            <p className="text-xs text-[#64748B]">Mohon tunggu sebentar selagi kami mengaktifkan akun Anda.</p>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>
            <h1 className="text-2xl font-bold font-headline text-[#0F172A]">
              Email Berhasil Diverifikasi!
            </h1>
            <p className="text-sm text-[#475569] leading-relaxed">
              Akun pasien dengan email <strong className="text-[#0F172A]">{userEmail}</strong> telah aktif. Anda sekarang dapat masuk untuk melihat jadwal dan memesan nomor antrean dokter.
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#0F172A] hover:bg-[#020617] text-white text-sm font-medium rounded-[8px] transition-colors shadow-sm"
              >
                <span>Masuk ke Akun Pasien</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle size={36} />
            </div>
            <h1 className="text-xl font-bold font-headline text-[#0F172A]">
              Verifikasi Email Gagal
            </h1>
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-[8px] border border-red-200">
              {error}
            </p>
            <p className="text-xs text-[#64748B]">
              Tautan mungkin sudah kedaluwarsa atau telah digunakan sebelumnya. Silakan masuk atau minta tautan baru.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9] text-sm font-medium rounded-[8px] transition-colors"
              >
                Kembali ke Halaman Masuk
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[#64748B]">Memuat...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

