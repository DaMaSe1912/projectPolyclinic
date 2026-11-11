"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Stethoscope,
  ClipboardList,
  Lock,
  Mail,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function StaffLoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('resepsionis@poliklinik.id');
  const [password, setPassword] = useState('StafFrontDesk2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState<number | null>(null);

  // Quick fill staff demo accounts
  const staffDemos = [
    {
      title: 'Dewi Lestari (Front Desk)',
      role: 'front_desk',
      email: 'resepsionis@poliklinik.id',
      pass: 'StafFrontDesk2026!',
      icon: ClipboardList,
      desc: 'Batas idle 10 menit (PC Front Desk)',
    },
    {
      title: 'dr. Budi Santoso, Sp.PD',
      role: 'doctor',
      email: 'dr.budi@poliklinik.id',
      pass: 'DokterBudi2026!',
      icon: Stethoscope,
      desc: 'Batas idle 5 menit (Tablet Poli Umum 1)',
    },
    {
      title: 'dr. Siti Rahma, Sp.A',
      role: 'doctor',
      email: 'dr.siti@poliklinik.id',
      pass: 'DokterSiti2026!',
      icon: Stethoscope,
      desc: 'Batas idle 5 menit (Tablet Poli Umum 2)',
    },
    {
      title: 'dr. Hendra Wijaya, Sp.JP',
      role: 'doctor',
      email: 'dr.hendra@poliklinik.id',
      pass: 'DokterHendra2026!',
      icon: Stethoscope,
      desc: 'Batas idle 5 menit (Poli Jantung & Kardio)',
    },
    {
      title: 'dr. Anita Kusuma',
      role: 'doctor',
      email: 'dr.anita@poliklinik.id',
      pass: 'DokterAnita2026!',
      icon: Stethoscope,
      desc: 'Batas idle 5 menit (Poli MCU & Umum)',
    },
    {
      title: 'dr. Farhan Ramadhan',
      role: 'doctor',
      email: 'dr.farhan@poliklinik.id',
      pass: 'DokterFarhan2026!',
      icon: Stethoscope,
      desc: 'Batas idle 5 menit (Poli Primer Weekend)',
    },
    {
      title: 'Ns. Maya Putri, S.Kep (Perawat)',
      role: 'nurse',
      email: 'perawat.maya@poliklinik.id',
      pass: 'PerawatMaya2026!',
      icon: Stethoscope,
      desc: 'Batas idle 5 menit (Tablet Triage / Poli)',
    },
  ];

  const handleQuickFill = (item: typeof staffDemos[0]) => {
    setEmail(item.email);
    setPassword(item.pass);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setIsLocked(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portal: 'staff',
          email: email.trim(),
          password: password.trim(),
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

      login(data.user);

      // Route by staff role
      if (data.user.role === 'front_desk') {
        router.push('/petugas');
      } else if (data.user.role === 'doctor' || data.user.role === 'nurse') {
        router.push('/klinis');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal masuk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12 bg-[#F8FAFC]">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-[#0D9488] text-white items-center justify-center font-bold text-xl mb-3 shadow-md shadow-teal-700/10">
            <ClipboardList size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-headline font-extrabold text-[#0F172A]">
            Portal Staf Poliklinik
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Khusus Resepsionis Front Desk & Tenaga Medis (Dokter / Perawat)
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/80 text-slate-700 text-xs font-medium">
            <Clock size={13} className="text-teal-700" />
            <span>Sesi berakhir otomatis saat perangkat idle</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
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
                  <div className="font-semibold">{error}</div>
                  {isLocked && (
                    <div className="text-[11px] mt-1 text-amber-700">
                      Sistem mengunci akun untuk mencegah serangan brute force sesuai aturan PRD.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Alamat Email Staf
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staf@poliklinik.id"
                  required
                  disabled={loading || isLocked}
                  className="w-full px-3 py-2.5 pl-9 rounded-[8px] border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent transition-all disabled:bg-slate-100"
                />
                <Mail size={16} className="absolute left-3 top-3 text-[#94A3B8]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Kata Sandi (Minimal 12 Karakter)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={loading || isLocked}
                  className="w-full px-3 py-2.5 pl-9 pr-10 rounded-[8px] border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent transition-all disabled:bg-slate-100"
                />
                <Lock size={16} className="absolute left-3 top-3 text-[#94A3B8]" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || isLocked}
                  className="absolute right-3 top-3 text-[#94A3B8] hover:text-[#0F172A] transition-colors p-0.5 rounded focus:outline-none"
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="text-[11px] text-[#64748B] bg-[#F8FAFC] p-2.5 rounded-[8px] border border-[#E2E8F0]">
              ℹ️ <strong>Perhatian:</strong> Akun staf dibuat dan dikelola langsung oleh Super Admin IT. Tidak tersedia pendaftaran mandiri untuk staf.
            </div>

            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full py-2.5 px-4 bg-[#0F172A] hover:bg-[#020617] text-white text-sm font-medium rounded-[8px] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Portal Staf'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* Demo Quick-Fill Drawer */}
        <div className="bg-white p-4 rounded-[12px] border border-[#CBD5E1] shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A] mb-3">
            <Sparkles size={14} className="text-[#059669]" />
            <span>Kredensial Demo Akun Staf (Pengujian Cepat)</span>
          </div>

          <div className="space-y-2">
            {staffDemos.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickFill(item)}
                  className="w-full text-left p-2.5 rounded-[8px] border border-[#E2E8F0] hover:border-[#059669] hover:bg-[#F0FDF4] transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded bg-slate-100 text-slate-700 group-hover:bg-[#059669] group-hover:text-white transition-colors">
                      <IconComp size={15} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#0F172A] leading-tight">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">
                        {item.email} • {item.desc}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#059669] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Gunakan ↵
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

