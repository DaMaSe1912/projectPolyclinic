"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { QueueItem, Doctor, Referral } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ReferralLetterModal } from '@/components/ReferralLetterModal';
import {
  Volume2,
  PhoneCall,
  RotateCcw,
  SkipForward,
  CheckCircle,
  Undo2,
  FileText,
  User,
  AlertTriangle,
  Stethoscope,
  Calendar,
  Clock,
  Plus,
} from 'lucide-react';

export default function ClinicalPage() {
  const router = useRouter();
  const { user, role, isLoading: authLoading, isDoctor, isNurse } = useAuth();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Referral Modal
  const [isCreateReferralOpen, setIsCreateReferralOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);

  // New Referral State
  const [refPatientName, setRefPatientName] = useState('');
  const [refPatientNik, setRefPatientNik] = useState('');
  const [refPatientDob, setRefPatientDob] = useState('1985-05-10');
  const [refPatientPhone, setRefPatientPhone] = useState('081234567890');
  const [refAllergies, setRefAllergies] = useState('Tidak ada riwayat alergi.');
  const [refClinicalNotes, setRefClinicalNotes] = useState('Impaksi gigi molar 3 bawah kanan dengan perikoronitis akut.');
  const [refReason, setRefReason] = useState('Odontektomi kompleks anestesi umum di Instalasi Bedah Mulut RSUD.');
  const [refDestination, setRefDestination] = useState('RSUD Tarakan Jakarta Pusat');
  const [refLoading, setRefLoading] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/staff');
      } else if (role !== 'doctor' && role !== 'nurse' && role !== 'admin') {
        router.push('/access-denied');
      }
    }
  }, [user, role, authLoading, router]);

  const loadClinicalData = async () => {
    try {
      const [docRes, queueRes, refRes] = await Promise.all([
        fetch('/api/doctors'),
        fetch('/api/queue'),
        fetch('/api/referrals'),
      ]);
      const docData = await docRes.json();
      const qData = await queueRes.json();
      const refData = await refRes.json();

      if (docData.success) {
        setDoctors(docData.data);
        if (!selectedDoctorId) {
          if (user?.doctorId) {
            setSelectedDoctorId(user.doctorId);
          } else {
            const onDuty = docData.data.find((d: Doctor) => d.isOnDuty) || docData.data[0];
            if (onDuty) setSelectedDoctorId(onDuty.id);
          }
        }
      }
      if (qData.success) setQueue(qData.data);
      if (refData.success) setReferrals(refData.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadClinicalData();
    const interval = setInterval(loadClinicalData, 2000); // 2 second sync
    return () => clearInterval(interval);
  }, [selectedDoctorId]);

  const currentDoctor = doctors.find((d) => d.id === selectedDoctorId);

  // Play audio chime when calling
  const playCallChime = (queueNum: string) => {
    if (!isAudioEnabled) return;
    try {
      // Synthesize clean audio speech announcement in Indonesian
      if ('speechSynthesis' in window) {
        const text = `Nomor antrean, ${queueNum.replace('-', ' ')}, silakan menuju ${currentDoctor?.room || 'ruang pemeriksaan'}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleQueueAction = async (item: QueueItem, action: string) => {
    try {
      const res = await fetch('/api/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          action,
          actorName: user?.name,
          actorRole: user?.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
      else {
        if (action === 'call' || action === 'recall') {
          playCallChime(item.queueNumber);
        }
        loadClinicalData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleDoctorAvailability = async () => {
    if (!currentDoctor) return;
    const willBeAvailable = !currentDoctor.isAvailable;

    if (!willBeAvailable) {
      const activeCount = queue.filter(
        (q) =>
          q.doctorId === currentDoctor.id &&
          ['booked', 'checked_in', 'waiting'].includes(q.status)
      ).length;

      if (
        !confirm(
          `Peringatan: Terdapat ${activeCount} pasien pada jadwal ${currentDoctor.name}. Jika dokter dinyatakan Tidak Tersedia, status antrean mereka akan otomatis disesuaikan dan pasien diberikan prioritas rebooking. Lanjutkan?`
        )
      ) {
        return;
      }
    }

    try {
      await fetch('/api/doctors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: currentDoctor.id,
          isAvailable: willBeAvailable,
          actorName: user?.name,
          actorRole: user?.role,
        }),
      });
      loadClinicalData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setRefLoading(true);
    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: refPatientName,
          patientNik: refPatientNik,
          patientDob: refPatientDob,
          patientPhone: refPatientPhone,
          allergies: refAllergies,
          relevantMedicalRecord: refClinicalNotes,
          reason: refReason,
          destinationHospital: refDestination,
          initiatedBy: role === 'nurse' ? 'nurse' : 'doctor',
          nurseName: role === 'nurse' ? user?.name : undefined,
          actorName: user?.name,
          actorRole: user?.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsCreateReferralOpen(false);
      loadClinicalData();
      setSelectedReferral(data.referral);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRefLoading(false);
    }
  };

  if (authLoading || !user) {
    return <div className="p-8 text-center text-[#64748B]">Memuat panel klinis...</div>;
  }

  // Filter queues for the selected doctor
  const docQueue = queue.filter((q) => q.doctorId === selectedDoctorId);
  const currentActiveVisit = docQueue.find(
    (q) => q.status === 'in_consultation' || q.status === 'called'
  );
  const waitingPatients = docQueue.filter(
    (q) => q.status === 'waiting' || q.status === 'checked_in'
  );
  const skippedPatients = docQueue.filter((q) => q.status === 'skipped');
  const completedPatients = docQueue.filter((q) => q.status === 'done');

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 font-body">
      {/* Clinical Station Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#059669] uppercase tracking-wider flex items-center gap-1">
              <Stethoscope size={14} /> Tablet / PC Ruang Praktik
            </span>
            <Chip variant={currentDoctor?.isAvailable ? 'success' : 'error'} className="text-[10px]">
              {currentDoctor?.isAvailable ? 'DOKTER AKTIF' : 'DOKTER TIDAK TERSEDIA'}
            </Chip>
          </div>
          <h1 className="text-2xl font-headline font-bold text-[#0F172A] mt-1">
            {currentDoctor?.name || 'Dokter Gigi'}
          </h1>
          <p className="text-xs text-[#64748B]">
            {currentDoctor?.room} • Shift: {currentDoctor?.shiftHours} • {currentDoctor?.specialty}
          </p>
        </div>

        {/* Doctor Switcher & Sound Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="h-[44px] px-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#0F172A]"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code}) {d.isOnDuty ? '• Sedang Bertugas' : ''}
              </option>
            ))}
          </select>

          <Button
            variant={isAudioEnabled ? 'sage' : 'secondary'}
            size="md"
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className="gap-1.5 min-h-[44px]"
            title="Suara Panggilan Otomatis"
          >
            <Volume2 size={16} />
            {isAudioEnabled ? 'Suara Aktif' : 'Mute'}
          </Button>

          <Button
            variant={currentDoctor?.isAvailable ? 'destructive' : 'primary'}
            size="md"
            onClick={handleToggleDoctorAvailability}
            className="min-h-[44px] text-xs font-semibold"
          >
            {currentDoctor?.isAvailable ? 'Tandai Berhalangan' : 'Tandai Tersedia'}
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              if (currentActiveVisit) {
                setRefPatientName(currentActiveVisit.patientName);
                setRefPatientNik(currentActiveVisit.patientNik || '');
                setRefPatientPhone(currentActiveVisit.patientPhone);
              }
              setIsCreateReferralOpen(true);
            }}
            className="gap-1.5 min-h-[44px]"
          >
            <Plus size={16} />
            Buat Rujukan RS
          </Button>
        </div>
      </div>

      {/* Main Calling Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* CURRENT CALLED / ACTIVE PATIENT (Col 1 & 2) */}
        <div className="lg:col-span-2">
          <Card variant="elevated" className="h-full flex flex-col justify-between border-t-4 border-[#0F172A]">
            <div>
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
                <span className="text-xs uppercase font-mono font-bold tracking-wider text-[#64748B]">
                  PASIEN YANG SEDANG DIPANGGIL / DILAYANI
                </span>
                {currentActiveVisit ? (
                  <Chip
                    variant={currentActiveVisit.status === 'in_consultation' ? 'info' : 'success'}
                  >
                    {currentActiveVisit.status === 'in_consultation'
                      ? 'KONSULTASI BERLANGSUNG'
                      : `PANGGILAN KE-${currentActiveVisit.callCount} / 3`}
                  </Chip>
                ) : (
                  <Chip variant="neutral">RUANGAN KOSONG</Chip>
                )}
              </div>

              {currentActiveVisit ? (
                <div className="text-center py-4">
                  <div className="text-7xl font-mono font-bold text-[#0F172A] tracking-wider my-2">
                    {currentActiveVisit.queueNumber}
                  </div>
                  <h3 className="text-xl font-headline font-bold text-[#0F172A]">
                    {currentActiveVisit.patientName}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-1">
                    No. Telp: <span className="font-mono">{currentActiveVisit.patientPhone}</span> • Usia/Lahir: {currentActiveVisit.patientDob}
                  </p>

                  {currentActiveVisit.isPriority && (
                    <div className="mt-3 inline-block bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold">
                      Prioritas: {currentActiveVisit.priorityReason || 'Khusus'}
                    </div>
                  )}

                  {currentActiveVisit.triageComplaint && (
                    <div className="mt-3 bg-red-50 text-red-900 border border-red-200 p-2.5 rounded-lg text-xs max-w-md mx-auto">
                      <strong>Keluhan Triase:</strong> {currentActiveVisit.triageComplaint}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-[#64748B]">
                  <p className="text-base font-medium">Belum ada pasien yang dipanggil.</p>
                  <p className="text-xs mt-1">
                    Tekan tombol &quot;Panggil Pasien Berikutnya&quot; di bawah untuk memanggil nomor antrean selanjutnya.
                  </p>
                </div>
              )}
            </div>

            {/* BIG TOUCH TARGET ACTION BUTTONS (>= 44px) */}
            <div className="pt-6 border-t border-[#E2E8F0] space-y-3">
              {currentActiveVisit ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Recall (Panggil Ulang) */}
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => handleQueueAction(currentActiveVisit, 'recall')}
                    className="gap-2 min-h-[50px] font-bold"
                  >
                    <RotateCcw size={18} />
                    Panggil Ulang ({currentActiveVisit.callCount}/3)
                  </Button>

                  {/* Mulai Konsultasi */}
                  {currentActiveVisit.status !== 'in_consultation' ? (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => handleQueueAction(currentActiveVisit, 'start_consultation')}
                      className="gap-2 min-h-[50px] font-bold bg-[#0F172A]"
                    >
                      <Stethoscope size={18} />
                      Mulai Masuk Ruangan
                    </Button>
                  ) : (
                    <Button
                      variant="sage"
                      size="lg"
                      onClick={() => handleQueueAction(currentActiveVisit, 'finish')}
                      className="gap-2 min-h-[50px] font-bold"
                    >
                      <CheckCircle size={18} />
                      Selesai Konsultasi
                    </Button>
                  )}

                  {/* Skip */}
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => handleQueueAction(currentActiveVisit, 'skip')}
                    className="text-amber-700 hover:bg-amber-50 gap-2 min-h-[50px]"
                  >
                    <SkipForward size={18} />
                    Lewati (Skip)
                  </Button>

                  {/* Undo Call */}
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => handleQueueAction(currentActiveVisit, 'undo_call')}
                    className="text-slate-600 hover:bg-slate-100 gap-2 min-h-[50px]"
                  >
                    <Undo2 size={18} />
                    Batal Panggil
                  </Button>
                </div>
              ) : (
                <div className="flex justify-center">
                  <Button
                    variant="sage"
                    size="lg"
                    onClick={() => {
                      if (waitingPatients.length > 0) {
                        handleQueueAction(waitingPatients[0], 'call');
                      } else {
                        alert('Tidak ada pasien yang sedang menunggu di ruang tunggu.');
                      }
                    }}
                    className="w-full sm:w-80 min-h-[52px] text-base gap-2 font-headline font-bold shadow-md"
                  >
                    <PhoneCall size={20} />
                    Panggil Pasien Berikutnya ({waitingPatients.length})
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* WAITING QUEUE LIST (Col 3) */}
        <div>
          <Card variant="default" className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2 mb-3">
                <span className="font-headline font-bold text-sm text-[#0F172A]">
                  Daftar Antrean Menunggu ({waitingPatients.length})
                </span>
                <span className="text-[11px] text-[#059669] font-medium">Urutan Prioritas</span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {waitingPatients.length === 0 ? (
                  <p className="text-xs text-center py-8 text-[#64748B]">
                    Semua pasien dalam antrean telah dipanggil.
                  </p>
                ) : (
                  waitingPatients.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                        item.isPriority
                          ? 'border-amber-300 bg-amber-50/60'
                          : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-base text-[#0F172A]">
                            {item.queueNumber}
                          </span>
                          {item.isPriority && (
                            <span className="text-[9px] font-bold text-amber-800 bg-amber-200 px-1 py-0.2 rounded">
                              PRIORITAS
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-[#0F172A] mt-0.5">
                          {item.patientName}
                        </div>
                        <div className="text-[10px] text-[#64748B]">
                          {item.slotTime ? `Sesi ${item.slotTime}` : 'Walk-in'}
                        </div>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleQueueAction(item, 'call')}
                        className="text-xs min-h-[36px]"
                      >
                        Panggil
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Skipped patients re-entry per PRD */}
            {skippedPatients.length > 0 && (
              <div className="pt-3 border-t border-[#E2E8F0] mt-3">
                <span className="text-xs font-semibold text-red-700 block mb-1.5">
                  Pasien Dilewati ({skippedPatients.length}) - Re-entry 30 Menit:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {skippedPatients.map((sp) => (
                    <button
                      key={sp.id}
                      onClick={() => handleQueueAction(sp, 're_enter')}
                      className="text-[11px] font-mono px-2 py-1 bg-red-50 text-red-800 border border-red-200 rounded hover:bg-red-100 flex items-center gap-1"
                      title="Klik untuk masukkan kembali ke ujung antrean"
                    >
                      <span>{sp.queueNumber}</span>
                      <RotateCcw size={10} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Referrals Requiring Approval Section */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-headline font-bold text-[#0F172A] flex items-center gap-2">
              <FileText size={18} className="text-[#059669]" />
              Persetujuan Surat Rujukan Pasien
            </h2>
            <p className="text-xs text-[#64748B]">
              Perawat dapat menginisiasi rujukan, dokter menyetujui langsung pada tablet dengan 1 ketukan.
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[8px] overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs font-body">
            <thead className="bg-[#0F172A] text-white font-headline text-[12px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Pasien</th>
                <th className="py-3 px-4">Rumah Sakit Tujuan</th>
                <th className="py-3 px-4">Alasan Medis Rujukan</th>
                <th className="py-3 px-4">Inisiator</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {referrals.map((ref) => (
                <tr key={ref.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3 px-4 font-semibold text-[#0F172A]">{ref.patientName}</td>
                  <td className="py-3 px-4 font-medium text-[#059669]">{ref.destinationHospital}</td>
                  <td className="py-3 px-4 text-[#475569] max-w-xs truncate">{ref.reason}</td>
                  <td className="py-3 px-4 text-[#64748B]">
                    {ref.initiatedBy === 'nurse' ? `Perawat: ${ref.nurseName}` : 'Dokter Pemeriksa'}
                  </td>
                  <td className="py-3 px-4">
                    {ref.status === 'approved' ? (
                      <Chip variant="success">TELAH DISETUJUI</Chip>
                    ) : (
                      <Chip variant="warning">MENUNGGU ACC DOKTER</Chip>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedReferral(ref)}
                      className="text-xs"
                    >
                      Buka & Tinjau Surat
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CREATE REFERRAL MODAL */}
      <Modal
        isOpen={isCreateReferralOpen}
        onClose={() => setIsCreateReferralOpen(false)}
        title="Buat Surat Rujukan Rumah Sakit Baru"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateReferral} className="space-y-3 font-body">
          <Input
            label="Nama Lengkap Pasien *"
            value={refPatientName}
            onChange={(e) => setRefPatientName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="NIK Pasien (Opsional)"
              value={refPatientNik}
              onChange={(e) => setRefPatientNik(e.target.value)}
              placeholder="3171xxxxxxxxxxxx"
              maxLength={16}
            />
            <Input
              label="Nomor Telepon Pasien *"
              value={refPatientPhone}
              onChange={(e) => setRefPatientPhone(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Tanggal Lahir Pasien *"
              type="date"
              value={refPatientDob}
              onChange={(e) => setRefPatientDob(e.target.value)}
              required
            />
            <Input
              label="Riwayat Alergi Obat / Makanan"
              value={refAllergies}
              onChange={(e) => setRefAllergies(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[14px] font-medium text-[#0F172A] mb-[6px] block">
              Catatan Klinis & Temuan Pemeriksaan *
            </label>
            <textarea
              value={refClinicalNotes}
              onChange={(e) => setRefClinicalNotes(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A] outline-none focus:border-[#0F172A] h-20"
              required
            />
          </div>

          <div>
            <label className="text-[14px] font-medium text-[#0F172A] mb-[6px] block">
              Alasan Rujukan Spesialis *
            </label>
            <textarea
              value={refReason}
              onChange={(e) => setRefReason(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A] outline-none focus:border-[#0F172A] h-16"
              required
            />
          </div>

          <div>
            <label className="text-[14px] font-medium text-[#0F172A] mb-[6px] block">
              Rumah Sakit / Fasilitas Kesehatan Rujukan Tujuan *
            </label>
            <select
              value={refDestination}
              onChange={(e) => setRefDestination(e.target.value)}
              className="w-full h-[42px] px-3 bg-white border border-[#E2E8F0] rounded-[8px] text-xs font-semibold text-[#0F172A]"
            >
              <option value="RSUD Tarakan Jakarta Pusat">RSUD Tarakan Jakarta Pusat (Pusat Rujukan Bedah Mulut)</option>
              <option value="RSPAD Gatot Soebroto">RSPAD Gatot Soebroto Jakarta</option>
              <option value="RSUPN Dr. Cipto Mangunkusumo (RSCM)">RSUPN Dr. Cipto Mangunkusumo (RSCM)</option>
              <option value="RS Gigi dan Mulut (RSGM) FKG UI">RS Gigi dan Mulut (RSGM) FKG UI Salemba</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsCreateReferralOpen(false)}
            >
              Batal
            </Button>
            <Button variant="sage" type="submit" isLoading={refLoading}>
              Terbitkan & Ajukan Persetujuan Dokter
            </Button>
          </div>
        </form>
      </Modal>

      {/* View & Print Referral Modal */}
      <ReferralLetterModal
        referral={selectedReferral}
        onClose={() => setSelectedReferral(null)}
        onRefresh={loadClinicalData}
      />
    </div>
  );
}
