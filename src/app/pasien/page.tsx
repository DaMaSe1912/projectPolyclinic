"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { QueueItem, Doctor, FamilyMember } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Calendar,
  Clock,
  User,
  Users,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  XCircle,
  Plus,
  RefreshCw,
  BellRing,
  Stethoscope,
  Info,
} from 'lucide-react';
import {
  STANDARD_CLINIC_SLOTS,
  getIndonesianDayName,
  resolveDoctorForSlot,
  isDoctorPracticingOnDate,
  isSlotWithinShift,
  getFirstValidSlotForDoctor,
} from '@/lib/doctorSchedule';

export default function PatientPage() {
  const router = useRouter();
  const { user, role, isLoading: authLoading, login, refreshUser } = useAuth();

  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Booking modal
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('08:30 - 09:00');
  const [bookingDate, setBookingDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError, setBookError] = useState('');

  // Add Family Member Modal
  const [isAddFamilyOpen, setIsAddFamilyOpen] = useState(false);
  const [famName, setFamName] = useState('');
  const [famNik, setFamNik] = useState('');
  const [famDob, setFamDob] = useState('2015-06-20');
  const [famGender, setFamGender] = useState<'L' | 'P'>('L');
  const [famRelation, setFamRelation] = useState<'Anak' | 'Orang Tua' | 'Pasangan' | 'Lainnya'>('Anak');

  // Reschedule Modal
  const [rescheduleItem, setRescheduleItem] = useState<QueueItem | null>(null);
  const [newSlotTime, setNewSlotTime] = useState('10:00 - 10:30');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (role !== 'patient') {
        router.push('/access-denied');
      }
    }
  }, [user, role, authLoading, router]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [queueRes, docRes] = await Promise.all([
        fetch(`/api/queue?patientId=${user.id}`),
        fetch('/api/doctors'),
      ]);
      const queueData = await queueRes.json();
      const docData = await docRes.json();

      if (queueData.success) setQueueItems(queueData.data);
      if (docData.success) {
        setDoctors(docData.data);
        if (docData.data.length > 0 && !selectedDoctorId) {
          const matched = resolveDoctorForSlot(docData.data, selectedSlot, bookingDate);
          if (matched) {
            setSelectedDoctorId(matched.id);
          } else {
            const availableDoc =
              docData.data.find((d: Doctor) => d.isOnDuty && d.isAvailable) ||
              docData.data.find((d: Doctor) => d.isAvailable) ||
              docData.data[0];
            setSelectedDoctorId(availableDoc.id);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000); // 2 second sync
    return () => clearInterval(interval);
  }, [user]);

  const handleCheckIn = async (item: QueueItem) => {
    try {
      const res = await fetch('/api/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          action: 'check_in',
          actorName: user?.name,
          actorRole: 'patient',
        }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancel = async (item: QueueItem) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan jadwal antrean ini?')) return;
    try {
      const res = await fetch('/api/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          action: 'cancel',
          actorName: user?.name,
          actorRole: 'patient',
        }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenBookingModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setBookingDate(today);
    setBookError('');
    // Auto-resolve initial doctor for standard morning slot
    const initialSlot = '08:30 - 09:00';
    const doc = resolveDoctorForSlot(doctors, initialSlot, today);
    if (doc) {
      setSelectedDoctorId(doc.id);
      setSelectedSlot(initialSlot);
    } else {
      const practicingDoc =
        doctors.find((d) => isDoctorPracticingOnDate(d, today) && d.isAvailable) ||
        doctors.find((d) => isDoctorPracticingOnDate(d, today)) ||
        doctors.find((d) => d.isAvailable) ||
        doctors[0];
      if (practicingDoc) {
        setSelectedDoctorId(practicingDoc.id);
        const firstSlot = getFirstValidSlotForDoctor(practicingDoc) || STANDARD_CLINIC_SLOTS[0];
        setSelectedSlot(firstSlot);
      }
    }
    setIsBookModalOpen(true);
  };

  const handleDateChange = (newDate: string) => {
    setBookingDate(newDate);
    const matchedDoctor = resolveDoctorForSlot(doctors, selectedSlot, newDate, selectedDoctorId);
    if (matchedDoctor) {
      setSelectedDoctorId(matchedDoctor.id);
    } else {
      const practicingDoc =
        doctors.find((d) => isDoctorPracticingOnDate(d, newDate) && d.isAvailable) ||
        doctors.find((d) => isDoctorPracticingOnDate(d, newDate)) ||
        doctors.find((d) => d.isAvailable) ||
        doctors[0];
      if (practicingDoc) {
        setSelectedDoctorId(practicingDoc.id);
        const firstSlot = getFirstValidSlotForDoctor(practicingDoc) || STANDARD_CLINIC_SLOTS[0];
        setSelectedSlot(firstSlot);
      }
    }
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    // Automatic dynamic doctor switch based on slot time and practice schedule
    const matchedDoctor = resolveDoctorForSlot(doctors, slot, bookingDate, selectedDoctorId);
    if (matchedDoctor && matchedDoctor.id !== selectedDoctorId) {
      setSelectedDoctorId(matchedDoctor.id);
    }
  };

  const handleDoctorChange = (docId: string) => {
    setSelectedDoctorId(docId);
    const doc = doctors.find((d) => d.id === docId);
    if (doc) {
      // If current slot is outside the chosen doctor's shift, auto-switch to their first valid slot
      if (!isSlotWithinShift(selectedSlot, doc.shiftHours)) {
        const firstSlot = getFirstValidSlotForDoctor(doc);
        if (firstSlot) {
          setSelectedSlot(firstSlot);
        }
      }
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleItem) return;
    setRescheduleLoading(true);
    try {
      const targetDoctor = resolveDoctorForSlot(
        doctors,
        newSlotTime,
        rescheduleItem.bookingDate,
        rescheduleItem.doctorId
      );

      const res = await fetch('/api/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rescheduleItem.id,
          action: 'reschedule',
          newSlotTime,
          newDoctorId: targetDoctor?.id,
          actorName: user?.name,
          actorRole: 'patient',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRescheduleItem(null);
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookLoading(true);
    setBookError('');

    try {
      let patientName = user?.name || '';
      let patientNik = user?.nik || '';
      let patientDob = user?.dob || '1990-01-01';
      let patientGender = user?.gender || 'L';

      if (selectedFamilyId && user?.familyMembers) {
        const mem = user.familyMembers.find((m) => m.id === selectedFamilyId);
        if (mem) {
          patientName = mem.name;
          patientNik = mem.nik || '';
          patientDob = mem.dob;
          patientGender = mem.gender;
        }
      }

      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'online',
          doctorId: selectedDoctorId,
          patientId: user?.id,
          patientName,
          patientPhone: user?.phone,
          patientNik,
          patientDob,
          patientGender,
          slotTime: selectedSlot,
          bookingDate,
          actorName: user?.name,
          actorRole: 'patient',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsBookModalOpen(false);
      loadData();
    } catch (err: any) {
      setBookError(err.message);
    } finally {
      setBookLoading(false);
    }
  };

  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const newMember: FamilyMember = {
      id: `fam-${Date.now()}`,
      name: famName.trim(),
      nik: famNik.trim() || undefined,
      dob: famDob,
      gender: famGender,
      relationship: famRelation,
    };

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newFamilyMember: newMember }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        login(data.user);
      }
    } catch (err) {
      console.error('Gagal menyimpan anggota keluarga:', err);
    }

    setIsAddFamilyOpen(false);
    setFamName('');
  };

  if (authLoading || !user) {
    return <div className="p-8 text-center text-[#64748B]">Memuat portal pasien...</div>;
  }

  const activeVisits = queueItems.filter(
    (q) => !['done', 'cancelled', 'no_show', 'not_served'].includes(q.status)
  );
  const pastVisits = queueItems.filter((q) =>
    ['done', 'cancelled', 'no_show', 'not_served'].includes(q.status)
  );

  const availableSlots = STANDARD_CLINIC_SLOTS;

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 font-body">
      {/* Welcome Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-[#059669] font-semibold uppercase tracking-wider">
            Portal Pasien & Akun Keluarga
          </span>
          <h1 className="text-2xl font-headline font-bold text-[#0F172A] mt-1">
            Selamat Datang, {user.name}
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            No. Handphone: <strong className="font-mono text-[#0F172A]">{user.phone}</strong> • NIK: <strong className="font-mono text-[#0F172A]">{user.nik || 'Belum diisi'}</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setIsAddFamilyOpen(true)}
            className="gap-2"
          >
            <Users size={16} />
            Kelola Anggota Keluarga
          </Button>
          <Button
            variant="sage"
            size="md"
            onClick={handleOpenBookingModal}
            className="gap-2"
          >
            <Plus size={16} />
            Daftar Antrean Baru
          </Button>
        </div>
      </div>

      {/* Emergency Notice */}
      <div className="bg-rose-50 border border-rose-200/90 rounded-2xl p-4 text-xs text-rose-950 flex items-center gap-2.5 mb-8 shadow-sm">
        <AlertTriangle size={17} className="text-rose-600 shrink-0" />
        <span>
          Jika Anda atau keluarga mengalami kondisi medis darurat akut (sesak napas berat, nyeri dada mendadak, kejang, cedera trauma), segera menuju IGD terdekat atau hubungi front desk untuk triase darurat cepat.
        </span>
      </div>

      {/* ACTIVE QUEUE STATUS CARDS */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-headline font-bold text-[#0F172A] flex items-center gap-2">
            <BellRing size={18} className="text-[#0D9488]" />
            Antrean Aktif Hari Ini
          </h2>
          <span className="text-xs text-[#64748B]">Auto-update real-time (&lt; 2 detik)</span>
        </div>

        {activeVisits.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center text-[#64748B] shadow-sm">
            <p className="font-semibold text-base text-[#0F172A]">Belum Ada Antrean Aktif</p>
            <p className="text-xs text-slate-500 mt-1">Klik tombol &quot;Daftar Antrean Baru&quot; di atas untuk membuat jadwal periksa yang nyaman.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeVisits.map((item) => {
              const isCheckedIn = item.status === 'checked_in' || item.status === 'waiting' || item.status === 'called' || item.status === 'in_consultation';
              const isCalled = item.status === 'called';
              const isInRoom = item.status === 'in_consultation';
              const isDocUnavailable = item.status === 'doctor_unavailable';

              return (
                <Card
                  key={item.id}
                  variant="elevated"
                  className={`rounded-3xl border transition-all duration-300 shadow-cozy hover:shadow-floating ${
                    isCalled
                      ? 'border-emerald-400 ring-4 ring-emerald-500/10 bg-emerald-50/10'
                      : isDocUnavailable
                      ? 'border-red-300 bg-red-50/10'
                      : 'border-teal-100/90'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/50">
                        Pasien: <strong className="text-teal-900">{item.patientName}</strong>
                      </span>
                      <h3 className="text-base font-headline font-bold text-[#0F172A] mt-2">
                        {item.doctorName}
                      </h3>
                      <p className="text-xs text-[#64748B] mt-0.5">{item.doctorCode === 'A' ? 'Ruang Poli Umum 1' : 'Ruang Poli Umum 2'}</p>
                    </div>

                    <div className="text-right">
                      {isCalled && <Chip variant="success">GILIRAN ANDA DIPANGGIL</Chip>}
                      {isInRoom && <Chip variant="info">SEDANG KONSULTASI</Chip>}
                      {item.status === 'waiting' && <Chip variant="warning">DALAM ANTREAN</Chip>}
                      {item.status === 'checked_in' && <Chip variant="info">SUDAH CHECK-IN</Chip>}
                      {item.status === 'booked' && <Chip variant="neutral">MENUNGGU CHECK-IN</Chip>}
                      {isDocUnavailable && <Chip variant="error">DOKTER BERHALANGAN</Chip>}
                    </div>
                  </div>

                  {/* Main Queue Number & Booking Code */}
                  <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 my-3.5 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-[#64748B] block font-medium">
                        Nomor Antrean
                      </span>
                      <span className="text-3xl font-mono font-extrabold text-[#0F172A]">
                        {item.queueNumber.startsWith('PENDING-') ? 'Belum Terbit' : item.queueNumber}
                      </span>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        {item.queueNumber.startsWith('PENDING-')
                          ? 'Diterbitkan saat tiba di klinik & check-in'
                          : `Panggilan ke-${item.callCount} dari maksimal 3`}
                      </p>
                    </div>

                    <div className="text-right border-l border-slate-200/80 pl-4">
                      <span className="text-[11px] uppercase tracking-wider text-[#64748B] block font-medium">
                        Kode Janji Temu
                      </span>
                      <span className="text-sm font-mono font-bold text-[#0D9488]">
                        {item.bookingCode || 'WALK-IN'}
                      </span>
                      {item.slotTime && (
                        <p className="text-[11px] text-[#475569] font-medium mt-0.5">
                          Sesi: {item.slotTime}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Doctor Unavailable Handling per PRD */}
                  {isDocUnavailable && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-xs text-red-900 mb-3 space-y-2">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertTriangle size={15} /> Pemberitahuan: Dokter berhalangan praktik hari ini
                      </p>
                      <p>
                        Sesuai ketentuan, Anda berhak memilih jadwal sesi berikutnya dengan prioritas antrean, berpindah ke dokter lain yang bertugas, atau membatalkan tanpa sanksi.
                      </p>
                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setRescheduleItem(item)}
                        >
                          Pilih Jadwal Lain (Prioritas)
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancel(item)}
                        >
                          Batalkan Antrean
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                    <span className="text-xs text-[#64748B] flex items-center gap-1">
                      <Clock size={13} /> {item.bookingDate}
                    </span>

                    <div className="flex gap-2">
                      {!isCheckedIn && !isDocUnavailable && (
                        <Button
                          variant="sage"
                          size="sm"
                          onClick={() => handleCheckIn(item)}
                          className="gap-1.5"
                        >
                          <CheckCircle size={14} />
                          Saya Sudah di Klinik (Check-in)
                        </Button>
                      )}

                      {!isCheckedIn && !isDocUnavailable && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setRescheduleItem(item)}
                          className="gap-1.5"
                        >
                          <RotateCcw size={14} />
                          Jadwal Ulang
                        </Button>
                      )}

                      {!isInRoom && item.status !== 'done' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(item)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          Batalkan
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* FAMILY MEMBERS LIST */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-headline font-bold text-[#0F172A] flex items-center gap-2">
            <Users size={18} className="text-[#059669]" />
            Daftar Profil Keluarga
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddFamilyOpen(true)}
            className="text-xs text-[#059669] gap-1"
          >
            <Plus size={14} /> Tambah Profil
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(user.familyMembers || []).map((fm) => (
            <div
              key={fm.id}
              className="bg-white border border-[#E2E8F0] p-4 rounded-lg flex items-start justify-between"
            >
              <div>
                <span className="text-[10px] font-semibold text-[#059669] uppercase tracking-wider block">
                  {fm.relationship}
                </span>
                <h4 className="font-headline font-bold text-sm text-[#0F172A] mt-0.5">
                  {fm.name}
                </h4>
                <p className="text-xs text-[#64748B]">Tgl Lahir: {fm.dob} ({fm.gender === 'L' ? 'L' : 'P'})</p>
                {fm.nik && <p className="text-xs font-mono text-[#94A3B8]">NIK: {fm.nik}</p>}
              </div>
              <div className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#0F172A]">
                <User size={16} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PAST VISITS HISTORY */}
      {pastVisits.length > 0 && (
        <section>
          <h2 className="text-lg font-headline font-bold text-[#0F172A] mb-4">
            Riwayat Kunjungan Poliklinik
          </h2>
          <div className="bg-white border border-[#E2E8F0] rounded-[8px] overflow-hidden">
            <table className="w-full text-left text-xs font-body">
              <thead className="bg-[#0F172A] text-white font-headline text-[13px] uppercase">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Nomor / Kode</th>
                  <th className="py-3 px-4">Pasien</th>
                  <th className="py-3 px-4">Dokter Poliklinik</th>
                  <th className="py-3 px-4">Status Kunjungan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {pastVisits.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4 text-[#64748B]">{item.bookingDate}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">{item.queueNumber}</td>
                    <td className="py-3 px-4 font-semibold text-[#0F172A]">{item.patientName}</td>
                    <td className="py-3 px-4 text-[#475569]">{item.doctorName}</td>
                    <td className="py-3 px-4">
                      {item.status === 'done' && <Chip variant="success">SELESAI</Chip>}
                      {item.status === 'cancelled' && <Chip variant="error">DIBATALKAN</Chip>}
                      {item.status === 'no_show' && <Chip variant="warning">NO SHOW</Chip>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* BOOKING MODAL */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Daftar Antrean Janji Temu Online"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateBooking} className="space-y-4 font-body">
          <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] text-xs text-[#475569]">
            Pilih pasien keluarga yang akan berobat, tentukan dokter umum/spesialis serta waktu slot. Nomor antrean fisik (seperti A-001) akan langsung terbit saat check-in pada hari pemeriksaan.
          </div>

          <div>
            <label className="text-[14px] font-medium text-[#0F172A] mb-[6px] block">
              1. Pilih Anggota Keluarga yang Akan Berobat
            </label>
            <select
              value={selectedFamilyId}
              onChange={(e) => setSelectedFamilyId(e.target.value)}
              className="w-full h-[42px] px-3 bg-white border border-[#E2E8F0] rounded-[8px] text-sm text-[#0F172A] outline-none focus:border-[#0F172A]"
            >
              <option value="">{user.name} (Diri Sendiri)</option>
              {(user.familyMembers || [])
                .filter((f) => f.relationship !== 'Diri Sendiri')
                .map((fm) => (
                  <option key={fm.id} value={fm.id}>
                    {fm.name} ({fm.relationship}) - Tgl Lahir: {fm.dob}
                  </option>
                ))}
            </select>
          </div>

          {/* 2. Tanggal Kunjungan */}
          <div>
            <div className="flex items-center justify-between mb-[6px]">
              <label className="text-[14px] font-medium text-[#0F172A] block">
                2. Tanggal Kunjungan
              </label>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800">
                📅 Hari: {getIndonesianDayName(bookingDate)}
              </span>
            </div>
            <Input
              type="date"
              value={bookingDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => handleDateChange(e.target.value)}
              required
            />
          </div>

          {/* 3. Pilih Sesi Jam (Slot Konsultasi) - Dokter otomatis berganti */}
          <div className="space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="text-[14px] font-medium text-[#0F172A] block">
                3. Pilih Sesi Jam (Slot Konsultasi)
              </label>
              <span className="text-[11px] text-[#059669] font-medium flex items-center gap-1">
                <Info size={13} />
                Dokter berganti otomatis sesuai sesi jam yang Anda klik
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 max-h-[260px] overflow-y-auto pr-1">
              {availableSlots.map((slot) => {
                const slotDoctor = resolveDoctorForSlot(doctors, slot, bookingDate);
                const isSlotSelected = selectedSlot === slot;
                const isPracticing = slotDoctor ? isDoctorPracticingOnDate(slotDoctor, bookingDate) : false;
                const isAvailable = slotDoctor ? slotDoctor.isAvailable : false;
                const isDisabled = !slotDoctor || !isPracticing;

                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSlotSelect(slot)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[58px] ${
                      isSlotSelected
                        ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-md ring-2 ring-emerald-500/60'
                        : isDisabled
                        ? 'bg-slate-50 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed'
                        : !isAvailable
                        ? 'bg-rose-50/70 border-rose-200 text-rose-900 hover:bg-rose-100'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className={`font-mono text-xs font-bold ${isSlotSelected ? 'text-white' : isDisabled ? 'text-slate-400' : 'text-slate-900'}`}>
                        {slot}
                      </span>
                      {isSlotSelected && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                      )}
                    </div>

                    <div className="mt-1 truncate w-full text-[11px]">
                      {isDisabled ? (
                        <span className="text-slate-400 italic text-[10px]">Tutup / Di Luar Jadwal</span>
                      ) : !isAvailable ? (
                        <span className="text-rose-600 font-semibold text-[10px] truncate block">
                          ⚠️ {slotDoctor?.name.split(',')[0]} (Berhalangan)
                        </span>
                      ) : (
                        <span className={`font-medium truncate block ${isSlotSelected ? 'text-emerald-300' : 'text-emerald-700'}`}>
                          👨‍⚕️ {slotDoctor?.name.split(',')[0]} ({slotDoctor?.code})
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Dokter Poliklinik (Sinkron Otomatis & Bisa Diganti) */}
          <div>
            <div className="flex items-center justify-between mb-[6px]">
              <label className="text-[14px] font-medium text-[#0F172A] block">
                4. Dokter Poliklinik yang Bertugas
              </label>
              <span className="text-[11px] text-slate-500">
                Sinkron otomatis dengan jam konsultasi
              </span>
            </div>
            <select
              value={selectedDoctorId}
              onChange={(e) => handleDoctorChange(e.target.value)}
              className="w-full h-[42px] px-3 bg-white border border-[#E2E8F0] rounded-[8px] text-sm text-[#0F172A] outline-none focus:border-[#0F172A]"
            >
              {doctors.map((doc) => {
                const dayName = getIndonesianDayName(bookingDate);
                const worksOnDate = isDoctorPracticingOnDate(doc, bookingDate);
                return (
                  <option key={doc.id} value={doc.id} disabled={!doc.isAvailable}>
                    {doc.name} ({doc.code}) • Sesi {doc.shiftHours} {!worksOnDate ? `[TIDAK PRAKTIK DI HARI ${dayName.toUpperCase()}]` : ''} {!doc.isAvailable ? '• BERHALANGAN (TIDAK DAPAT DIPILIH)' : doc.isOnDuty ? '• PIKET HARI INI' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Doctor Detail & Sync Confirmation Card */}
          {(() => {
            const currentSelectedDoc = doctors.find((d) => d.id === selectedDoctorId);
            if (!currentSelectedDoc) return null;

            if (!currentSelectedDoc.isAvailable) {
              return (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Dokter Sedang Berhalangan:</strong>
                    <p className="mt-0.5 text-rose-700">
                      {currentSelectedDoc.name} sedang menandai dirinya tidak tersedia / berhalangan untuk melayani pasien hari ini. Harap pilih sesi jam atau dokter lain yang sedang bertugas.
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5 text-sm">
                      <span>👨‍⚕️ {currentSelectedDoc.name}</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#0F172A] text-white">
                        Dokter ({currentSelectedDoc.code})
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                        {currentSelectedDoc.room}
                      </span>
                    </div>
                    <div className="text-slate-500 mt-1">
                      {currentSelectedDoc.specialty} • Sesi Praktik: <strong className="text-slate-800">{currentSelectedDoc.shiftHours} WIB</strong>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                      <CheckCircle size={14} className="text-emerald-600" />
                      Aktif di Sesi: {selectedSlot}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {bookError && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded">{bookError}</p>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsBookModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="sage"
              type="submit"
              isLoading={bookLoading}
              disabled={bookLoading || !doctors.find((d) => d.id === selectedDoctorId)?.isAvailable}
              className="gap-2"
            >
              <CheckCircle size={16} />
              Konfirmasi & Dapatkan Kode Janji
            </Button>
          </div>
        </form>
      </Modal>

      {/* ADD FAMILY MEMBER MODAL */}
      <Modal
        isOpen={isAddFamilyOpen}
        onClose={() => setIsAddFamilyOpen(false)}
        title="Tambah Anggota Keluarga"
      >
        <form onSubmit={handleAddFamilyMember} className="space-y-3 font-body">
          <Input
            label="Nama Lengkap *"
            value={famName}
            onChange={(e) => setFamName(e.target.value)}
            placeholder="Contoh: Anisa Wijaya"
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[14px] font-medium text-[#0F172A] mb-[6px] block">
                Hubungan Keluarga
              </label>
              <select
                value={famRelation}
                onChange={(e) => setFamRelation(e.target.value as any)}
                className="w-full h-[42px] px-3 bg-white border border-[#E2E8F0] rounded-[8px] text-sm text-[#0F172A]"
              >
                <option value="Anak">Anak</option>
                <option value="Orang Tua">Orang Tua</option>
                <option value="Pasangan">Pasangan (Suami/Istri)</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <Input
              label="NIK (Opsional)"
              value={famNik}
              onChange={(e) => setFamNik(e.target.value)}
              placeholder="3171xxxxxxxxxxxx"
              maxLength={16}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Tanggal Lahir *"
              type="date"
              value={famDob}
              onChange={(e) => setFamDob(e.target.value)}
              required
            />
            <div>
              <label className="text-[14px] font-medium text-[#0F172A] mb-[6px] block">
                Jenis Kelamin
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFamGender('L')}
                  className={`flex-1 h-[42px] rounded-lg border text-xs font-semibold ${
                    famGender === 'L' ? 'bg-[#0F172A] text-white border-[#0F172A]' : 'bg-white border-slate-200'
                  }`}
                >
                  Laki-laki
                </button>
                <button
                  type="button"
                  onClick={() => setFamGender('P')}
                  className={`flex-1 h-[42px] rounded-lg border text-xs font-semibold ${
                    famGender === 'P' ? 'bg-[#0F172A] text-white border-[#0F172A]' : 'bg-white border-slate-200'
                  }`}
                >
                  Perempuan
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsAddFamilyOpen(false)}
            >
              Batal
            </Button>
            <Button variant="primary" type="submit">
              Simpan Profil
            </Button>
          </div>
        </form>
      </Modal>

      {/* RESCHEDULE MODAL */}
      <Modal
        isOpen={!!rescheduleItem}
        onClose={() => setRescheduleItem(null)}
        title="Jadwal Ulang Antrean (Reschedule)"
        maxWidth="lg"
      >
        <div className="space-y-4 font-body">
          <p className="text-xs text-[#475569]">
            Anda sedang menjadwal ulang antrean untuk <strong>{rescheduleItem?.patientName}</strong> (sebelumnya bersama {rescheduleItem?.doctorName}). Sistem akan membatalkan sesi lama dan membuat janji baru serta menyinkronkan dokter yang bertugas di slot baru tersebut.
          </p>

          <div>
            <label className="text-xs font-semibold text-[#0F172A] uppercase block mb-1">
              Pilih Sesi Jam Baru:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {availableSlots.map((slot) => {
                const targetDoc = rescheduleItem
                  ? resolveDoctorForSlot(doctors, slot, rescheduleItem.bookingDate)
                  : null;
                const isSelected = newSlotTime === slot;
                const isAvailable = targetDoc ? targetDoc.isAvailable : false;

                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={!targetDoc || !isAvailable}
                    onClick={() => setNewSlotTime(slot)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#0F172A] text-white border-[#0F172A] ring-2 ring-emerald-500 shadow-sm'
                        : !targetDoc || !isAvailable
                        ? 'bg-slate-50 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-500 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-mono text-xs font-bold">{slot}</div>
                    <div className="text-[10px] truncate mt-0.5">
                      {targetDoc ? (
                        isAvailable ? (
                          <span className={isSelected ? 'text-emerald-300 font-medium' : 'text-emerald-700 font-medium'}>
                            👨‍⚕️ {targetDoc.name.split(',')[0]} ({targetDoc.code})
                          </span>
                        ) : (
                          <span className="text-rose-500 font-medium">⚠️ Berhalangan</span>
                        )
                      ) : (
                        <span className="text-slate-400 italic">Tutup</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {rescheduleItem && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              {(() => {
                const newDoc = resolveDoctorForSlot(doctors, newSlotTime, rescheduleItem.bookingDate);
                return (
                  <div className="text-slate-700 flex items-center justify-between">
                    <div>
                      Dokter untuk sesi baru: <strong>{newDoc?.name || 'Dokter Terjadwal'} ({newDoc?.code || '-'})</strong> • Ruangan: {newDoc?.room || '-'}
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Sesi: {newSlotTime}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setRescheduleItem(null)}
            >
              Batal
            </Button>
            <Button
              variant="sage"
              onClick={handleReschedule}
              isLoading={rescheduleLoading}
            >
              Konfirmasi Jadwal Ulang
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
