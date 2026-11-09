"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Chip } from '@/components/ui/Chip';
import {
  LogOut,
  Monitor,
  ShieldCheck,
  Stethoscope,
  ClipboardList,
  LogIn,
  Menu,
  X,
  Home,
  CalendarCheck,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile/tablet menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Hide default navbar on waiting room TV display page for maximum screen real estate
  if (pathname === '/tv') return null;

  const roleLabelMap: Record<string, { label: string; variant: 'filter-active' | 'info' | 'success' | 'warning' }> = {
    patient: { label: 'Pasien', variant: 'success' },
    front_desk: { label: 'Resepsionis', variant: 'info' },
    doctor: { label: 'Dokter Umum', variant: 'filter-active' },
    nurse: { label: 'Perawat', variant: 'info' },
    admin: { label: 'Super Admin', variant: 'warning' },
    guest: { label: 'Tamu / Umum', variant: 'filter-active' },
  };

  const currentRoleInfo = roleLabelMap[role] || { label: 'Tamu', variant: 'filter-active' };
  const isStaff = role === 'front_desk' || role === 'doctor' || role === 'nurse' || role === 'admin';

  return (
    <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all w-full">
      {/* Full width container: keeps logo/clinic name on the far left edge and login/logout on the far right edge */}
      <div className="w-full px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Clinic Branding (Fixed on the far left edge) */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-[#0D9488] text-white flex items-center justify-center font-headline font-bold text-lg shadow-sm group-hover:scale-105 transition-all">
              <span className="text-teal-100">✦</span>V
            </div>
            <div>
              <div className="font-headline font-extrabold text-[15px] sm:text-[16px] text-[#0F172A] leading-tight group-hover:text-teal-700 transition-colors">
                Klinik Pratama Sehat Utama
              </div>
              <div className="font-body text-[11px] sm:text-[12px] text-[#0D9488] font-medium leading-tight">
                Poliklinik Umum
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links (Visible on Large Desktop >= 1024px, hidden on tablet and below) */}
          <nav className="hidden lg:flex items-center gap-2">
            <Link
              href="/"
              className={`px-3.5 py-2 rounded-xl text-[14px] font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-[#475569] hover:text-[#0F172A] hover:bg-slate-50'
              }`}
            >
              Beranda & Jadwal
            </Link>

            {/* TV Screen Button: Only accessible and visible to authorized staff roles, hidden for user and guest */}
            {isStaff && (
              <Link
                href="/tv"
                target="_blank"
                className="px-3.5 py-2 rounded-xl text-[14px] font-medium text-[#475569] hover:text-[#0F172A] hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
              >
                <Monitor size={15} className="text-[#0D9488]" />
                Layar TV Antrean
              </Link>
            )}

            {role === 'patient' && (
              <Link
                href="/pasien"
                className={`px-3.5 py-2 rounded-xl text-[14px] font-medium transition-colors ${
                  pathname === '/pasien'
                    ? 'bg-teal-50 text-teal-800 font-semibold'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-slate-50'
                }`}
              >
                Antrean Saya
              </Link>
            )}

            {role === 'front_desk' && (
              <Link
                href="/petugas"
                className={`px-3.5 py-2 rounded-xl text-[14px] font-medium flex items-center gap-1.5 transition-colors ${
                  pathname === '/petugas'
                    ? 'bg-teal-50 text-teal-800 font-semibold'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-slate-50'
                }`}
              >
                <ClipboardList size={16} />
                Meja Front Desk
              </Link>
            )}

            {(role === 'doctor' || role === 'nurse') && (
              <Link
                href="/klinis"
                className={`px-3.5 py-2 rounded-xl text-[14px] font-medium flex items-center gap-1.5 transition-colors ${
                  pathname === '/klinis'
                    ? 'bg-teal-50 text-teal-800 font-semibold'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-slate-50'
                }`}
              >
                <Stethoscope size={16} />
                Ruang Pemeriksaan
              </Link>
            )}

            {role === 'admin' && (
              <Link
                href="/admin"
                className={`px-3.5 py-2 rounded-xl text-[14px] font-medium flex items-center gap-1.5 transition-colors ${
                  pathname === '/admin'
                    ? 'bg-teal-50 text-teal-800 font-semibold'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-slate-50'
                }`}
              >
                <ShieldCheck size={16} />
                Super Admin
              </Link>
            )}
          </nav>

          {/* User Status & Auth Actions (Fixed on the far right edge) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Desktop user greeting */}
                <div className="text-right hidden xl:block">
                  <div className="text-[13px] font-semibold text-[#0F172A] leading-tight">
                    {user.name}
                  </div>
                  <Chip variant={currentRoleInfo.variant} className="text-[10px] mt-0.5">
                    {currentRoleInfo.label}
                  </Chip>
                </div>

                {/* Quick sign out button visible on desktop */}
                <button
                  onClick={() => logout()}
                  title="Keluar Akun (Sign Out)"
                  className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition-colors shadow-sm"
                >
                  <LogOut size={14} />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white text-[13px] font-semibold rounded-xl transition-all shadow-sm hover:shadow-md min-h-[38px]"
                >
                  <LogIn size={15} />
                  <span>Masuk Pasien</span>
                </Link>
              </div>
            )}

            {/* Tablet & Mobile Menu Button (Visible on < 1024px) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 lg:hidden rounded-2xl text-slate-700 hover:text-[#0F172A] hover:bg-slate-100 border border-slate-200/80 transition-all shadow-sm"
              aria-label={mobileMenuOpen ? 'Tutup Menu' : 'Buka Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} className="text-teal-700" /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Tablet & Mobile Navigation Dropdown (< 1024px) */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200/80 py-4 px-3 space-y-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl my-2 border border-slate-200/80 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* User Profile Card for Logged-In Tablet/Mobile Users */}
            {user ? (
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl mb-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-[#0D9488] flex items-center justify-center font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#0F172A] leading-tight">
                      {user.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {user.email}
                    </div>
                  </div>
                </div>
                <Chip variant={currentRoleInfo.variant} className="text-[10px]">
                  {currentRoleInfo.label}
                </Chip>
              </div>
            ) : null}

            {/* Navigation Links with Cozy Rounded Items */}
            <div className="space-y-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  pathname === '/'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Home size={17} className={pathname === '/' ? 'text-white' : 'text-teal-600'} />
                <span>Beranda & Jadwal Praktik</span>
              </Link>

              {/* TV Screen Button in Mobile/Tablet Drawer: Only visible for staff roles */}
              {isStaff && (
                <Link
                  href="/tv"
                  target="_blank"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all"
                >
                  <Monitor size={17} className="text-teal-600" />
                  <span>Layar TV Antrean Ruang Tunggu</span>
                </Link>
              )}

              {role === 'patient' && (
                <Link
                  href="/pasien"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    pathname === '/pasien'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CalendarCheck size={17} className={pathname === '/pasien' ? 'text-white' : 'text-teal-600'} />
                  <span>Antrean Saya</span>
                </Link>
              )}

              {role === 'front_desk' && (
                <Link
                  href="/petugas"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    pathname === '/petugas'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ClipboardList size={17} className={pathname === '/petugas' ? 'text-white' : 'text-teal-600'} />
                  <span>Meja Front Desk</span>
                </Link>
              )}

              {(role === 'doctor' || role === 'nurse') && (
                <Link
                  href="/klinis"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    pathname === '/klinis'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Stethoscope size={17} className={pathname === '/klinis' ? 'text-white' : 'text-teal-600'} />
                  <span>Ruang Pemeriksaan Klinis</span>
                </Link>
              )}

              {role === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    pathname === '/admin'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck size={17} className={pathname === '/admin' ? 'text-white' : 'text-teal-600'} />
                  <span>Super Admin</span>
                </Link>
              )}
            </div>

            {/* Bottom Actions for Tablet/Mobile */}
            <div className="pt-3 border-t border-slate-200/80">
              {user ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors shadow-sm"
                >
                  <LogOut size={16} />
                  <span>Keluar dari Akun</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-sm shadow-sm transition-all"
                  >
                    <LogIn size={16} />
                    <span>Masuk Akun Pasien</span>
                  </Link>
                  <Link
                    href="/staff"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-medium text-xs hover:bg-slate-200 transition-colors"
                  >
                    <span>Masuk Portal Khusus Staf / Nakes</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
