"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Chip } from '@/components/ui/Chip';
import { LogOut, Monitor, ShieldCheck, Stethoscope, ClipboardList, LogIn, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hide default navbar on waiting room TV display page for maximum screen real estate
  if (pathname === '/tv') return null;

  const roleLabelMap: Record<string, { label: string; variant: 'filter-active' | 'info' | 'success' | 'warning' }> = {
    patient: { label: 'Pasien', variant: 'success' },
    front_desk: { label: 'Resepsionis', variant: 'info' },
    doctor: { label: 'Dokter Gigi', variant: 'filter-active' },
    nurse: { label: 'Perawat', variant: 'info' },
    admin: { label: 'Super Admin', variant: 'warning' },
    guest: { label: 'Tamu / Umum', variant: 'filter-active' },
  };

  const currentRoleInfo = roleLabelMap[role] || { label: 'Tamu', variant: 'filter-active' };

  return (
    <header className="no-print sticky top-0 z-40 bg-white border-b border-[#E2E8F0] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Clinic Branding */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-[8px] bg-[#0F172A] text-white flex items-center justify-center font-headline font-bold text-lg group-hover:bg-[#020617] transition-colors">
              <span className="text-[#059669]">✦</span>V
            </div>
            <div>
              <div className="font-headline font-bold text-[16px] text-[#0F172A] leading-tight">
                Klinik Pratama Sehat Utama
              </div>
              <div className="font-body text-[12px] text-[#059669] font-medium leading-tight">
                Poliklinik Gigi & Mulut (Dental Care)
              </div>
            </div>
          </Link>

          {/* Navigation Links based on role (Desktop & Tablet Landscape) */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-[6px] text-[14px] font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-[#F1F5F9] text-[#0F172A]'
                  : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              Beranda & Jadwal
            </Link>

            <Link
              href="/tv"
              target="_blank"
              className="px-3 py-2 rounded-[6px] text-[14px] font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center gap-1.5"
            >
              <Monitor size={15} className="text-[#059669]" />
              Layar TV Antrean
            </Link>

            {role === 'patient' && (
              <Link
                href="/pasien"
                className={`px-3 py-2 rounded-[6px] text-[14px] font-medium transition-colors ${
                  pathname === '/pasien'
                    ? 'bg-[#F1F5F9] text-[#0F172A]'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                Antrean Saya
              </Link>
            )}

            {role === 'front_desk' && (
              <Link
                href="/petugas"
                className={`px-3 py-2 rounded-[6px] text-[14px] font-medium flex items-center gap-1.5 transition-colors ${
                  pathname === '/petugas'
                    ? 'bg-[#F1F5F9] text-[#0F172A]'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                <ClipboardList size={16} />
                Meja Front Desk
              </Link>
            )}

            {(role === 'doctor' || role === 'nurse') && (
              <Link
                href="/klinis"
                className={`px-3 py-2 rounded-[6px] text-[14px] font-medium flex items-center gap-1.5 transition-colors ${
                  pathname === '/klinis'
                    ? 'bg-[#F1F5F9] text-[#0F172A]'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                <Stethoscope size={16} />
                Ruang Pemeriksaan
              </Link>
            )}

            {role === 'admin' && (
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-[6px] text-[14px] font-medium flex items-center gap-1.5 transition-colors ${
                  pathname === '/admin'
                    ? 'bg-[#F1F5F9] text-[#0F172A]'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                <ShieldCheck size={16} />
                Super Admin
              </Link>
            )}
          </nav>

          {/* User Status & Auth Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-[13px] font-medium text-[#0F172A] leading-tight">
                    {user.name}
                  </div>
                  <Chip variant={currentRoleInfo.variant} className="text-[10px] mt-0.5">
                    {currentRoleInfo.label}
                  </Chip>
                </div>

                {/* Clear Sign Out button for shared devices and staff */}
                <button
                  onClick={() => logout()}
                  title="Keluar Akun (Sign Out)"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition-colors shadow-sm"
                >
                  <LogOut size={14} />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#0F172A] text-white text-[13px] sm:text-[14px] font-medium rounded-[8px] hover:bg-[#020617] transition-colors min-h-[38px] sm:min-h-[40px]"
                >
                  <LogIn size={15} />
                  <span>Masuk Pasien</span>
                </Link>
              </div>
            )}

            {/* Mobile / Tablet Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden rounded-[8px] text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
              aria-label="Buka Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E2E8F0] py-3 px-2 space-y-1 bg-[#F8FAFC] rounded-b-[12px] shadow-sm animate-in fade-in duration-150">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-[6px] text-sm font-medium ${
                pathname === '/' ? 'bg-[#0F172A] text-white' : 'text-[#334155] hover:bg-[#E2E8F0]'
              }`}
            >
              Beranda & Jadwal
            </Link>

            <Link
              href="/tv"
              target="_blank"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-[6px] text-sm font-medium text-[#334155] hover:bg-[#E2E8F0]"
            >
              <Monitor size={16} className="text-[#059669]" />
              Layar TV Antrean
            </Link>

            {role === 'patient' && (
              <Link
                href="/pasien"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-[6px] text-sm font-medium ${
                  pathname === '/pasien' ? 'bg-[#0F172A] text-white' : 'text-[#334155] hover:bg-[#E2E8F0]'
                }`}
              >
                Antrean Saya
              </Link>
            )}

            {role === 'front_desk' && (
              <Link
                href="/petugas"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-[6px] text-sm font-medium ${
                  pathname === '/petugas' ? 'bg-[#0F172A] text-white' : 'text-[#334155] hover:bg-[#E2E8F0]'
                }`}
              >
                <ClipboardList size={16} />
                Meja Front Desk
              </Link>
            )}

            {(role === 'doctor' || role === 'nurse') && (
              <Link
                href="/klinis"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-[6px] text-sm font-medium ${
                  pathname === '/klinis' ? 'bg-[#0F172A] text-white' : 'text-[#334155] hover:bg-[#E2E8F0]'
                }`}
              >
                <Stethoscope size={16} />
                Ruang Pemeriksaan Klinis
              </Link>
            )}

            {role === 'admin' && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-[6px] text-sm font-medium ${
                  pathname === '/admin' ? 'bg-[#0F172A] text-white' : 'text-[#334155] hover:bg-[#E2E8F0]'
                }`}
              >
                <ShieldCheck size={16} />
                Super Admin
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
