"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Doctor, QueueItem } from '@/types';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import {
  Clock,
  Calendar,
  AlertTriangle,
  Monitor,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  RefreshCw,
  Sparkles,
  Stethoscope,
  HeartPulse,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export default function HomePage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLiveStatus = async () => {
    try {
      const [docRes, queueRes] = await Promise.all([
        fetch('/api/doctors'),
        fetch('/api/queue'),
      ]);
      const docData = await docRes.json();
      const queueData = await queueRes.json();

      if (docData.success) setDoctors(docData.data);
      if (queueData.success) setQueue(queueData.data);
      setLastUpdated(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 2000); // 2-second real-time sync
    return () => clearInterval(interval);
  }, []);

  const onDutyDoctors = doctors.filter((d) => d.isOnDuty);
  const offDutyDoctors = doctors.filter((d) => !d.isOnDuty);

  const faqs = [
    {
      q: 'Bagaimana cara melakukan pendaftaran antrean online?',
      a: 'Pasien mendaftar atau masuk dengan email dan kata sandi (disertai verifikasi email). Pilih dokter gigi spesialis, pilih tanggal periksa serta sesi jam yang diinginkan, kemudian Anda akan menerima Kode Booking.',
    },
    {
      q: 'Kapan batas waktu check-in di klinik?',
      a: 'Pintu check-in dibuka 60 menit sebelum sesi dimulai. Pasien diharapkan tiba dan melakukan konfirmasi kedatangan di klinik atau scan QR sebelum sesi dimulai. Nomor antrean fisik (seperti A-001) baru akan diterbitkan saat check-in.',
    },
    {
      q: 'Bagaimana jika saya berhalangan hadir dan ingin membatalkan atau menjadwal ulang?',
      a: 'Pembatalan online dapat dilakukan selambat-lambatnya 2 jam sebelum jam sesi periksa. Anda juga dapat memilih opsi Reschedule (Jadwal Ulang) tanpa kehilangan giliran antrean.',
    },
    {
      q: 'Apakah pasien tanpa janji temu (Walk-in) tetap bisa dilayani?',
      a: 'Bisa. Front desk akan membantu pencarian data atau pendaftaran langsung di klinik. Pasien walk-in akan langsung diterbitkan nomor antrean dan masuk ke antrean dokter yang sedang bertugas.',
    },
  ];

  return (
    <div className="flex-1 pb-20 font-body bg-[#FAFBFC]">
      {/* Reassuring Care Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-amber-500/10 border-b border-amber-200/60 text-amber-950 px-4 py-2.5 text-xs text-center font-medium flex items-center justify-center gap-2">
        <AlertTriangle size={15} className="text-amber-600 shrink-0" />
        <span>
          <strong>Perhatian Medis:</strong> Jika mengalami perdarahan hebat pasca-tindakan, pembengkakan rahang luas mendadak, atau trauma darurat, segera hubungi <strong>119</strong> atau IGD RS terdekat.
        </span>
      </div>

      {/* Hero Section with Cozy Aesthetic */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F0FDFA] via-[#FAFBFC] to-white border-b border-slate-200/70 pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        {/* Soft Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 left-10 w-72 h-72 bg-emerald-100/30 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/70 text-teal-800 text-xs font-semibold tracking-wide mb-4 shadow-sm">
              <Sparkles size={14} className="text-teal-600" />
              <span>SISTEM ANTREAN RESMI POLIKLINIK</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-extrabold text-[#0F172A] tracking-tight leading-[1.15]">
              Perawatan Gigi Nyaman, <br />
              <span className="text-[#0D9488]">Ramah & Terpercaya</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-[#475569] leading-relaxed">
              Pantau antrean secara langsung dari rumah atau gadget Anda. Daftarkan diri Anda dan keluarga secara online tanpa perlu cemas menunggu lama di ruang tunggu klinik.
            </p>

            {/* Quick Feature Badges */}
            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                <CheckCircle2 size={15} className="text-emerald-500" /> Transparan & Real-time
              </span>
              <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                <ShieldCheck size={15} className="text-teal-600" /> Dokter Spesialis Berizin Resmi
              </span>
              <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                <UserCheck size={15} className="text-sky-600" /> Ruang Periksa Higienis
              </span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3.5">
              <Link href="/login">
                <Button variant="sage" size="lg" className="gap-2.5 rounded-2xl shadow-cozy hover:shadow-floating">
                  <Calendar size={18} />
                  Daftar / Masuk Akun Pasien
                </Button>
              </Link>
              <Link href="/tv" target="_blank">
                <Button variant="secondary" size="lg" className="gap-2 rounded-2xl">
                  <Monitor size={18} className="text-teal-600" />
                  Buka Layar TV Ruang Tunggu
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Clinic Info Box with Cozy Rounded Corners */}
          <div className="w-full lg:w-96 bg-white/95 backdrop-blur-md border border-teal-100 rounded-3xl p-6 shadow-cozy space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <HeartPulse size={18} />
                </div>
                <span className="font-headline font-bold text-[#0F172A] text-sm">Informasi Pelayanan</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Buka Hari Ini
              </span>
            </div>

            <div className="flex items-start gap-3 text-[#475569] text-xs">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                <Clock size={15} />
              </div>
              <div>
                <p className="font-semibold text-[#0F172A]">Jam Operasional Poliklinik</p>
                <p className="text-slate-600 mt-0.5">Senin - Sabtu: 08:00 - 17:00 WIB</p>
                <p className="text-slate-400">Minggu & Libur Nasional: Tutup</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-[#475569] text-xs">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={15} />
              </div>
              <div>
                <p className="font-semibold text-[#0F172A]">Lokasi Poli Gigi</p>
                <p className="text-slate-600 mt-0.5">Jl. Kesehatan Raya No. 128, Lantai 1</p>
                <p className="text-slate-400">Ruang Poli Gigi 1 & 2</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-[#475569] text-xs">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                <Phone size={15} />
              </div>
              <div>
                <p className="font-semibold text-[#0F172A]">Kontak Resepsionis</p>
                <p className="text-slate-600 mt-0.5">(021) 555-0192</p>
                <p className="text-teal-700 font-medium">WhatsApp: 0812-3456-7890</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Queue Boards Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span> Live Monitoring
            </div>
            <h2 className="text-2xl sm:text-3xl font-headline font-extrabold text-[#0F172A]">
              Nomor Antrean Sedang Berjalan
            </h2>
            <p className="text-sm text-[#64748B] mt-1">
              Data terhubung langsung dengan layar ruang tunggu klinik (Privasi aman: tanpa menampilkan nama pasien)
            </p>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-slate-600 bg-white px-4 py-2 rounded-2xl border border-slate-200/80 shadow-sm self-start sm:self-auto">
            <RefreshCw size={14} className="text-teal-600 animate-spin" style={{ animationDuration: '3s' }} />
            <span>Pembaruan otomatis: <strong>{lastUpdated || 'Sinkronisasi...'}</strong></span>
          </div>
        </div>

        {/* On-Duty Doctor Queue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {onDutyDoctors.length === 0 ? (
            <div className="col-span-2 text-center p-12 bg-white border border-slate-200/80 rounded-3xl text-slate-500 shadow-sm">
              <Stethoscope size={36} className="mx-auto text-slate-400 mb-3" />
              <p className="font-semibold text-base text-slate-700">Tidak ada dokter yang sedang bertugas saat ini.</p>
              <p className="text-xs text-slate-500 mt-1">Poliklinik beroperasi mulai pukul 08:00 WIB.</p>
            </div>
          ) : (
            onDutyDoctors.map((doc) => {
              const docQueue = queue.filter((q) => q.doctorId === doc.id);
              const currentCalled = docQueue.find((q) => q.status === 'called' || q.status === 'in_consultation');
              const waitingList = docQueue.filter((q) => q.status === 'waiting' || q.status === 'checked_in');

              return (
                <Card
                  key={doc.id}
                  variant="elevated"
                  className="rounded-3xl border border-teal-100/80 shadow-cozy hover:shadow-floating transition-all duration-300 relative overflow-hidden"
                >
                  {/* Doctor Header */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-5">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-100 text-teal-800 flex items-center justify-center font-headline font-bold text-lg border border-teal-200/60 shrink-0">
                        {doc.code}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full">
                            RUANG {doc.code}
                          </span>
                          <span className="text-xs text-slate-500">{doc.room}</span>
                        </div>
                        <h3 className="font-headline font-bold text-lg text-[#0F172A] mt-1">
                          {doc.name}
                        </h3>
                        <p className="text-xs text-[#0D9488] font-medium mt-0.5">{doc.specialty}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Shift Praktik: {doc.shiftHours}</p>
                      </div>
                    </div>
                    <Chip variant="success" className="shrink-0">
                      PIKET AKTIF
                    </Chip>
                  </div>

                  {/* Calling & Next Display with Softer, Welcoming Colors */}
                  <div className="my-6 grid grid-cols-2 gap-4 text-center">
                    {/* Active Calling Box */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950 text-white p-5 rounded-2xl shadow-md border border-teal-700/30 flex flex-col justify-center">
                      <div className="absolute -right-6 -top-6 w-20 h-20 bg-teal-500/15 rounded-full blur-xl pointer-events-none"></div>
                      
                      <span className="text-[11px] font-mono tracking-wider uppercase text-teal-200/90 font-medium">
                        SEDANG DIPANGGIL
                      </span>
                      <span className="text-4xl sm:text-5xl font-mono font-extrabold text-white tracking-widest my-1.5 drop-shadow-sm">
                        {currentCalled ? currentCalled.queueNumber : '---'}
                      </span>
                      <span className="inline-flex items-center justify-center gap-1.5 text-[11px] text-emerald-300 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        {currentCalled?.status === 'in_consultation'
                          ? 'Sedang Konsultasi'
                          : currentCalled
                          ? 'Harap Masuk Ruangan'
                          : 'Menunggu Panggilan'}
                      </span>
                    </div>

                    {/* Next In Line Box */}
                    <div className="bg-gradient-to-br from-teal-50/40 via-white to-slate-50 border border-teal-100/70 p-5 rounded-2xl flex flex-col justify-center shadow-sm">
                      <span className="text-[11px] font-mono tracking-wider uppercase text-slate-500 font-medium">
                        NOMOR BERIKUTNYA
                      </span>
                      <span className="text-3xl sm:text-4xl font-mono font-extrabold text-[#0F172A] tracking-wider my-1.5">
                        {waitingList.length > 0 ? waitingList[0].queueNumber : '---'}
                      </span>
                      <span className="text-xs text-slate-500">
                        <strong className="text-teal-700">{waitingList.length}</strong> pasien menunggu
                      </span>
                    </div>
                  </div>

                  {/* Next up queue preview pills */}
                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Urutan antrean selanjutnya:</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {waitingList.slice(0, 4).map((item, idx) => (
                        <span
                          key={item.id}
                          className={`font-mono px-2.5 py-1 rounded-full text-xs transition-all ${
                            idx === 0
                              ? 'bg-teal-100 text-teal-800 font-bold border border-teal-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.queueNumber}
                        </span>
                      ))}
                      {waitingList.length > 4 && (
                        <span className="text-xs text-slate-400 font-medium self-center pl-1">
                          +{waitingList.length - 4} lagi
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </section>

      {/* Dentist Master Schedule Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span> Tim Medis Kami
          </div>
          <h2 className="text-2xl sm:text-3xl font-headline font-extrabold text-[#0F172A]">
            Jadwal Praktik 5 Dokter Gigi Poliklinik
          </h2>
          <p className="text-sm text-[#64748B] mt-1">
            Sesuai ketentuan standar pelayanan klinik, maksimal 2 dokter gigi berpiket secara simultan per hari kerja.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm font-body">
              <thead className="bg-[#0F172A] text-white font-headline text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-5">Kode</th>
                  <th className="py-4 px-5">Nama Dokter Gigi</th>
                  <th className="py-4 px-5">Bidang Spesialisasi</th>
                  <th className="py-4 px-5">Hari Praktik</th>
                  <th className="py-4 px-5">Jam Sesi</th>
                  <th className="py-4 px-5 text-center">Status Hari Ini</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-teal-50/30 transition-colors">
                    <td className="py-4 px-5 font-mono font-bold text-teal-800">
                      <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 inline-flex items-center justify-center border border-teal-200/60">
                        {doc.code}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-semibold text-[#0F172A]">{doc.name}</td>
                    <td className="py-4 px-5 text-[#475569]">{doc.specialty}</td>
                    <td className="py-4 px-5 text-[#475569]">{doc.scheduleDays.join(', ')}</td>
                    <td className="py-4 px-5 font-mono text-slate-700">{doc.shiftHours}</td>
                    <td className="py-4 px-5 text-center">
                      {doc.isOnDuty ? (
                        <Chip variant="success">PIKET AKTIF</Chip>
                      ) : (
                        <Chip variant="neutral">LIBUR / OFF</Chip>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section with Soft Curves */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span> Bantuan Pasien
          </div>
          <h2 className="text-2xl sm:text-3xl font-headline font-extrabold text-[#0F172A]">
            Pertanyaan yang Sering Diajukan (FAQ)
          </h2>
          <p className="text-sm text-[#64748B] mt-1">
            Panduan lengkap alur pendaftaran, check-in, dan pembatalan layanan poliklinik
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm transition-all duration-200 hover:border-teal-200"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left px-6 py-4.5 flex items-center justify-between font-headline font-semibold text-sm text-[#0F172A] hover:bg-slate-50/60 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp size={18} className="text-[#0D9488] shrink-0 ml-3" />
                  ) : (
                    <ChevronDown size={18} className="text-slate-400 shrink-0 ml-3" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-xs sm:text-sm text-[#475569] leading-relaxed border-t border-slate-100 pt-3.5 bg-slate-50/30">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
