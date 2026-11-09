# Sistem Antrean Poliklinik Umum (General Clinic)
### Klinik Pratama Sehat Utama

Implementasi sistem antrean dan registrasi pasien poliklinik umum berbasis Next.js (App Router), TypeScript, dan Tailwind CSS sesuai spesifikasi **PRD** dan panduan **Verdana Health Design System (`design.md`)**.

---

## 🌟 Fitur Utama Sesuai Spesifikasi

1. **Desain Verdana Health (`design.md`)**:
   - Palet warna: Primary Navy (`#0F172A`), Slate (`#64748B`), Cozy Green (`#0D9488`), dan latar belakang bersih (`#F8FAFC`).
   - Tipografi: Plus Jakarta Sans (Judul), DM Sans (Teks Utama), Fira Code (Kode antrean & metrik tabular).
   - Target sentuh minimal $44\text{px}$ pada tombol klinis & antarmuka tablet.
   - Diffused clinical elevation shadows & chip badges uppercase dengan letter tracking.

2. **Peran & Akses Penuh (Role-Based Access Control)**:
   - **Tamu / Publik (`/`)**: Jadwal 5 dokter poliklinik umum, nomor antrean berjalan tanpa nama pasien (privasi UU PDP), jam operasional, dan FAQ.
   - **Layar TV Ruang Tunggu (`/tv`)**: Tampilan full-screen 1080p/768p dengan nomor ekstra besar, suara panggilan otomatis (speech chime), dan banner *Reconnecting...* jika koneksi terputus (Khusus staf).
   - **Portal Pasien (`/pasien`)**: Login nomor HP + OTP, profil keluarga (anak, orang tua, pasangan), check-in kedatangan, jadwal ulang (*reschedule*), pembatalan, dan penanganan dokter berhalangan (*rebooking priority*).
   - **Meja Front Desk / Resepsionis (`/petugas`)**: Pendaftaran walk-in, **Triase Darurat Cepat (< 60 detik)** dengan penerbitan ID sementara `TMP-xxxx`, penetapan prioritas dengan alasan wajib, cetak tiket fisik, dan cetak surat rujukan.
   - **Ruang Klinis Dokter & Perawat (`/klinis`)**: Panggil (*Call*), panggil ulang (*Recall* maks 3x sebelum *Skipped*), mulai konsultasi, selesai (*Finish*), batalkan panggilan (*Undo*), toggle ketersediaan dokter, dan persetujuan surat rujukan 1 ketukan.
   - **Super Admin IT (`/admin`)**: Master data 5 dokter poliklinik umum (maksimal 2 piket per hari), deteksi & penggabungan akun duplikat (*Duplicate Merge*), backup terenkripsi AES-256 harian, uji pemulihan (*test restore*), audit log medis, serta ekspor laporan harian & bulanan ke **Excel (`.xlsx`)** dan **PDF**.

---

## 🔑 Kredensial Uji Coba Demonstrasi

Pada halaman login (`/login`), Anda dapat langsung memilih tab dan menggunakan akun berikut:

| Peran | Username / No. HP | PIN / OTP | Halaman Tujuan |
|---|---|---|---|
| **Resepsionis (Front Desk)** | `resepsionis` | `123456` | `/petugas` |
| **Dokter Umum / Sp.PD (A)** | `dr_budi` | `123456` | `/klinis` |
| **Dokter Spesialis Anak (B)** | `dr_siti` | `123456` | `/klinis` |
| **Perawat Poliklinik** | `perawat_maya` | `123456` | `/klinis` |
| **Super Admin (IT)** | `admin` | `123456` | `/admin` |
| **Pasien Terdaftar** | `081234567890` | `123456` (OTP) | `/pasien` |

---

## 🚀 Cara Menjalankan Aplikasi

1. **Jalankan Mode Pengembangan:**
   ```bash
   npm run dev
   ```
   Buka peramban pada `http://localhost:3000`.

2. **Jalankan Mode Produksi:**
   ```bash
   npm run build
   npm start
   ```

---

## 🖨️ Cetak Dokumen Medis
- **Tiket Antrean Termal**: Klik tombol cetak tiket pada antrean checked-in untuk mencetak tiket slip.
- **Surat Rujukan Rumah Sakit Resmi**: Format standar rujukan RS poliklinik gigi lengkap dengan kop klinik, diagnosa klinis, alasan spesialis, data alergi, persetujuan DPJP, dan tanda tangan perawat/dokter.
