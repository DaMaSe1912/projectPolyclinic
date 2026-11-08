"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DevEmail } from '@/types';
import { Mail, X, ExternalLink, Trash2, CheckCircle, RefreshCw } from 'lucide-react';

export const DevMailboxModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [emails, setEmails] = useState<DevEmail[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dev/mailbox');
      const data = await res.json();
      if (data.success) {
        setEmails(data.mailLog || []);
      }
    } catch (e) {
      console.error('Failed to fetch dev mailbox:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
    const interval = setInterval(fetchEmails, 3000); // Check every 3s
    return () => clearInterval(interval);
  }, []);

  const handleClear = async () => {
    try {
      await fetch('/api/dev/mailbox', { method: 'DELETE' });
      setEmails([]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {/* Floating trigger pill */}
      <div className="fixed bottom-4 right-4 z-40 no-print">
        <button
          type="button"
          onClick={() => {
            fetchEmails();
            setIsOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 bg-[#0F172A] text-white hover:bg-[#1E293B] rounded-full shadow-lg border border-slate-700 text-xs font-medium transition-all transform hover:scale-105"
        >
          <Mail size={15} className="text-[#10B981]" />
          <span>Dev Mailbox</span>
          {emails.length > 0 && (
            <span className="px-1.5 py-0.2 bg-[#10B981] text-white font-bold rounded-full text-[10px]">
              {emails.length}
            </span>
          )}
        </button>
      </div>

      {/* Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-[#E2E8F0]">
            {/* Header */}
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0F172A] text-[#10B981] flex items-center justify-center font-bold">
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-headline text-[#0F172A]">
                    Simulasi Kotak Masuk (Dev Mailbox)
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Email verifikasi akun & reset kata sandi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={fetchEmails}
                  title="Segarkan"
                  className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] rounded"
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  title="Kosongkan"
                  className="p-1.5 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] rounded ml-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Email List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
              {emails.length === 0 ? (
                <div className="text-center py-12 text-[#94A3B8] text-xs">
                  <Mail size={32} className="mx-auto mb-2 opacity-40" />
                  Belum ada email yang dikirim dalam simulasi dev ini.
                </div>
              ) : (
                emails.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 bg-white rounded-[12px] border border-[#CBD5E1] shadow-sm space-y-2 hover:border-[#94A3B8] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {m.type}
                      </span>
                      <span className="text-[10px] text-[#94A3B8]">
                        {new Date(m.sentAt).toLocaleTimeString('id-ID')}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-[#0F172A]">{m.subject}</div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">Kepada: {m.to}</div>
                    </div>

                    <p className="text-xs text-[#334155] whitespace-pre-line leading-relaxed bg-[#F8FAFC] p-2.5 rounded-[8px] border border-[#E2E8F0]">
                      {m.body}
                    </p>

                    {m.link && (
                      <div className="pt-1">
                        <Link
                          href={m.link}
                          onClick={() => setIsOpen(false)}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#059669] hover:bg-[#047857] text-white text-xs font-medium rounded-[8px] shadow-sm transition-colors"
                        >
                          <ExternalLink size={14} />
                          Buka Tautan: {m.type === 'verification' ? 'Verifikasi Email' : 'Reset Password'}
                        </Link>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

