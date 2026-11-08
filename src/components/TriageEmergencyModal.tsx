"use client";

import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { AlertTriangle, Clock, Zap } from 'lucide-react';
import { Doctor } from '@/types';

interface TriageEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  onSuccess: (data: any) => void;
}

export const TriageEmergencyModal: React.FC<TriageEmergencyModalProps> = ({
  isOpen,
  onClose,
  doctors,
  onSuccess,
}) => {
  const [triageLevel, setTriageLevel] = useState<'emergency' | 'urgent' | 'routine'>('emergency');
  const [patientName, setPatientName] = useState('');
  const [approxAge, setApproxAge] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [complaint, setComplaint] = useState('Perdarahan hebat pasca tindakan / Trauma maksilofasial');
  const [companionPhone, setCompanionPhone] = useState('');
  const [doctorId, setDoctorId] = useState(doctors.find((d) => d.isOnDuty)?.id || doctors[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const quickComplaints = [
    'Perdarahan hebat pasca tindakan / Trauma rahang',
    'Sakit gigi akut berdenyut hebat / Abses fasial meluas',
    'Fraktur gigi anterior akibat benturan',
    'Dislokasi sendi temporomandibular (TMJ)',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const selectedDoc = doctors.find((d) => d.id === doctorId);
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'emergency',
          doctorId,
          patientName: patientName.trim() || 'Pasien Darurat (Unknown)',
          patientDob: approxAge ? `${2026 - parseInt(approxAge)}-01-01` : '1990-01-01',
          patientGender: gender,
          triageLevel,
          triageComplaint: complaint,
          companionPhone: companionPhone.trim(),
          isPriority: true,
          actorName: 'Resepsionis',
          actorRole: 'front_desk',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mendaftarkan pasien darurat');

      onSuccess(data.item);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Triase Cepat & Pasien Darurat (< 60 Detik)" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4 font-body">
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center gap-2 text-xs text-amber-900">
          <Zap className="text-amber-600 shrink-0" size={18} />
          <span>
            <strong>Protokol Darurat:</strong> Pasien gawat darurat langsung diterbitkan ID sementara (TMP-xxxx) dan diposisikan di barisan terdepan antrean tanpa menunggu slot.
          </span>
        </div>

        {/* Triage Level Selector */}
        <div>
          <label className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider block mb-2">
            1. Tingkat Triase Klinis
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTriageLevel('emergency')}
              className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                triageLevel === 'emergency'
                  ? 'border-red-600 bg-red-50 text-red-900 ring-2 ring-red-500/20'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-xs uppercase">
                <AlertTriangle size={14} className="text-red-600" />
                Gawat Darurat
              </div>
              <span className="text-[11px] text-slate-500">Kritis, perdarahan hebat, trauma akut</span>
            </button>

            <button
              type="button"
              onClick={() => setTriageLevel('urgent')}
              className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                triageLevel === 'urgent'
                  ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-xs uppercase">
                <Clock size={14} className="text-amber-600" />
                Mendesak (Urgent)
              </div>
              <span className="text-[11px] text-slate-500">Nyeri akut hebat, abses, bengkak</span>
            </button>

            <button
              type="button"
              onClick={() => setTriageLevel('routine')}
              className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                triageLevel === 'routine'
                  ? 'border-slate-800 bg-slate-100 text-slate-900 ring-2 ring-slate-400'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="font-bold text-xs uppercase">Rutin</div>
              <span className="text-[11px] text-slate-500">Pemeriksaan biasa tanpa kegawatan</span>
            </button>
          </div>
        </div>

        {/* Quick Complaints Shortcut */}
        <div>
          <label className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider block mb-1">
            2. Keluhan Utama (Pilih Cepat atau Ketik)
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {quickComplaints.map((qc) => (
              <button
                key={qc}
                type="button"
                onClick={() => setComplaint(qc)}
                className={`text-[11px] px-2.5 py-1 rounded border transition-colors ${
                  complaint === qc
                    ? 'bg-[#0F172A] text-white border-[#0F172A]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {qc}
              </button>
            ))}
          </div>
          <Input
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder="Deskripsi singkat keluhan..."
            required
          />
        </div>

        {/* Patient Quick Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Nama Pasien"
            placeholder="Kosongkan jika 'Unknown'"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
          />

          <Input
            label="Perkiraan Usia (Tahun)"
            type="number"
            placeholder="Contoh: 35"
            value={approxAge}
            onChange={(e) => setApproxAge(e.target.value)}
          />

          <div>
            <label className="text-[14px] font-medium text-[#0F172A] mb-[6px] block">
              Jenis Kelamin
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGender('L')}
                className={`flex-1 h-[42px] rounded-lg border text-sm font-medium ${
                  gender === 'L' ? 'bg-[#0F172A] text-white border-[#0F172A]' : 'bg-white border-slate-200'
                }`}
              >
                Laki-laki
              </button>
              <button
                type="button"
                onClick={() => setGender('P')}
                className={`flex-1 h-[42px] rounded-lg border text-sm font-medium ${
                  gender === 'P' ? 'bg-[#0F172A] text-white border-[#0F172A]' : 'bg-white border-slate-200'
                }`}
              >
                Perempuan
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Nomor Telepon Pengantar / Pasien"
            placeholder="08xxxxxxxxxx"
            value={companionPhone}
            onChange={(e) => setCompanionPhone(e.target.value)}
          />

          <div>
            <label className="text-[14px] font-medium text-[#0F172A] mb-[6px] block">
              Arahkan ke Dokter Gigi Piket
            </label>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full h-[42px] px-3 bg-white border border-[#E2E8F0] rounded-[8px] text-sm text-[#0F172A] outline-none focus:border-[#0F172A]"
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.room}) {doc.isOnDuty ? '• SEDANG PIKET' : '• OFF'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>}

        <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
          <Button variant="secondary" type="button" onClick={onClose}>
            Batal
          </Button>
          <Button variant="destructive" type="submit" isLoading={isSubmitting} className="gap-1.5">
            <Zap size={16} />
            Terbitkan Antrean Darurat Langsung
          </Button>
        </div>
      </form>
    </Modal>
  );
};
