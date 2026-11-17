import React from 'react';

interface SehatUtamaLogoProps {
  /** Size of the logo icon in pixels or Tailwind classes */
  className?: string;
  /** Whether displayed on dark theme (e.g. TV screen dark mode) */
  isDark?: boolean;
  /** Variant: 'emblem' (Medical Cross + Heartbeat Pulse + Star of Excellence) or 'monogram' (SU + Health Sparkle) */
  variant?: 'emblem' | 'monogram';
}

/**
 * Logo resmi Klinik Pratama Sehat Utama
 * Menggabungkan filosofi "Sehat" (Salib Medis + Detak Jantung / ECG Pulse)
 * dan "Utama" (Bintang Emas Pelayanan Prima / Prioritas).
 */
export default function SehatUtamaLogo({
  className = 'w-10 h-10',
  isDark = false,
  variant = 'emblem',
}: SehatUtamaLogoProps) {
  if (variant === 'monogram') {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center font-headline font-black shadow-md select-none transition-transform ${
          isDark
            ? 'bg-slate-900 border border-slate-700 text-teal-400'
            : 'bg-gradient-to-br from-[#0D9488] to-[#0F766E] text-white shadow-teal-700/20'
        } ${className}`}
      >
        <span className="text-teal-200 text-xs mr-0.5">✦</span>
        <span className="tracking-tight text-sm font-black">SU</span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-2 flex items-center justify-center shadow-md select-none transition-transform ${
        isDark
          ? 'bg-slate-900 border border-slate-700 shadow-slate-950/40'
          : 'bg-gradient-to-br from-[#0D9488] to-[#0F766E] shadow-teal-700/20'
      } ${className}`}
      title="Klinik Pratama Sehat Utama"
    >
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Salib Medis ("Sehat") */}
        <rect
          x="14"
          y="5"
          width="8"
          height="26"
          rx="4"
          fill={isDark ? '#0D9488' : '#FFFFFF'}
        />
        <rect
          x="5"
          y="14"
          width="26"
          height="8"
          rx="4"
          fill={isDark ? '#0D9488' : '#FFFFFF'}
        />

        {/* Garis Detak Jantung / ECG Pulse ("Sehat & Vitalitas") */}
        <path
          d="M5 18H11.5L14 12L17.5 24L20.5 14.5L22.5 19L24 18H31"
          stroke={isDark ? '#FFFFFF' : '#0D9488'}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Bintang Kejora Emas ("Utama" - Mutu & Pelayanan Prima) */}
        <path
          d="M28 5L29 7.5L31.5 8.5L29 9.5L28 12L27 9.5L24.5 8.5L27 7.5Z"
          fill="#FACC15"
        />
      </svg>
    </div>
  );
}

