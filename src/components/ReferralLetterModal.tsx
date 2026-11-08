"use client";

import React, { useState } from 'react';
import { Referral } from '@/types';
import { Printer, CheckCircle, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Chip } from './ui/Chip';
import { useAuth } from '@/context/AuthContext';

interface ReferralLetterModalProps {
  referral: Referral | null;
  onClose: () => void;
  onRefresh?: () => void;
}

export const ReferralLetterModal: React.FC<ReferralLetterModalProps> = ({
  referral,
  onClose,
  onRefresh,
}) => {
  const { user, isDoctor } = useAuth();
  const [isApproving, setIsApproving] = useState(false);

  if (!referral) return null;

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await fetch('/api/referrals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: referral.id,
          action: 'approve',
          doctorId: user?.doctorId || 'doc-a',
          doctorName: user?.name || 'drg. Budi Santoso, Sp.KG',
          actorName: user?.name,
          actorRole: 'doctor',
        }),
      });
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsApproving(false);
    }
  };

  const handlePrint = async () => {
    try {
      await fetch('/api/referrals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: referral.id,
          action: 'log_print',
          actorName: user?.name || 'Staf Klinik',
          actorRole: user?.role || 'front_desk',
        }),
      });
    } catch (e) {
      console.error(e);
    }
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-[12px] shadow-2xl max-w-2xl w-full overflow-hidden border border-[#E2E8F0] my-8">
        {/* Header Controls (Hidden during print) */}
        <div className="no-print p-4 bg-[#0F172A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-headline font-semibold text-sm">Surat Rujukan Pasien</span>
            <Chip
              variant={referral.status === 'approved' ? 'success' : 'warning'}
              className="text-[10px]"
            >
              {referral.status === 'approved' ? 'Disetujui Dokter' : 'Menunggu Persetujuan Dokter'}
            </Chip>
          </div>
          <button onClick={onClose} className="p-1 hover:text-slate-300">
            <X size={18} />
          </button>
        </div>

        {/* Printable Formal Document */}
        <div className="p-8 bg-white print-container text-[#0F172A] font-body text-sm leading-relaxed">
          {/* Clinic Official Header */}
          <div className="border-b-2 border-[#0F172A] pb-4 mb-6 flex justify-between items-center">
            <div>
              <h2 className="font-headline font-bold text-lg uppercase tracking-wide text-[#0F172A]">
                Klinik Pratama Sehat Utama
              </h2>
              <p className="text-xs text-[#059669] font-medium">
                Instalasi Pelayanan Poliklinik Gigi & Mulut
              </p>
              <p className="text-[12px] text-[#64748B]">
                Jl. Kesehatan Raya No. 128, Jakarta Pusat | Telp: (021) 555-0192 | Email: polyclinic@sehatutama.id
              </p>
            </div>
            <div className="text-right text-xs text-[#64748B]">
              <div className="font-mono font-semibold text-[#0F172A]">NO: {referral.id.toUpperCase()}</div>
              <div>Tanggal: {new Date(referral.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>

          <div className="text-center my-4">
            <h3 className="font-headline font-bold text-base uppercase underline tracking-wider">
              SURAT RUJUKAN RUMAH SAKIT
            </h3>
            <p className="text-xs text-[#475569] mt-1">
              Kepada Yth. Dokter Penanggung Jawab Pasien (DPJP) / Unit Bedah Mulut & Dental Specialist
            </p>
            <p className="font-bold text-xs text-[#0F172A]">
              di {referral.destinationHospital}
            </p>
          </div>

          <div className="space-y-4 my-6">
            <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E2E8F0]">
              <h4 className="font-headline font-semibold text-xs text-[#0F172A] uppercase tracking-wider mb-2">
                A. Identitas Pasien
              </h4>
              <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                <div><span className="text-[#64748B]">Nama Pasien:</span> <strong className="text-[#0F172A]">{referral.patientName}</strong></div>
                <div><span className="text-[#64748B]">Jenis Kelamin / Usia:</span> {referral.patientGender === 'L' ? 'Laki-laki' : 'Perempuan'} (Tgl Lahir: {referral.patientDob})</div>
                <div><span className="text-[#64748B]">NIK / No. Rekam Medis:</span> <span className="font-mono">{referral.patientNik || '-'}</span></div>
                <div><span className="text-[#64748B]">No. Telepon / Kontak:</span> {referral.patientPhone}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-headline font-semibold text-xs text-[#0F172A] uppercase tracking-wider mb-1">
                  B. Riwayat Alergi
                </h4>
                <p className="text-xs text-[#EF4444] bg-[#EF444410] px-3 py-2 rounded font-medium">
                  {referral.allergies || 'Tidak ada riwayat alergi yang dilaporkan.'}
                </p>
              </div>

              <div>
                <h4 className="font-headline font-semibold text-xs text-[#0F172A] uppercase tracking-wider mb-1">
                  C. Anamnesis & Catatan Klinis
                </h4>
                <p className="text-xs text-[#334155] bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0]">
                  {referral.relevantMedicalRecord}
                </p>
              </div>

              <div>
                <h4 className="font-headline font-semibold text-xs text-[#0F172A] uppercase tracking-wider mb-1">
                  D. Alasan Rujukan
                </h4>
                <p className="text-xs text-[#334155] bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0]">
                  {referral.reason}
                </p>
              </div>
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-2 gap-8 pt-6 mt-8 border-t border-[#E2E8F0] text-center text-xs">
              <div>
                <p className="text-[#64748B]">Pembuat Rujukan,</p>
                <p className="text-[11px] text-[#94A3B8] mb-14">
                  {referral.initiatedBy === 'nurse' ? 'Perawat Poliklinik' : 'Dokter Pemeriksa'}
                </p>
                <p className="font-bold text-[#0F172A] underline">
                  {referral.nurseName || 'Ns. Maya Putri, S.Kep'}
                </p>
                <p className="text-[10px] text-[#64748B]">SIP. 19920412-2020-001</p>
              </div>

              <div>
                <p className="text-[#64748B]">Dokter Penanggung Jawab Pelayanan,</p>
                <p className="text-[11px] text-[#94A3B8] mb-14">
                  Dokter Gigi Spesialis
                </p>
                <p className="font-bold text-[#0F172A] underline">
                  {referral.approvingDoctorName || 'drg. Budi Santoso, Sp.KG'}
                </p>
                <p className="text-[10px] text-[#64748B]">SIP. 19800715-2010-004</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions (Hidden during print) */}
        <div className="no-print p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-between items-center gap-2">
          <Button variant="secondary" size="md" onClick={onClose}>
            Tutup
          </Button>

          <div className="flex gap-2">
            {isDoctor && referral.status === 'pending_doctor_approval' && (
              <Button
                variant="sage"
                size="md"
                className="gap-2"
                onClick={handleApprove}
                isLoading={isApproving}
              >
                <CheckCircle size={16} />
                Setujui Rujukan
              </Button>
            )}

            <Button
              variant="primary"
              size="md"
              className="gap-2"
              onClick={handlePrint}
              disabled={referral.status !== 'approved'}
            >
              <Printer size={16} />
              Cetak Surat Rujukan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
