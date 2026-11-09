"use client";

import React from 'react';
import { QueueItem } from '@/types';
import { Printer, X } from 'lucide-react';
import { Button } from './ui/Button';

interface QueueTicketModalProps {
  item: QueueItem | null;
  onClose: () => void;
}

export const QueueTicketModal: React.FC<QueueTicketModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200/80">
        {/* Modal Controls - Hidden when printing */}
        <div className="no-print p-4 sm:p-5 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
          <span className="font-headline font-semibold text-sm">Cetak Tiket Antrean</span>
          <button onClick={onClose} className="p-1 hover:text-slate-300 rounded-full hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Printable Ticket Area */}
        <div className="p-6 bg-white text-center print-container">
          <div className="border-b-2 border-dashed border-[#CBD5E1] pb-4 mb-4">
            <h4 className="font-headline font-bold text-base text-[#0F172A] uppercase tracking-wide">
              Klinik Pratama Sehat Utama
            </h4>
            <p className="text-xs text-[#0D9488] font-medium mt-0.5">
              Poliklinik Gigi & Mulut (Dental Care)
            </p>
            <p className="text-[11px] text-[#94A3B8]">
              Jl. Kesehatan Raya No. 128, Jakarta Pusat
            </p>
          </div>

          <div className="my-4 py-3 bg-gradient-to-br from-teal-50/50 via-white to-slate-50 rounded-2xl border border-teal-100/80 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-[#64748B] font-medium">
              Nomor Antrean Anda
            </p>
            <div className="text-5xl font-mono font-extrabold text-[#0F172A] tracking-wider my-2">
              {item.queueNumber}
            </div>
            {item.isPriority && (
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 text-[11px] font-bold rounded-full uppercase border border-amber-200">
                Prioritas: {item.priorityReason || 'Khusus'}
              </span>
            )}
          </div>

          <div className="text-left text-xs space-y-1.5 border-b-2 border-dashed border-[#CBD5E1] pb-4 mb-4 font-body">
            <div className="flex justify-between">
              <span className="text-[#64748B]">Nama Pasien:</span>
              <span className="font-semibold text-[#0F172A]">{item.patientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Dokter:</span>
              <span className="font-semibold text-[#0F172A]">{item.doctorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Ruang:</span>
              <span className="font-semibold text-[#0F172A]">{item.doctorCode === 'A' ? 'Ruang Poli Gigi 1' : 'Ruang Poli Gigi 2'}</span>
            </div>
            {item.slotTime && (
              <div className="flex justify-between">
                <span className="text-[#64748B]">Sesi Slot:</span>
                <span className="font-semibold text-[#0F172A]">{item.slotTime}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#64748B]">Waktu Cetak:</span>
              <span className="font-mono text-[#0F172A]">
                {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </span>
            </div>
          </div>

          <p className="text-[11px] text-[#64748B] italic">
            Mohon menunggu panggilan pada layar TV di ruang tunggu. Terima kasih.
          </p>
        </div>

        {/* Action Buttons - Hidden when printing */}
        <div className="no-print p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex gap-2">
          <Button variant="secondary" size="md" className="flex-1" onClick={onClose}>
            Tutup
          </Button>
          <Button variant="sage" size="md" className="flex-1 gap-2" onClick={handlePrint}>
            <Printer size={16} />
            Cetak Tiket
          </Button>
        </div>
      </div>
    </div>
  );
};
