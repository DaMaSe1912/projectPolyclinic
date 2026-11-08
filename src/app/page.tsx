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
    <div className="flex-1 pb-16 font-body">
      {/* Emergency Notice Banner */}
      <div className="bg-amber-500/10 border-b border-amber-300 text-amber-950 px-4 py-2.5 text-xs text-center font-medium flex items-center justify-center gap-2">
        <AlertTriangle size={15} className="text-amber-600 shrink-0" />
        <span>
          <strong>Perhatian Medis:</strong> Jika Anda mengalami perdarahan hebat pasca-tindakan gigi, pembengkakan rahang luas mendadak, atau trauma parah yang mengancam jiwa, segera hubungi <strong>119</strong> atau kunjungi IGD Rumah Sakit terdekat.
        </span>
      </div>

      {/* Hero Section */}
      <section className="bg-white border-b border-[#E2E8F0] pt-12 pb-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <Chip variant="success" className="mb-3">
              ✦ SISTEM ANTREAN RESMI POLIKLINIK
            </Chip>
            <h1 className="text-3xl sm:text-4xl font-headline font-bold text-[#0F172A] tracking-tight leading-tight">
              Poliklinik Gigi & Mulut <br />
              <span className="text-[#059669]">Klinik Pratama Sehat Utama</span>
            </h1>
            <p className="mt-4 text-base text-[#475569] leading-relaxed">
              Pantau antrean secara langsung, daftarkan diri Anda dan keluarga secara online, atau periksa jadwal dokter spesialis gigi hari ini dengan cepat, transparan, dan terpercaya.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login">
                <Button variant="primary" size="lg" className="gap-2">
                  <Calendar size={18} />
                  Daftar / Masuk Akun Pasien
                </Button>
              </Link>
              <Link href="/tv" target="_blank">
                <Button variant="secondary" size="lg" className="gap-2">
                  <Monitor size={18} />
                  Buka Layar TV Ruang Tunggu
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Clinic Info Box */}
          <div className="w-full md:w-80 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-5 space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <span className="font-headline font-bold text-[#0F172A] text-sm">Informasi Klinik</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Buka Hari Ini
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-[#475569]">
              <Clock size={16} className="text-[#059669] shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-[#0F172A]">Jam Operasional Poliklinik</p>
                <p>Senin - Sabtu: 08:00 - 17:00 WIB</p>
                <p className="text-[#94A3B8]">Minggu & Hari Libur Nasional: Tutup</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-[#475569]">
              <MapPin size={16} className="text-[#059669] shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-[#0F172A]">Lokasi Pelayanan</p>
                <p>Jl. Kesehatan Raya No. 128, Lantai 1, Ruang Poli Gigi 1 & 2</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-[#475569]">
              <Phone size={16} className="text-[#059669] shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-[#0F172A]">Kontak Resepsionis</p>
                <p>(021) 555-0192 / WhatsApp: 0812-3456-7890</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Queue Boards Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-headline font-bold text-[#0F172A]">
              Nomor Antrean Sedang Berjalan
            </h2>
            <p className="text-sm text-[#64748B] mt-1">
              Data terhubung langsung dengan layar ruang tunggu klinik (Privasi aman: tanpa nama pasien)
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#64748B] bg-white px-3 py-1.5 rounded-md border border-[#E2E8F0]">
            <RefreshCw size={13} className="text-[#059669] animate-spin" style={{ animationDuration: '3s' }} />
            <span>Terakhir diperbarui: <strong>{lastUpdated || 'Memuat...'}</strong></span>
          </div>
        </div>

        {/* On-Duty Doctor Queue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {onDutyDoctors.length === 0 ? (
            <div className="col-span-2 text-center p-8 bg-white border border-[#E2E8F0] rounded-lg text-slate-500">
              Tidak ada dokter yang sedang bertugas saat ini. Poliklinik buka pukul 08:00 WIB.
            </div>
          ) : (
            onDutyDoctors.map((doc) => {
              const docQueue = queue.filter((q) => q.doctorId === doc.id);
              const currentCalled = docQueue.find((q) => q.status === 'called' || q.status === 'in_consultation');
              const waitingList = docQueue.filter((q) => q.status === 'waiting' || q.status === 'checked_in');

              return (
                <Card key={doc.id} variant="elevated" className="overflow-hidden border-t-4 border-[#0F172A]">
                  <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-4">
                    <div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#0F172A] text-white rounded">
                        KODE {doc.code}
                      </span>
                      <h3 className="font-headline font-bold text-lg text-[#0F172A] mt-1.5">
                        {doc.name}
                      </h3>
                      <p className="text-xs text-[#059669] font-medium">{doc.specialty}</p>
                      <p className="text-xs text-[#64748B] mt-0.5">{doc.room} • Shift: {doc.shiftHours}</p>
                    </div>
                    <Chip variant="success">PIKET HARI INI</Chip>
                  </div>

                  {/* Calling & Next Display */}
                  <div className="my-5 grid grid-cols-2 gap-4 text-center">
                    <div className="bg-[#0F172A] text-white p-4 rounded-lg flex flex-col justify-center">
                      <span className="text-[11px] font-mono tracking-wider uppercase text-slate-300">
                        SEDANG DIPANGGIL
                      </span>
                      <span className="text-4xl font-mono font-bold text-white tracking-widest my-1">
                        {currentCalled ? currentCalled.queueNumber : '---'}
                      </span>
                      <span className="text-[10px] text-emerald-400">
                        {currentCalled?.status === 'in_consultation' ? 'Sedang Konsultasi' : currentCalled ? 'Harap Masuk Ruangan' : 'Menunggu Panggilan'}
                      </span>
                    </div>

                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-lg flex flex-col justify-center">
                      <span className="text-[11px] font-mono tracking-wider uppercase text-[#64748B]">
                        NOMOR BERIKUTNYA
                      </span>
                      <span className="text-3xl font-mono font-bold text-[#0F172A] tracking-wider my-1">
                        {waitingList.length > 0 ? waitingList[0].queueNumber : '---'}
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        {waitingList.length} pasien menunggu
                      </span>
                    </div>
                  </div>

                  {/* Next up pills preview */}
                  <div className="border-t border-[#F1F5F9] pt-3 flex items-center justify-between text-xs">
                    <span className="text-[#64748B]">Urutan selanjutnya:</span>
                    <div className="flex gap-1.5">
                      {waitingList.slice(0, 4).map((item, idx) => (
                        <span
                          key={item.id}
                          className={`font-mono px-2 py-0.5 rounded text-[11px] ${
                            idx === 0
                              ? 'bg-[#05966915] text-[#059669] font-bold border border-[#05966930]'
                              : 'bg-[#F1F5F9] text-[#475569]'
                          }`}
                        >
                          {item.queueNumber}
                        </span>
                      ))}
                      {waitingList.length > 4 && (
                        <span className="text-[11px] text-[#94A3B8] self-center">
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <h2 className="text-2xl font-headline font-bold text-[#0F172A] mb-2">
          Jadwal Praktik 5 Dokter Gigi Poliklinik
        </h2>
        <p className="text-sm text-[#64748B] mb-6">
          Sesuai ketentuan klinik, maksimal 2 dokter gigi berpiket secara simultan per hari kerja.
        </p>

        <div className="bg-white border border-[#E2E8F0] rounded-[8px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-body">
              <thead className="bg-[#0F172A] text-white font-headline text-[13px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Nama Dokter Gigi</th>
                  <th className="py-3 px-4">Bidang Spesialisasi</th>
                  <th className="py-3 px-4">Hari Praktik</th>
                  <th className="py-3 px-4">Jam Sesi</th>
                  <th className="py-3 px-4 text-center">Status Hari Ini</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {doctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0F172A]">{doc.code}</td>
                    <td className="py-3.5 px-4 font-semibold text-[#0F172A]">{doc.name}</td>
                    <td className="py-3.5 px-4 text-[#475569]">{doc.specialty}</td>
                    <td className="py-3.5 px-4 text-[#475569]">{doc.scheduleDays.join(', ')}</td>
                    <td className="py-3.5 px-4 font-mono text-[#0F172A]">{doc.shiftHours}</td>
                    <td className="py-3.5 px-4 text-center">
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

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <h2 className="text-2xl font-headline font-bold text-[#0F172A] text-center mb-2">
          Pertanyaan yang Sering Diajukan (FAQ)
        </h2>
        <p className="text-sm text-[#64748B] text-center mb-8">
          Panduan alur antrean, check-in, dan pembatalan layanan
        </p>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-[#E2E8F0] rounded-[8px] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between font-headline font-semibold text-sm text-[#0F172A] hover:bg-[#F8FAFC]"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} className="text-[#059669]" /> : <ChevronDown size={18} className="text-[#64748B]" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs text-[#475569] leading-relaxed border-t border-[#F1F5F9] pt-3">
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
