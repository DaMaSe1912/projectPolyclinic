"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { QueueItem, Doctor, Referral } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { Modal } from '@/components/ui/Modal';
import { QueueTicketModal } from '@/components/QueueTicketModal';
import { ReferralLetterModal } from '@/components/ReferralLetterModal';
import { TriageEmergencyModal } from '@/components/TriageEmergencyModal';
import {
  Search,
  UserPlus,
  Printer,
  Zap,
  AlertTriangle,
  CheckCircle,
  FileText,
  Clock,
  RefreshCw,
  Phone,
  Filter,
} from 'lucide-react';

export default function FrontDeskPage() {
  const router = useRouter();
  const { user, role, isLoading: authLoading } = useAuth();

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('all');
  const [lastSync, setLastSync] = useState<string>('');

  // Modals
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<QueueItem | null>(null);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [priorityModalItem, setPriorityModalItem] = useState<QueueItem | null>(null);
  const [priorityReasonInput, setPriorityReasonInput] = useState('Lansia (> 65 Tahun)');

  // Walk-in form states
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinNik, setWalkinNik] = useState('');
  const [walkinDob, setWalkinDob] = useState('1988-03-12');
  const [walkinGender, setWalkinGender] = useState<'L' | 'P'>('L');
  const [walkinDoctorId, setWalkinDoctorId] = useState('');
  const [walkinIsPriority, setWalkinIsPriority] = useState(false);
  const [walkinPriorityReason, setWalkinPriorityReason] = useState('Lansia');
  const [walkinLoading, setWalkinLoading] = useState(false);
  const [walkinError, setWalkinError] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/staff');
      } else if (role !== 'front_desk' && role !== 'admin') {
        router.push('/access-denied');
      }
    }
  }, [user, role, authLoading, router]);

  const loadAllData = async () => {
    try {
      const [qRes, docRes, refRes] = await Promise.all([
        fetch('/api/queue'),
        fetch('/api/doctors'),
        fetch('/api/referrals'),
      ]);
      const qData = await qRes.json();
      const docData = await docRes.json();
      const refData = await refRes.json();

      if (qData.success) setQueue(qData.data);
      if (docData.success) {
        setDoctors(docData.data);
        if (!walkinDoctorId && docData.data.length > 0) {
          const onDuty = docData.data.find((d: Doctor) => d.isOnDuty) || docData.data[0];
          setWalkinDoctorId(onDuty.id);
        }
      }
      if (refData.success) setReferrals(refData.data);

      setLastSync(new Date().toLocaleTimeString('id-ID'));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 2000); // 2 second sync
    return () => clearInterval(interval);
  }, []);

  const handleCheckIn = async (item: QueueItem) => {
    try {
      const res = await fetch('/api/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          action: 'check_in',
          actorName: user?.name || 'Resepsionis',
          actorRole: 'front_desk',
        }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
      else {
        loadAllData();
        setSelectedTicket(data.item);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetPriority = async () => {
    if (!priorityModalItem) return;
    try {
      const res = await fetch('/api/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: priorityModalItem.id,
          action: 'set_priority',
          priorityReason: priorityReasonInput,
          actorName: user?.name,
          actorRole: 'front_desk',
        }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
      setPriorityModalItem(null);
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelByStaff = async (item: QueueItem) => {
    if (!confirm(`Batalkan antrean ${item.queueNumber} (${item.patientName})?`)) return;
    try {
      await fetch('/api/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          action: 'cancel',
          actorName: user?.name,
          actorRole: 'front_desk',
        }),
      });
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkinLoading(true);
    setWalkinError('');

    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'walk_in',
          doctorId: walkinDoctorId,
          patientName: walkinName.trim(),
          patientPhone: walkinPhone.trim(),
          patientNik: walkinNik.trim() || undefined,
          patientDob: walkinDob,
          patientGender: walkinGender,
          isPriority: walkinIsPriority,
          priorityReason: walkinIsPriority ? walkinPriorityReason : undefined,
          actorName: user?.name,
          actorRole: 'front_desk',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsWalkInOpen(false);
      setWalkinName('');
      setWalkinPhone('');
      setWalkinNik('');
      loadAllData();
      setSelectedTicket(data.item);
    } catch (err: any) {
      setWalkinError(err.message);
    } finally {
      setWalkinLoading(false);
    }
  };

  if (authLoading || !user) {
    return <div className="p-8 text-center text-[#64748B]">Memuat panel front desk...</div>;
  }

  // Filter queues
  let filteredQueue = queue;
  if (selectedDoctorFilter !== 'all') {
    filteredQueue = filteredQueue.filter((q) => q.doctorId === selectedDoctorFilter);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredQueue = filteredQueue.filter(
      (item) =>
        item.patientName.toLowerCase().includes(q) ||
        item.queueNumber.toLowerCase().includes(q) ||
        item.patientPhone.includes(q) ||
        item.bookingCode?.toLowerCase().includes(q) ||
        (item.patientNik && item.patientNik.includes(q))
    );
  }

  // Summary counts
  const totalIssued = queue.length;
  const inRoomCount = queue.filter((q) => q.status === 'in_consultation').length;
  const waitingCount = queue.filter((q) => q.status === 'waiting' || q.status === 'checked_in').length;
  const doneCount = queue.filter((q) => q.status === 'done').length;
  const urgentCount = queue.filter((q) => q.isPriority || q.triageLevel === 'emergency').length;

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 font-body">
      {/* Top Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#059669] uppercase tracking-wider">
              Pelayanan Resepsionis & Pendaftaran
            </span>
            <span className="text-xs text-[#94A3B8]">• Sinkron: {lastSync}</span>
          </div>
          <h1 className="text-2xl font-headline font-bold text-[#0F172A] mt-1">
            Meja Front Desk Poliklinik Gigi
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Quick Emergency Button */}
          <Button
            variant="destructive"
            size="md"
            onClick={() => setIsEmergencyOpen(true)}
            className="gap-2 shadow-sm font-semibold"
          >
            <Zap size={16} />
            Triase Darurat (&lt; 60 dtk)
          </Button>

          {/* New Walk-in Button */}
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsWalkInOpen(true)}
            className="gap-2"
          >
            <UserPlus size={16} />
            Pendaftaran Walk-in
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-white p-3.5 rounded-lg border border-[#E2E8F0]">
          <span className="text-[11px] uppercase tracking-wider text-[#64748B] block">Total Antrean</span>
          <span className="text-2xl font-mono font-bold text-[#0F172A]">{totalIssued}</span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-[#E2E8F0]">
          <span className="text-[11px] uppercase tracking-wider text-emerald-600 block">Sedang Dilayani</span>
          <span className="text-2xl font-mono font-bold text-emerald-600">{inRoomCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-[#E2E8F0]">
          <span className="text-[11px] uppercase tracking-wider text-amber-600 block">Menunggu Giliran</span>
          <span className="text-2xl font-mono font-bold text-amber-600">{waitingCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-[#E2E8F0]">
          <span className="text-[11px] uppercase tracking-wider text-[#64748B] block">Selesai Periksa</span>
          <span className="text-2xl font-mono font-bold text-[#0F172A]">{doneCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-[#E2E8F0]">
          <span className="text-[11px] uppercase tracking-wider text-red-600 block">Kasus Urgent/Prioritas</span>
          <span className="text-2xl font-mono font-bold text-red-600">{urgentCount}</span>
        </div>
      </div>

      {/* Search & Doctor Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] mb-6 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-3 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Cari pasien berdasarkan nama, nomor telepon, NIK, atau nomor antrean..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[42px] pl-9 pr-3 text-sm bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg outline-none focus:border-[#0F172A]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={16} className="text-[#64748B] shrink-0" />
          <select
            value={selectedDoctorFilter}
            onChange={(e) => setSelectedDoctorFilter(e.target.value)}
            className="h-[42px] px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#0F172A]"
          >
            <option value="all">Semua Dokter Gigi</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code}) {d.isOnDuty ? '• Piket' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Master Queue Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] overflow-hidden shadow-sm mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-body">
            <thead className="bg-[#0F172A] text-white font-headline text-[12px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No. Antrean</th>
                <th className="py-3 px-4">Pasien & Kontak</th>
                <th className="py-3 px-4">Dokter & Ruang</th>
                <th className="py-3 px-4">Tipe & Sesi</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi Front Desk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#64748B]">
                    Tidak ada antrean yang cocok dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => {
                  const isCheckedIn = ['checked_in', 'waiting', 'called', 'in_consultation', 'done'].includes(item.status);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#F8FAFC] transition-colors ${
                        item.isPriority ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Queue Number */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-sm text-[#0F172A]">
                            {item.queueNumber}
                          </span>
                          {item.isPriority && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded" title={item.priorityReason}>
                              PRIORITAS
                            </span>
                          )}
                        </div>
                        {item.bookingCode && (
                          <span className="text-[10px] font-mono text-[#059669] block">
                            {item.bookingCode}
                          </span>
                        )}
                      </td>

                      {/* Patient Name & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#0F172A] text-sm">
                          {item.patientName}
                        </div>
                        <div className="text-[11px] text-[#64748B] flex items-center gap-1">
                          <Phone size={11} /> {item.patientPhone}
                        </div>
                        {item.patientNik && (
                          <div className="text-[10px] font-mono text-[#94A3B8]">
                            NIK: {item.patientNik}
                          </div>
                        )}
                      </td>

                      {/* Doctor */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#0F172A]">{item.doctorName}</div>
                        <div className="text-[11px] text-[#059669]">
                          {item.doctorCode === 'A' ? 'Ruang Poli Gigi 1' : 'Ruang Poli Gigi 2'}
                        </div>
                      </td>

                      {/* Type & Slot */}
                      <td className="py-3.5 px-4">
                        <span className="capitalize font-medium text-[#475569]">
                          {item.type === 'walk_in' ? 'Walk-in' : item.type === 'emergency' ? 'Darurat (TMP)' : 'Online'}
                        </span>
                        {item.slotTime && (
                          <span className="text-[11px] text-[#64748B] block font-mono">
                            {item.slotTime}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {item.status === 'in_consultation' && <Chip variant="info">DI DALAM RUANGAN</Chip>}
                        {item.status === 'called' && <Chip variant="success">DIPANGGIL (ke-{item.callCount})</Chip>}
                        {item.status === 'waiting' && <Chip variant="warning">MENUNGGU</Chip>}
                        {item.status === 'checked_in' && <Chip variant="info">CHECKED IN</Chip>}
                        {item.status === 'booked' && <Chip variant="neutral">BOOKED</Chip>}
                        {item.status === 'done' && <Chip variant="success">SELESAI</Chip>}
                        {item.status === 'skipped' && <Chip variant="error">DILEWATI</Chip>}
                        {item.status === 'cancelled' && <Chip variant="error">BATAL</Chip>}
                        {item.status === 'doctor_unavailable' && <Chip variant="error">DOKTER OFF</Chip>}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Check in button if booked */}
                          {item.status === 'booked' && (
                            <Button
                              variant="sage"
                              size="sm"
                              onClick={() => handleCheckIn(item)}
                              className="text-xs"
                            >
                              Check-in & Terbitkan Nomor
                            </Button>
                          )}

                          {/* Print ticket button */}
                          {isCheckedIn && (
                            <button
                              onClick={() => setSelectedTicket(item)}
                              title="Cetak Tiket Fisik"
                              className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-[#0F172A]"
                            >
                              <Printer size={15} />
                            </button>
                          )}

                          {/* Set Priority */}
                          {!item.isPriority && item.status !== 'done' && (
                            <button
                              onClick={() => setPriorityModalItem(item)}
                              title="Tandai Prioritas Khusus"
                              className="p-1.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-800"
                            >
                              <Zap size={15} />
                            </button>
                          )}

                          {/* Cancel by front desk */}
                          {item.status !== 'done' && item.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelByStaff(item)}
                              title="Batalkan Antrean"
                              className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Referrals Queue & Printing Desk */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-headline font-bold text-[#0F172A] flex items-center gap-2">
              <FileText size={18} className="text-[#059669]" />
              Surat Rujukan Rumah Sakit (Referral Desk)
            </h2>
            <p className="text-xs text-[#64748B]">
              Cetak surat rujukan resmi setelah disetujui dokter penanggung jawab
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[8px] overflow-hidden">
          <table className="w-full text-left text-xs font-body">
            <thead className="bg-[#0F172A] text-white font-headline text-[12px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No. Rujukan</th>
                <th className="py-3 px-4">Pasien</th>
                <th className="py-3 px-4">RS Tujuan</th>
                <th className="py-3 px-4">Alasan Rujukan</th>
                <th className="py-3 px-4">Status Dokter</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {referrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#64748B]">
                    Belum ada surat rujukan yang dibuat hari ini.
                  </td>
                </tr>
              ) : (
                referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">{ref.id}</td>
                    <td className="py-3 px-4 font-semibold text-[#0F172A]">{ref.patientName}</td>
                    <td className="py-3 px-4 font-medium text-[#059669]">{ref.destinationHospital}</td>
                    <td className="py-3 px-4 text-[#475569] max-w-xs truncate">{ref.reason}</td>
                    <td className="py-3 px-4">
                      {ref.status === 'approved' ? (
                        <Chip variant="success">DISETUJUI DOKTER</Chip>
                      ) : (
                        <Chip variant="warning">MENUNGGU ACC</Chip>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedReferral(ref)}
                        className="gap-1.5 text-xs"
                      >
                        <Printer size={13} />
                        Lihat & Cetak
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* WALK-IN REGISTRATION MODAL */}
      <Modal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        title="Pendaftaran Pasien Walk-in (Di Tempat)"
        maxWidth="lg"
      >
        <form onSubmit={handleWalkInSubmit} className="space-y-3 font-body">
          <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] text-xs text-[#64748B]">
            Pasien walk-in akan langsung diterbitkan nomor antrean fisik dokter gigi hari ini dan bergabung secara adil dengan antrean online.
          </div>

          <Input
            label="Nama Lengkap Pasien *"
            placeholder="Sesuai KTP / Pasien"
            value={walkinName}
            onChange={(e) => setWalkinName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Nomor Telepon *"
              placeholder="08xxxxxxxxxx"
              value={walkinPhone}
              onChange={(e) => setWalkinPhone(e.target.value)}
              required
            />
            <Input
              label="NIK (16 Digit - Opsional)"
              placeholder="3171xxxxxxxxxxxx"
              maxLength={16}
              value={walkinNik}
              onChange={(e) => setWalkinNik(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Tanggal Lahir *"
              type="date"
              value={walkinDob}
              onChange={(e) => setWalkinDob(e.target.value)}
              required
            />
            <div>
              <label className="text-[14px] font-medium text-[#0F172A] mb-[6px] block">
                Jenis Kelamin
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setWalkinGender('L')}
                  className={`flex-1 h-[42px] rounded-lg border text-xs font-semibold ${
                    walkinGender === 'L' ? 'bg-[#0F172A] text-white border-[#0F172A]' : 'bg-white border-slate-200'
                  }`}
                >
                  Laki-laki
                </button>
                <button
                  type="button"
                  onClick={() => setWalkinGender('P')}
                  className={`flex-1 h-[42px] rounded-lg border text-xs font-semibold ${
                    walkinGender === 'P' ? 'bg-[#0F172A] text-white border-[#0F172A]' : 'bg-white border-slate-200'
                  }`}
                >
                  Perempuan
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[14px] font-medium text-[#0F172A] mb-[6px] block">
              Pilih Dokter Gigi Piket
            </label>
            <select
              value={walkinDoctorId}
              onChange={(e) => setWalkinDoctorId(e.target.value)}
              className="w-full h-[42px] px-3 bg-white border border-[#E2E8F0] rounded-[8px] text-sm text-[#0F172A]"
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.code}) {doc.isOnDuty ? '• PIKET HARI INI' : '• OFF'}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Flag Checkbox */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={walkinIsPriority}
                onChange={(e) => setWalkinIsPriority(e.target.checked)}
                className="w-4 h-4 accent-[#0F172A]"
              />
              <span className="text-sm font-semibold text-[#0F172A]">
                Tandai Sebagai Pasien Prioritas (Lansia / Hamil / Sakit Berat)
              </span>
            </label>

            {walkinIsPriority && (
              <div className="mt-2 pl-6">
                <Input
                  label="Alasan Prioritas (Wajib Diisi Staf)"
                  value={walkinPriorityReason}
                  onChange={(e) => setWalkinPriorityReason(e.target.value)}
                  placeholder="Contoh: Lansia usia 74 tahun / Ibu hamil trimester 3"
                  required={walkinIsPriority}
                />
              </div>
            )}
          </div>

          {walkinError && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{walkinError}</p>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsWalkInOpen(false)}
            >
              Batal
            </Button>
            <Button variant="primary" type="submit" isLoading={walkinLoading}>
              Daftarkan & Terbitkan Nomor Antrean
            </Button>
          </div>
        </form>
      </Modal>

      {/* PRIORITY MODAL */}
      <Modal
        isOpen={!!priorityModalItem}
        onClose={() => setPriorityModalItem(null)}
        title="Tetapkan Pasien Prioritas"
      >
        <div className="space-y-4 font-body">
          <p className="text-xs text-[#475569]">
            Memberikan status prioritas kepada <strong>{priorityModalItem?.patientName}</strong> ({priorityModalItem?.queueNumber}) akan memajukan posisi antrean ke barisan depan. Sesuai PRD, setiap penetapan prioritas wajib mencantumkan alasan klinis/sosial dan dicatat dalam audit log.
          </p>

          <Input
            label="Alasan Prioritas *"
            value={priorityReasonInput}
            onChange={(e) => setPriorityReasonInput(e.target.value)}
            placeholder="Contoh: Lansia > 70 tahun / Disabilitas / Nyeri Akut"
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setPriorityModalItem(null)}>
              Batal
            </Button>
            <Button variant="sage" onClick={handleSetPriority}>
              Terapkan Prioritas
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rapid Triage Emergency Modal */}
      <TriageEmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        doctors={doctors}
        onSuccess={(newItem) => {
          loadAllData();
          setSelectedTicket(newItem);
        }}
      />

      {/* Ticket Modal */}
      <QueueTicketModal
        item={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />

      {/* Referral Modal */}
      <ReferralLetterModal
        referral={selectedReferral}
        onClose={() => setSelectedReferral(null)}
        onRefresh={loadAllData}
      />
    </div>
  );
}
