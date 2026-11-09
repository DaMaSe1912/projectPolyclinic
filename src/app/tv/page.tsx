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
    let prevCalledMap = new Map<string, string>();

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

  const onDutyDoctors = doctors.filter((d) => d.isOnDuty);

  return (
    <div className="min-h-screen w-full bg-[#0F172A] text-white flex flex-col justify-between font-body select-none overflow-hidden">
      {/* Offline / Reconnecting Banner per PRD */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-center py-2 px-4 font-headline font-bold text-sm flex items-center justify-center gap-2">
          <WifiOff size={18} />
          <span>Sedang menyambungkan ulang ke server antrean klinik (Reconnecting... Menampilkan data tersimpan)</span>
        </div>
      )}

      {/* TV Header Bar */}
      <header className="px-8 py-5 bg-[#020617] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-headline font-bold text-2xl text-[#059669] shadow-lg">
            ✦V
          </div>
          <div>
            <h1 className="font-headline font-bold text-2xl tracking-wide text-white uppercase">
              Klinik Pratama Sehat Utama
            </h1>
            <p className="text-sm font-medium text-[#059669] tracking-wider">
              Poliklinik Gigi & Mulut • Layar Informasi Antrean Ruang Tunggu
            </p>
          </div>
        </div>

        {/* Clock & Controls */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="font-mono text-3xl font-bold tracking-wider text-emerald-400">
              {currentTime}
            </div>
            <div className="text-xs text-slate-400 capitalize">{currentDate}</div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className="p-2 rounded hover:bg-slate-800 text-slate-300"
              title="Suara Panggilan"
            >
              {isAudioEnabled ? <Volume2 size={20} className="text-emerald-400" /> : <VolumeX size={20} />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded hover:bg-slate-800 text-slate-300"
              title="Mode Layar Penuh (F11)"
            >
              <Maximize2 size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Calling Stage for On-Duty Dentists */}
      <main className="flex-1 p-6 md:p-8 flex flex-col justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto w-full">
          {onDutyDoctors.length === 0 ? (
            <div className="col-span-2 text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
              <p className="text-2xl font-headline font-bold text-slate-300">
                Layanan Poliklinik Gigi Sedang Tutup
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Jam operasional buka kembali pukul 08:00 WIB. Pendaftaran online tetap dapat diakses.
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
                  className={`bg-slate-900/90 rounded-2xl border transition-all duration-500 p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden ${
                    isFlashing
                      ? 'border-emerald-400 ring-4 ring-emerald-500/40 animate-call-pulse'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Doctor Info Header */}
                  <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                    <div>
                      <div className="inline-block px-3 py-1 rounded bg-[#059669] text-white font-mono font-bold text-xs uppercase tracking-wider mb-2">
                        {doc.room} • KODE {doc.code}
                      </div>
                      <h2 className="font-headline font-bold text-2xl text-white">
                        {doc.name}
                      </h2>
                      <p className="text-sm text-[#059669] font-medium mt-0.5">{doc.specialty}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Status Dokter</span>
                      <span className="inline-flex items-center text-xs font-bold text-emerald-400">
                        MELAYANI
                      </span>
                    </div>
                  </div>

                  {/* GIANT CALLING NUMBER DISPLAY (Hospital-grade readable from across room) */}
                  <div className="py-8 my-auto text-center">
                    <span className="text-sm uppercase font-mono font-bold tracking-widest text-slate-400 block mb-2">
                      NOMOR YANG SEDANG DIPANGGIL
                    </span>

                    <div className="relative inline-block">
                      <div
                        className={`text-8xl sm:text-9xl font-mono font-bold tracking-wider transition-colors ${
                          currentCalling ? 'text-emerald-400' : 'text-slate-700'
                        }`}
                      >
                        {currentCalling ? currentCalling.queueNumber : '---'}
                      </div>
                      {isFlashing && (
                        <div className="absolute -top-3 -right-6 px-3 py-1 bg-emerald-500 text-slate-950 font-headline font-bold text-xs rounded-full uppercase tracking-wider animate-bounce">
                          Dipanggil!
                        </div>
                      )}
                    </div>

                    <p className="text-base text-slate-300 font-medium mt-3">
                      {currentCalling?.status === 'in_consultation'
                        ? 'Pasien Sedang Di Dalam Ruangan'
                        : currentCalling
                        ? 'Silakan Langsung Memasuki Ruangan Dokter'
                        : 'Menunggu Pasien Selanjutnya'}
                    </p>
                  </div>

                  {/* Next Up Footer */}
                  <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-850 flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase text-slate-400 block font-mono">
                        NOMOR BERIKUTNYA
                      </span>
                      <span className="text-2xl font-mono font-bold text-white">
                        {waitingList.length > 0 ? waitingList[0].queueNumber : '---'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Sisa Antrean</span>
                      <span className="text-sm font-bold text-slate-300">
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
      <footer className="bg-[#020617] border-t border-slate-800 py-3 px-6 flex items-center gap-4 text-xs">
        <div className="shrink-0 flex items-center gap-1.5 font-headline font-bold text-emerald-400 uppercase tracking-wider bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
          <Sparkles size={14} /> PENGUMUMAN
        </div>

        <div className="flex-1 overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-marquee text-slate-300">
            Selamat datang di Poliklinik Gigi & Mulut Klinik Pratama Sehat Utama • Harap persiapkan kartu identitas/tiket saat nomor antrean Anda dipanggil • Pasien lansia dan kondisi darurat mendapatkan prioritas pelayanan • Unduh antrean online melalui website resmi polyclinic kami.
          </div>
        </div>

        <div className="shrink-0 text-slate-500 text-[11px] font-mono">
          V1.0 • Standar RS 1080p
        </div>
      </footer>
    </div>
  );
}
