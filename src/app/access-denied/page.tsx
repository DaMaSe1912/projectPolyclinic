"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export default function AccessDeniedPage() {
  const router = useRouter();
  const { user, role, logout } = useAuth();

  const getDashboardLink = () => {
    switch (role) {
      case 'patient':
        return { label: 'Kembali ke Antrean Pasien', path: '/pasien' };
      case 'front_desk':
        return { label: 'Kembali ke Meja Front Desk', path: '/petugas' };
      case 'doctor':
      case 'nurse':
        return { label: 'Kembali ke Ruang Pemeriksaan Klinis', path: '/klinis' };
      case 'admin':
        return { label: 'Kembali ke Dashboard Super Admin', path: '/admin' };
      default:
        return { label: 'Kembali ke Beranda', path: '/' };
    }
  };

  const dashboard = getDashboardLink();

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-16 bg-[#F8FAFC]">
      <div className="w-full max-w-lg bg-white rounded-[16px] shadow-sm border border-[#E2E8F0] p-8 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-2xl shadow-inner">
          <ShieldAlert size={36} />
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
            HTTP 403 Forbidden
          </span>
          <h1 className="text-2xl font-bold font-headline text-[#0F172A] mt-3">
            Akses Ditolak (Access Denied)
          </h1>
          <p className="text-sm text-[#64748B] mt-2 leading-relaxed">
            Akun Anda terdaftar dengan peran <strong className="text-[#0F172A] uppercase">{role}</strong>.
            Sesuai aturan keamanan PRD, hak akses ditentukan oleh akun pada server dan halaman ini tidak dapat diakses oleh peran Anda.
          </p>
        </div>

        <div className="p-4 rounded-[12px] bg-[#F1F5F9] border border-[#CBD5E1] text-left text-xs text-[#475569] space-y-1">
          <div className="font-semibold text-[#0F172A]">Informasi Sesi Aktif:</div>
          <div>Nama: {user?.name || 'Tamu / Belum Masuk'}</div>
          <div>Email: {user?.email || '-'}</div>
          <div>Peran: {role}</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href={dashboard.path}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F172A] text-white text-sm font-medium rounded-[8px] hover:bg-[#020617] transition-colors shadow-sm"
          >
            <ArrowLeft size={16} />
            {dashboard.label}
          </Link>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-[#CBD5E1] text-[#EF4444] text-sm font-medium rounded-[8px] hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            Ganti Akun / Keluar
          </button>
        </div>
      </div>
    </div>
  );
}

