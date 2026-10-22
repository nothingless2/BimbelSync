# Product Requirements Document (PRD) - BimbelSync

## 1. Ringkasan Eksekutif
**Nama Produk:** BimbelSync (Sistem Orkestrasi Penjadwalan & Automasi Keuangan Bimbel)  
**Model Bisnis:** B2B Micro-SaaS (Berlangganan Bulanan, Semester, & Tahunan)  
**Teknologi Utama:** Next.js 16 (App Router), React 19, TypeScript, PostgreSQL 17 (Supabase), Prisma ORM 6, Tailwind CSS v4, Serwist PWA.  
**Tujuan Utama:**  
Menggantikan pembukuan manual (Excel/kertas) pada bimbingan belajar skala UMKM hingga menengah dengan sistem multi-tenant terpadu yang mengotomatisasi:
1. Resolusi penjadwalan kelas anti-bentrok (tutor dan ruangan).
2. Presensi QR dinamis anti-kecurangan dengan integrasi kamera mobile.
3. Siklus penagihan SPP bulanan otomatis (termasuk tagihan cicilan berjangka).
4. Pengelolaan materi pembelajaran dan E-Rapor evaluasi siswa berbasis pembobotan.
5. Penegakan batas kuota paket (quota gating) secara atomik dan bebas race condition.

---

## 2. Model Bisnis (Paket Berlangganan)

Platform menyediakan tiga tingkatan paket (Plans) berjenjang dengan pembatasan kuota dan fitur:

| Parameter & Fitur | Starter (Rp 99.000/bln) | Growth (Rp 199.000/bln) | Pro (Rp 399.000/bln) |
| :--- | :---: | :---: | :---: |
| **Target Skala Bimbel** | Bimbel rintisan, 1-2 tutor | Bimbel berkembang, full otomasi | Bimbel established, multi-program |
| **Maks. Siswa (`max_students`)** | 50 siswa | 200 siswa | 500 siswa |
| **Maks. Staf / Tutor (`max_staff`)** | 3 staf | 10 staf | 25 staf |
| **Maks. Ruangan (`max_rooms`)** | 2 ruangan | 6 ruangan | 15 ruangan |
| **Jadwal Kelas Anti-Bentrok** | ✅ Ya | ✅ Ya | ✅ Ya |
| **Presensi QR Dinamis** | ❌ (Presensi Manual) | ✅ Ya | ✅ Ya |
| **E-Rapor & Bobot Evaluasi Nilai** | ❌ Tidak | ✅ Ya | ✅ Ya |
| **Repositori Materi Belajar** | ❌ Tidak | ✅ Ya | ✅ Ya |
| **Pengingat Tagihan Email Otomatis** | ❌ Tidak | ✅ Ya | ✅ Ya |
| **Opsi Pembayaran Cicilan (Installment)** | ❌ Tidak (Hanya Lunas) | ❌ Tidak | ✅ Ya |
| **Log Audit Keamanan (Audit Trail)** | ❌ Tidak | ❌ Tidak | ✅ Ya |
| **Prioritas Dukungan Teknis** | Standar | Standar | ✅ Prioritas Utama |
| **Subdomain / Tenant URL Path** | ✅ Ya (`/[slug]`) | ✅ Ya (`/[slug]`) | ✅ Ya (`/[slug]`) |

### Skema Diskon Billing Cycle Platform
- **Bulanan (Monthly):** Tarif normal per bulan.
- **Semester (6 Bulan):** Diskon **10%** dari total tarif 6 bulan.
- **Tahunan (12 Bulan):** Diskon **17%** (setara dengan **hemat 2 bulan langganan gratis**).

---

## 3. Matriks Hak Akses (Role-Based Access Control / RBAC)

Sistem membedakan empat aktor utama dengan batasan hak akses yang tegas:

```
                    ┌─────────────────────────┐
                    │       SUPERADMIN        │
                    │  (Platform Management)  │
                    └────────────┬────────────┘
                                 │
     ┌───────────────────────────┴───────────────────────────┐
     ▼                                                       ▼
┌─────────────────────────┐                             ┌─────────────────────────┐
│       ADMIN BIMBEL      │◄── Tenant Level Scoped ───►│      TUTOR / GURU       │
│  (Owner & Operational)  │                             │ (Classroom & Academic)  │
└────────────┬────────────┘                             └────────────┬────────────┘
             │                                                       │
             └───────────────────────────┬───────────────────────────┘
                                         ▼
                            ┌─────────────────────────┐
                            │      SISWA / WALI       │
                            │  (Portal PWA Responsif) │
                            └─────────────────────────┘
```

### 3.1. Superadmin (Tim Internal BimbelSync)
- **Lingkup Rute:** `/superadmin`
- **Tanggung Jawab:**
  - Manajemen onboarding akademi bimbel baru (status: `TRIAL`, `ACTIVE`, `SUSPENDED`, `EXPIRED_TRIAL`).
  - Manajemen konfigurasi paket (`Plan`): harga, kuota siswa/staf/ruangan, flag fitur, dan persentase diskon.
  - Verifikasi dan rekonsiliasi tagihan platform (`PlatformInvoice`) dari transfer bank bimbel.
  - Pengelolaan data rekening pembayaran platform (`PlatformSetting`).
  - Monitoring audit log global dan pemantauan status rate limiting IP.
- **Batasan Keamanan:** Tidak memiliki akses langsung ke data operasional privat (daftar murid, rekap kas internal bimbel).

### 3.2. Admin (Pemilik Bimbel / Administrator Tenant)
- **Lingkup Rute:** `/[tenantSlug]/dashboard`
- **Tanggung Jawab:**
  - Akses penuh ke seluruh modul operasional tenant bimbelnya.
  - **Master Data:** CRUD Siswa, Staf/Tutor, Ruangan, dan Program (termasuk setting bobot evaluasi ujian `weight_exam` dan tugas `weight_homework`).
  - **Penjadwalan:** Pembuatan jadwal sesi dengan validasi anti-bentrok tutor dan ruangan secara atomik.
  - **Presensi:** Menampilkan layar QR dinamis untuk seluruh kelas bimbingan.
  - **Keuangan & Billing:** Pembuatan invoice SPP (Lunas atau Cicilan jika paket Pro), pengaturan rekening penerima, input server key Payment Gateway (BYOK), serta verifikasi transfer manual.
  - **Akademik & Materi:** Pengelolaan materi pembelajaran dan publikasi E-Rapor evaluasi siswa.
  - **Langganan:** Monitoring kuota terpakai, pengajuan upgrade paket, dan konfirmasi perpanjangan langganan bimbel ke platform.
  - **Audit Logs:** Memantau log aktivitas keamanan staf (khusus paket Pro).

### 3.3. Tutor (Tenaga Pengajar)
- **Lingkup Rute:** `/[tenantSlug]/dashboard` (Mode Tutor)
- **Tanggung Jawab:**
  - Melihat kalender jadwal mengajar pribadi dan daftar siswa pada rombel yang diajar.
  - Membuka layar QR Code presensi khusus kelas yang sedang diajar.
  - Mengunggah modul atau tautan materi pembelajaran untuk program yang dia ampu.
  - Menginput asesmen nilai siswa (Ujian, PR, Laporan Bulanan) dengan status `DRAFT` atau `PUBLISHED`.
- **Batasan Akses (Ditolak 403 / Menu Disembunyikan):**
  - Tidak memiliki akses ke Master Data Siswa, Staf, Ruangan, atau Program.
  - Tidak dapat melihat laporan keuangan, omset bimbel, maupun modul penagihan.
  - Tidak dapat mengubah konfigurasi sistem atau melihat audit logs.

### 3.4. Siswa & Wali Murid (Action-Only / Pasif)
- **Lingkup Rute:** `/[tenantSlug]/student` (PWA responsif di smartphone)
- **Tanggung Jawab:**
  - Login menggunakan username dan password yang digenerate akademi.
  - Wajib mengganti password saat login pertama (`must_change_password = true`).
  - Memindai QR Code presensi di kelas menggunakan kamera HP (`@yudiel/react-qr-scanner`).
  - Melihat riwayat kehadiran pribadi (Hadir, Izin, Alpa).
  - Mengunduh materi pembelajaran program yang diikuti.
  - Memeriksa E-Rapor nilai ujian dan catatan evaluasi yang telah berstatus `PUBLISHED`.
  - Melihat rincian tagihan SPP, mengunggah bukti transfer manual, atau membayar termin cicilan.
- **Batasan Akses:** Akses read-only yang terisolasi ketat hanya pada data pribadi siswa yang bersangkutan.

---

## 4. Kebutuhan Fungsional Utama

### Fase 1: Inisialisasi, Onboarding & Master Data
- **Onboarding Tenant Multi-Domain:** Registrasi bimbel baru menghasilkan `path_url` unik dan otomatis mendapatkan masa uji coba gratis (`TRIAL`) selama 14 hari.
- **Quota Gating Atomik:** Penegakan batas kuota siswa, staf, dan ruangan menggunakan fungsi backend `executeWithQuotaLock` dengan row-level lock PostgreSQL (`FOR UPDATE`) guna mencegah race condition pada registrasi konkuren.
- **Soft Delete Proteksi Relasional:** Penghapusan entitas master (Siswa, Ruangan, Staf, Program, Paket) menggunakan kolom `deleted_at` agar integritas data transaksi historis tidak rusak.

### Fase 2: Penjadwalan & Algoritma Anti-Bentrok
- **Validasi Anti-Bentrok Atomik:** Sistem memeriksa irisan waktu `(start_time, end_time)` pada database PostgreSQL untuk:
  1. `tutor_id` (seorang tutor tidak boleh mengajar di dua kelas berbeda pada waktu bersamaan).
  2. `room_id` (sebuah ruangan tidak boleh digunakan untuk dua kelas berbeda pada waktu bersamaan).
- **Pembatalan Terstruktur:** Jadwal yang batal tidak dihapus, melainkan diubah statusnya menjadi `CANCELLED` disertai kolom alasan `cancelled_reason`.

### Fase 3: Operasional, Presensi & Materi Belajar
- **Presensi QR Dinamis:** Token QR Code diperbarui secara dinamis (interval polling) guna mencegah kecurangan absensi titip absen atau pemindaian dari luar kelas.
- **Sanksi Izin Hangus (Alpa Otomatis):** Jika jumlah absensi izin siswa dalam sebulan melampaui `max_leave_per_month` yang ditentukan bimbel, sistem otomatis mengonversi absensi izin menjadi "Alpa" (sesi hangus).
- **Manajemen Materi Pembelajaran:** Repositori link modul dokumen, video, atau tautan materi per program belajar (tersedia mulai paket Growth).

### Fase 4: Keuangan, Tagihan & Siklus Billing
- **Opsi Pembayaran (Lunas vs Cicilan):** Admin bimbel dapat menerbitkan tagihan sekali lunas (`FULL`) atau memecah tagihan menjadi beberapa termin cicilan (`INSTALLMENT`) dengan tanggal jatuh tempo masing-masing (khusus paket Pro).
- **Automasi Tagihan Bulanan (Cron Job):** Endpoint `/api/cron/generate-invoices` terproteksi token `CRON_SECRET` untuk mengotomatisasi penerbitan tagihan SPP siswa pada tanggal awal bulan dengan tanggal jatuh tempo 10 hari.
- **Payment Gateway BYOK & Rekonsiliasi:** Bimbel dapat mengintegrasikan Server Key Midtrans/Xendit mereka sendiri atau menerima pembayaran transfer bank manual dengan bukti transfer yang diverifikasi staf.
- **Billing Langganan Platform:** Sistem menerbitkan `PlatformInvoice` untuk pembayaran langganan bimbel ke platform BimbelSync via transfer rekening platform.

### Fase 5: Evaluasi Siswa & E-Rapor
- **Pembobotan Nilai:** Program belajar mendukung konfigurasi persentase bobot ujian (`weight_exam`) dan tugas/PR (`weight_homework`).
- **Workflow Evaluasi Dua Tahap:** Tutor menyusun nilai dalam status `DRAFT`, dan mengubahnya menjadi `PUBLISHED` agar dapat dilihat oleh siswa dan wali murid.
- **Export & Cetak:** Fitur cetak rekapitulasi nilai dan E-Rapor PDF untuk laporan berkala siswa.

### Fase 6: Keamanan, Audit & Dashboard Analitik
- **Audit Trail Terintegrasi:** Pencatatan setiap aksi mutasi penting (login, perubahan kuota, verifikasi keuangan, perubahan nilai) pada tabel `AuditLog` dengan detail JSON (khusus paket Pro).
- **Dashboard Finansial:** Penyajian metrik keuangan, daftar piutang jatuh tempo (`UNPAID` dan `OVERDUE`), serta rekap kas harian/bulanan.
- **Dashboard Superadmin:** Ringkasan Monthly Recurring Revenue (MRR), distribusi status tenant, dan grafik pertumbuhan platform.

---

## 5. Non-Functional Requirements (NFR)

1. **Arsitektur Multi-Tenant:** Model basis data bersama (*shared-database, shared-schema*) dengan pemisahan logis berbasis `academy_id` pada setiap query Prisma dan verifikasi sesi middleware `requireTenantSession()`.
2. **Performa:** 
   - Waktu respon First Contentful Paint (FCP) < 1.5 detik pada koneksi 4G seluler.
   - Eksekusi query validasi bentrok jadwal < 200 ms.
3. **Keamanan Aplikasi (AppSec):**
   - **Otentikasi:** JWT berbasis HTTP-Only Cookie (`bimbelsync_session`) dengan proteksi `SameSite=Lax` dan masa kedaluwarsa 8 jam.
   - **Anti-PII Leak:** Alur verifikasi OTP login/reset password menggunakan token sesi sementara 10 menit dalam cookie terenkripsi, bukan parameter query URL.
   - **Brute Force Protection:** Pembatasan frekuensi login gagal melalui tabel `LoginRateLimit` berbasis IP.
   - **Dynamic Rendering Penuh:** Seluruh rute dashboard internal menggunakan SSR dinamis (`force-dynamic` / `no-store`) guna mencegah kebocoran data antar-tenant akibat browser atau CDN caching.
4. **Mobile & Offline-First (PWA):**
   - Progressive Web App berbasis `@serwist/next` yang terdaftar via service worker `public/sw.js`.
   - Web App Manifest (`manifest.ts`) memungkinkan instalasi langsung ke home screen smartphone siswa.
