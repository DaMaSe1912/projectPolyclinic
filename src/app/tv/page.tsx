"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Doctor, QueueItem } from '@/types';
import {
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Maximize2,
  Clock,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';

export default function WaitingRoomTvPage() {
  const router = useRouter();
  const { role, isLoading: authLoading } = useAuth();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [lastCalledNumber, setLastCalledNumber] = useState<string>('');
  const [flashCall, setFlashCall] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Initialize theme from localStorage if available
  useEffect(() => {
    const savedTheme = localStorage.getItem('tv_theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
    } else if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('tv_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // Restrict access: only authorized clinic staff can access TV display page
  useEffect(() => {
    if (!authLoading) {
      if (role === 'patient') {
        router.push('/access-denied');
      } else if (role === 'guest') {
        router.push('/staff');
      }
    }
  }, [role, authLoading, router]);

  // Digital clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch queue every 1.5 seconds (< 2s PRD rule)
  useEffect(() => {
    const fetchTvData = async () => {
      try {
        const [docRes, queueRes] = await Promise.all([
          fetch('/api/doctors'),
          fetch('/api/queue'),
        ]);

        if (!docRes.ok || !queueRes.ok) throw new Error('Network error');

        const docData = await docRes.json();
        const queueData = await queueRes.json();

        if (docData.success) setDoctors(docData.data);
        if (queueData.success) {
          const newQueue: QueueItem[] = queueData.data;
          setQueue(newQueue);

          // Check if any doctor just called a number
          newQueue.forEach((item) => {
            if (item.status === 'called' && item.queueNumber !== lastCalledNumber) {
              setLastCalledNumber(item.queueNumber);
              setFlashCall(true);
              setTimeout(() => setFlashCall(false), 5000);

              // Sound chime
              if (isAudioEnabled && 'speechSynthesis' in window) {
                const doc = docData.data?.find((d: Doctor) => d.id === item.doctorId);
                const speech = new SpeechSynthesisUtterance(
                  `Nomor antrean, ${item.queueNumber.replace('-', ' ')}, silakan menuju ${doc?.room || 'ruang periksa'}`
                );
                speech.lang = 'id-ID';
                window.speechSynthesis.speak(speech);
              }
            }
          });
        }
        setIsOnline(true);
      } catch (e) {
        setIsOnline(false);
      }
    };

    fetchTvData();
    const interval = setInterval(fetchTvData, 1500);
    return () => clearInterval(interval);
  }, [isAudioEnabled, lastCalledNumber]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Strictly filter only doctors who are on duty. Off-duty doctors and their schedules are never displayed.
  const onDutyDoctors = doctors.filter((d) => d.isOnDuty);

  const onDutyDoctorSchedules = onDutyDoctors
    .map((doc) => `${doc.name} (${doc.room} • Shift ${doc.shiftHours})`)
    .join('  |  ');

  return (
    <div
      className={`min-h-screen w-full flex flex-col justify-between font-body select-none overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-[#0F172A] text-white' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
    >
      {/* Offline / Reconnecting Banner per PRD */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-center py-2 px-4 font-headline font-bold text-sm flex items-center justify-center gap-2">
          <WifiOff size={18} />
          <span>Sedang menyambungkan ulang ke server antrean klinik (Reconnecting... Menampilkan data tersimpan)</span>
        </div>
      )}

      {/* TV Header Bar */}
      <header
        className={`px-8 py-5 flex items-center justify-between transition-colors duration-300 ${
          isDarkMode
            ? 'bg-[#020617] border-b border-slate-800'
            : 'bg-white border-b border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center font-headline font-bold text-2xl shadow-lg border ${
              isDarkMode
                ? 'bg-slate-900 border-slate-700 text-[#0D9488]'
                : 'bg-teal-50 border-teal-200 text-[#0D9488]'
            }`}
          >
            ✦V
          </div>
          <div>
            <h1
              className={`font-headline font-bold text-2xl tracking-wide uppercase ${
                isDarkMode ? 'text-white' : 'text-[#0F172A]'
              }`}
            >
              Klinik Pratama Sehat Utama
            </h1>
            <p className="text-sm font-medium text-[#0D9488] tracking-wider">
              Poliklinik Umum • Layar Informasi Antrean Ruang Tunggu
            </p>
          </div>
        </div>

        {/* Clock & Controls */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div
              className={`font-mono text-3xl font-bold tracking-wider ${
                isDarkMode ? 'text-emerald-400' : 'text-[#0D9488]'
              }`}
            >
              {currentTime}
            </div>
            <div className={`text-xs capitalize ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {currentDate}
            </div>
          </div>

          <div
            className={`flex items-center gap-2 p-1.5 rounded-xl border ${
              isDarkMode
                ? 'bg-slate-900 border-slate-800'
                : 'bg-slate-100 border-slate-200'
            }`}
          >
            {/* Theme Switcher Toggle (Terang / Malam) */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                isDarkMode
                  ? 'hover:bg-slate-800 text-amber-300'
                  : 'hover:bg-slate-200 text-slate-700'
              }`}
              title={isDarkMode ? 'Ganti ke Mode Terang (Siang)' : 'Ganti ke Mode Malam (Gelap)'}
              aria-label={isDarkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Malam'}
            >
              {isDarkMode ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} className="text-indigo-600" />}
              <span className="hidden sm:inline text-[11px] font-mono">
                {isDarkMode ? 'Malam' : 'Terang'}
              </span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-slate-800 text-slate-300'
                  : 'hover:bg-slate-200 text-slate-700'
              }`}
              title={isAudioEnabled ? 'Matikan Suara Panggilan' : 'Nyalakan Suara Panggilan'}
              aria-label="Suara Panggilan"
            >
              {isAudioEnabled ? (
                <Volume2 size={19} className={isDarkMode ? 'text-emerald-400' : 'text-[#0D9488]'} />
              ) : (
                <VolumeX size={19} className="text-slate-400" />
              )}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-slate-800 text-slate-300'
                  : 'hover:bg-slate-200 text-slate-700'
              }`}
              title="Mode Layar Penuh (F11)"
              aria-label="Mode Layar Penuh"
            >
              <Maximize2 size={19} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Calling Stage for On-Duty Doctors */}
      <main className="flex-1 p-6 md:p-8 flex flex-col justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto w-full">
          {onDutyDoctors.length === 0 ? (
            <div
              className={`col-span-2 text-center py-20 rounded-3xl border shadow-sm ${
                isDarkMode
                  ? 'bg-slate-900/50 border-slate-800 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <p className="text-2xl font-headline font-bold">
                Layanan Poliklinik Umum Sedang Tutup
              </p>
              <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                Tidak ada dokter yang sedang bertugas saat ini. Jam operasional buka kembali pukul 08:00 WIB.
              </p>
            </div>
          ) : (
            onDutyDoctors.map((doc) => {
              const docQueue = queue.filter((q) => q.doctorId === doc.id);
              const currentCalling = docQueue.find(
                (q) => q.status === 'called' || q.status === 'in_consultation'
              );
              const waitingList = docQueue.filter(
                (q) => q.status === 'waiting' || q.status === 'checked_in'
              );
              const isFlashing = flashCall && currentCalling?.queueNumber === lastCalledNumber;

              return (
                <div
                  key={doc.id}
                  className={`rounded-3xl border transition-all duration-500 p-7 flex flex-col justify-between relative overflow-hidden ${
                    isDarkMode
                      ? `bg-slate-900/90 shadow-2xl ${
                          isFlashing
                            ? 'border-emerald-400 ring-4 ring-emerald-500/40 animate-call-pulse'
                            : 'border-slate-800'
                        }`
                      : `bg-white shadow-xl ring-1 ring-slate-100 ${
                          isFlashing
                            ? 'border-[#0D9488] ring-4 ring-teal-500/30 animate-call-pulse'
                            : 'border-slate-200'
                        }`
                  }`}
                >
                  {/* Doctor Info Header with Active Shift Schedule */}
                  <div
                    className={`flex items-start justify-between border-b pb-4 ${
                      isDarkMode ? 'border-slate-800' : 'border-slate-100'
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="inline-block px-3 py-1 rounded-md bg-[#0D9488] text-white font-mono font-bold text-xs uppercase tracking-wider">
                          {doc.room} • KODE {doc.code}
                        </span>
                        {/* Jadwal Praktik Dokter yang Sedang Bertugas */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                            isDarkMode
                              ? 'bg-slate-800/90 text-teal-300 border-slate-700'
                              : 'bg-teal-50 text-teal-800 border-teal-200'
                          }`}
                        >
                          <Clock size={12} />
                          Shift Praktik: {doc.shiftHours}
                        </span>
                      </div>
                      <h2
                        className={`font-headline font-bold text-2xl ${
                          isDarkMode ? 'text-white' : 'text-[#0F172A]'
                        }`}
                      >
                        {doc.name}
                      </h2>
                      <p className="text-sm text-[#0D9488] font-medium mt-0.5">{doc.specialty}</p>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Status Dokter
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isDarkMode
                            ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60'
                            : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        }`}
                      >
                        MELAYANI
                      </span>
                    </div>
                  </div>

                  {/* GIANT CALLING NUMBER DISPLAY (Hospital-grade readable from across room) */}
                  <div className="py-8 my-auto text-center">
                    <span
                      className={`text-sm uppercase font-mono font-bold tracking-widest block mb-2 ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      NOMOR YANG SEDANG DIPANGGIL
                    </span>

                    <div className="relative inline-block">
                      <div
                        className={`text-8xl sm:text-9xl font-mono font-bold tracking-wider transition-colors ${
                          currentCalling
                            ? isDarkMode
                              ? 'text-emerald-400'
                              : 'text-[#0D9488]'
                            : isDarkMode
                            ? 'text-slate-700'
                            : 'text-slate-300'
                        }`}
                      >
                        {currentCalling ? currentCalling.queueNumber : '---'}
                      </div>
                      {isFlashing && (
                        <div className="absolute -top-3 -right-6 px-3 py-1 bg-[#0D9488] text-white font-headline font-bold text-xs rounded-full uppercase tracking-wider animate-bounce shadow-md">
                          Dipanggil!
                        </div>
                      )}
                    </div>

                    <p
                      className={`text-base font-medium mt-3 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {currentCalling?.status === 'in_consultation'
                        ? 'Pasien Sedang Di Dalam Ruangan'
                        : currentCalling
                        ? 'Silakan Langsung Memasuki Ruangan Dokter'
                        : 'Menunggu Pasien Selanjutnya'}
                    </p>
                  </div>

                  {/* Next Up Footer */}
                  <div
                    className={`rounded-2xl p-4 border flex items-center justify-between ${
                      isDarkMode
                        ? 'bg-slate-950/80 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <span
                        className={`text-xs uppercase block font-mono ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        NOMOR BERIKUTNYA
                      </span>
                      <span
                        className={`text-2xl font-mono font-bold ${
                          isDarkMode ? 'text-white' : 'text-[#0F172A]'
                        }`}
                      >
                        {waitingList.length > 0 ? waitingList[0].queueNumber : '---'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs block ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        Sisa Antrean
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        {waitingList.length} Pasien Menunggu
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Running Marquee & Clinic Announcements */}
      <footer
        className={`border-t py-3 px-6 flex items-center gap-4 text-xs transition-colors duration-300 ${
          isDarkMode
            ? 'bg-[#020617] border-slate-800'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div
          className={`shrink-0 flex items-center gap-1.5 font-headline font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border ${
            isDarkMode
              ? 'bg-slate-900 border-slate-800 text-emerald-400'
              : 'bg-teal-50 border-teal-200 text-[#0D9488]'
          }`}
        >
          <Sparkles size={14} /> PENGUMUMAN
        </div>

        <div className="flex-1 overflow-hidden whitespace-nowrap">
          <div
            className={`inline-block animate-marquee ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {onDutyDoctorSchedules
              ? `🩺 Jadwal Dokter Bertugas Hari Ini: ${onDutyDoctorSchedules} • `
              : 'Layanan konsultasi poliklinik sedang tidak aktif saat ini • '}
            Selamat datang di Poliklinik Umum Klinik Pratama Sehat Utama • Harap persiapkan tiket antrean atau kartu identitas saat nomor Anda dipanggil • Pasien lansia dan kondisi darurat mendapatkan prioritas pelayanan • Registrasi online dapat dilakukan melalui website resmi kami.
          </div>
        </div>

        <div
          className={`shrink-0 text-[11px] font-mono ${
            isDarkMode ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          Standar Layar RS 1080p
        </div>
      </footer>
    </div>
  );
}
