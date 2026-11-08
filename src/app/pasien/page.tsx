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
} from 'lucide-react';

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
          const onDuty = docData.data.find((d: Doctor) => d.isOnDuty) || docData.data[0];
          setSelectedDoctorId(onDuty.id);
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

  const handleReschedule = async () => {
    if (!rescheduleItem) return;
    setRescheduleLoading(true);
    try {
      const res = await fetch('/api/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rescheduleItem.id,
          action: 'reschedule',
          newSlotTime,
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

  const availableSlots = [
    '08:30 - 09:00',
    '09:00 - 09:30',
    '09:30 - 10:00',
    '10:00 - 10:30',
    '10:30 - 11:00',
    '11:00 - 11:30',
    '13:00 - 13:30',
    '13:30 - 14:00',
    '14:00 - 14:30',
    '14:30 - 15:00',
    '15:00 - 15:30',
    '15:30 - 16:00',
  ];

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
            onClick={() => setIsBookModalOpen(true)}
            className="gap-2"
          >
            <Plus size={16} />
            Daftar Antrean Baru
          </Button>
        </div>
      </div>

      {/* Emergency Notice */}
      <div className="bg-red-500/10 border border-red-200 rounded-lg p-3 text-xs text-red-900 flex items-center gap-2 mb-8">
        <AlertTriangle size={16} className="text-red-600 shrink-0" />
        <span>
          Jika Anda atau keluarga mengalami kondisi darurat gigi akut (perdarahan hebat, cedera rahang berat), segera menuju IGD atau konsultasikan ke front desk untuk triase darurat cepat.
        </span>
      </div>

      {/* ACTIVE QUEUE STATUS CARDS */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-headline font-bold text-[#0F172A] flex items-center gap-2">
            <BellRing size={18} className="text-[#059669]" />
            Antrean Aktif Hari Ini
          </h2>
          <span className="text-xs text-[#64748B]">Auto-update real-time (&lt; 2 detik)</span>
        </div>

        {activeVisits.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-8 text-center text-[#64748B]">
            <p className="font-medium text-[#0F172A]">Belum Ada Antrean Aktif</p>
            <p className="text-xs mt-1">Klik tombol &quot;Daftar Antrean Baru&quot; di atas untuk membuat jadwal periksa.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeVisits.map((item) => {
              const isCheckedIn = item.status === 'checked_in' || item.status === 'waiting' || item.status === 'called' || item.status === 'in_consultation';
              const isCalled = item.status === 'called';
              const isInRoom = item.status === 'in_consultation';
              const isDocUnavailable = item.status === 'doctor_unavailable';

              return (
                <Card
                  key={item.id}
                  variant="elevated"
                  className={`border-l-4 ${
                    isCalled
                      ? 'border-l-[#059669] ring-2 ring-[#05966930]'
                      : isDocUnavailable
                      ? 'border-l-[#EF4444]'
                      : 'border-l-[#0F172A]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs font-semibold text-[#64748B]">
                        Untuk Pasien: <strong className="text-[#0F172A]">{item.patientName}</strong>
                      </span>
                      <h3 className="text-base font-headline font-bold text-[#0F172A] mt-0.5">
                        {item.doctorName}
                      </h3>
                      <p className="text-xs text-[#64748B]">{item.doctorCode === 'A' ? 'Ruang Poli Gigi 1' : 'Ruang Poli Gigi 2'}</p>
                    </div>

                    <div className="text-right">
                      {isCalled && <Chip variant="success" className="animate-pulse">GILIRAN ANDA DIPANGGIL</Chip>}
                      {isInRoom && <Chip variant="info">SEDANG KONSULTASI</Chip>}
                      {item.status === 'waiting' && <Chip variant="warning">DALAM ANTREAN</Chip>}
                      {item.status === 'checked_in' && <Chip variant="info">SUDAH CHECK-IN</Chip>}
                      {item.status === 'booked' && <Chip variant="neutral">MENUNGGU CHECK-IN</Chip>}
                      {isDocUnavailable && <Chip variant="error">DOKTER BERHALANGAN</Chip>}
                    </div>
                  </div>

                  {/* Main Queue Number & Booking Code */}
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 my-3 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-[#64748B] block font-medium">
                        Nomor Antrean
                      </span>
                      <span className="text-3xl font-mono font-bold text-[#0F172A]">
                        {item.queueNumber.startsWith('PENDING-') ? 'Belum Terbit' : item.queueNumber}
                      </span>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        {item.queueNumber.startsWith('PENDING-')
                          ? 'Diterbitkan saat Anda tiba di klinik & check-in'
                          : `Panggilan ke-${item.callCount} dari maksimal 3`}
                      </p>
                    </div>

                    <div className="text-right border-l border-[#E2E8F0] pl-4">
                      <span className="text-[11px] uppercase tracking-wider text-[#64748B] block font-medium">
                        Kode Janji Temu
                      </span>
                      <span className="text-sm font-mono font-bold text-[#059669]">
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
                  <th className="py-3 px-4">Dokter Gigi</th>
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
            Pilih pasien keluarga yang akan berobat, tentukan dokter gigi spesialis serta waktu slot. Nomor antrean fisik (seperti A-001) akan langsung terbit saat check-in pada hari pemeriksaan.
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[14px] font-medium text-[#0F172A] mb-[6px] block">
                2. Tanggal Kunjungan
              </label>
              <Input
                type="date"
                value={bookingDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setBookingDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-[14px] font-medium text-[#0F172A] mb-[6px] block">
                3. Pilih Dokter Gigi Spesialis
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full h-[42px] px-3 bg-white border border-[#E2E8F0] rounded-[8px] text-sm text-[#0F172A] outline-none focus:border-[#0F172A]"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.code}) {doc.isOnDuty ? '• PIKET HARI INI' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[14px] font-medium text-[#0F172A] mb-[6px] block">
              4. Pilih Sesi Jam (Slot Konsultasi)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2 px-2 rounded-lg border text-xs font-mono font-medium transition-all ${
                    selectedSlot === slot
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

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
            <Button variant="sage" type="submit" isLoading={bookLoading} className="gap-2">
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
      >
        <div className="space-y-4 font-body">
          <p className="text-xs text-[#475569]">
            Anda sedang menjadwal ulang antrean untuk <strong>{rescheduleItem?.patientName}</strong> ({rescheduleItem?.doctorName}). Sistem akan membatalkan sesi lama dan membuat janji baru dalam satu langkah tanpa penalti.
          </p>

          <div>
            <label className="text-xs font-semibold text-[#0F172A] uppercase block mb-1">
              Pilih Sesi Jam Baru Hari Ini:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setNewSlotTime(slot)}
                  className={`py-2 px-2 rounded-lg border text-xs font-mono font-medium ${
                    newSlotTime === slot
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

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
