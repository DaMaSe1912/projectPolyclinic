"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserAccount, UserRole } from '@/types';

interface AuthContextType {
  user: UserAccount | null;
  role: UserRole;
  isLoading: boolean;
  login: (userData: UserAccount) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isPatient: boolean;
  isFrontDesk: boolean;
  isDoctor: boolean;
  isNurse: boolean;
  isAdmin: boolean;
  idleSecondsLeft: number | null;
  showIdleWarning: boolean;
  dismissIdleWarning: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: 'guest',
  isLoading: true,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => {},
  isPatient: false,
  isFrontDesk: false,
  isDoctor: false,
  isNurse: false,
  isAdmin: false,
  idleSecondsLeft: null,
  showIdleWarning: false,
  dismissIdleWarning: () => {},
});

// Idle limit in seconds per role:
// Front desk: 10 mins = 600s
// Doctor/Nurse: 5 mins = 300s
// Admin: 15 mins = 900s
// Patient: no auto idle signout (14 days session)
const getRoleIdleSeconds = (role: UserRole): number | null => {
  switch (role) {
    case 'front_desk':
      return 10 * 60;
    case 'doctor':
    case 'nurse':
      return 5 * 60;
    case 'admin':
      return 15 * 60;
    default:
      return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [idleSecondsLeft, setIdleSecondsLeft] = useState<number | null>(null);
  const [showIdleWarning, setShowIdleWarning] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());
  const idleCheckIntervalRef = useRef<any>(null);

  // Sync user from server session
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        lastActivityRef.current = Date.now();
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to sync auth session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = (userData: UserAccount) => {
    setUser(userData);
    lastActivityRef.current = Date.now();
    setShowIdleWarning(false);
  };

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Error logging out:', e);
    } finally {
      const prevRole = user?.role;
      setUser(null);
      setShowIdleWarning(false);
      setIdleSecondsLeft(null);

      // Redirect based on previous role
      if (prevRole === 'admin') {
        router.push('/admin');
      } else if (prevRole === 'front_desk' || prevRole === 'doctor' || prevRole === 'nurse') {
        router.push('/staff');
      } else {
        router.push('/login');
      }
    }
  }, [user, router]);

  const dismissIdleWarning = () => {
    lastActivityRef.current = Date.now();
    setShowIdleWarning(false);
    // Touch server session
    fetch('/api/auth/me', { cache: 'no-store' });
  };

  // Activity listeners to reset idle counter
  useEffect(() => {
    if (!user) return;
    const idleLimit = getRoleIdleSeconds(user.role);
    if (!idleLimit) return;

    const handleUserActivity = () => {
      // Only reset if not currently in warning modal state
      if (!showIdleWarning) {
        lastActivityRef.current = Date.now();
      }
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    // Interval checker running every second
    idleCheckIntervalRef.current = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = idleLimit - elapsedSeconds;

      if (remaining <= 0) {
        // Idle timeout reached!
        clearInterval(idleCheckIntervalRef.current);
        logout();
      } else if (remaining <= 60) {
        // Warning threshold reached (last 60 seconds)
        setIdleSecondsLeft(remaining);
        setShowIdleWarning(true);
      } else {
        setIdleSecondsLeft(null);
        setShowIdleWarning(false);
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      if (idleCheckIntervalRef.current) clearInterval(idleCheckIntervalRef.current);
    };
  }, [user, showIdleWarning, logout]);

  const role: UserRole = user?.role || 'guest';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        login,
        logout,
        refreshUser,
        isPatient: role === 'patient',
        isFrontDesk: role === 'front_desk',
        isDoctor: role === 'doctor',
        isNurse: role === 'nurse',
        isAdmin: role === 'admin',
        idleSecondsLeft,
        showIdleWarning,
        dismissIdleWarning,
      }}
    >
      {children}

      {/* Shared Device Idle Timeout Warning Modal */}
      {showIdleWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[16px] shadow-2xl border border-amber-300 p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-headline font-bold text-2xl">
              ⏳
            </div>
            <div>
              <h3 className="text-xl font-bold font-headline text-[#0F172A]">
                Peringatan Batas Waktu Idle
              </h3>
              <p className="text-sm text-[#475569] mt-2">
                Sesuai kebijakan keamanan perangkat bersama klinik, sesi Anda akan berakhir otomatis dalam:
              </p>
              <div className="text-3xl font-bold font-mono text-amber-600 my-3">
                {idleSecondsLeft ?? 60} Detik
              </div>
              <p className="text-xs text-[#94A3B8]">
                Klik tombol di bawah jika Anda masih aktif menggunakan perangkat ini.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={logout}
                className="flex-1 py-2.5 px-4 rounded-[8px] border border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9] font-medium text-sm transition-colors"
              >
                Keluar Sekarang
              </button>
              <button
                type="button"
                onClick={dismissIdleWarning}
                className="flex-1 py-2.5 px-4 rounded-[8px] bg-[#059669] hover:bg-[#047857] text-white font-medium text-sm transition-colors shadow-sm"
              >
                Saya Masih Di Sini
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
