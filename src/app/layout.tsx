import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { DevMailboxModal } from "@/components/DevMailboxModal";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistem Antrean Poliklinik Umum | Klinik Pratama Sehat Utama",
  description: "Aplikasi antrean real-time, pendaftaran pasien online & walk-in, triase darurat, dan rujukan rumah sakit sesuai standar pelayanan medis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <DevMailboxModal />
        </AuthProvider>
      </body>
    </html>
  );
}
