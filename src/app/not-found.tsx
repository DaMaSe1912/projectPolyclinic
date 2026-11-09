import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-6 py-20 min-h-[60vh]">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 text-[#0F172A] font-headline font-bold text-2xl shadow-sm border border-slate-200">
          404
        </div>
        <h1 className="text-2xl font-headline font-bold text-[#0F172A]">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Maaf, halaman yang Anda tuju tidak tersedia, telah dipindahkan, atau alamat URL yang Anda masukkan salah.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <Home size={16} />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

