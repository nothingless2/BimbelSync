# Product Requirements Document (PRD) - BimbelSync

## 1. Ringkasan Eksekutif
**Nama Produk:** BimbelSync (Sistem Orkestrasi Penjadwalan & Automasi Keuangan Bimbel)
**Model Bisnis:** B2B Micro-SaaS (Berlangganan Bulanan)
**Tujuan Utama:** 
Menggantikan pembukuan manual (Excel/kertas) pada bimbingan belajar skala UMKM dengan sistem yang mengotomatisasi resolusi jadwal anti-bentrok, presensi QR dinamis, dan siklus penagihan otomatis (termasuk tagihan cicilan). Arsitektur dirancang untuk mengisolasi data per instansi klien guna menjamin privasi dan performa.

## 2. Model Bisnis (Paket Berlangganan)
Platform menawarkan tiga tingkatan paket (Plans) untuk mengakomodasi berbagai skala bisnis bimbel:

| Fitur | Starter (Rp99.000/bln) | Growth (Rp299.000/bln) | Pro (Rp599.000/bln) |
|---|---|---|---|
| Target | Bimbel rintisan, 1-2 tutor | Bimbel menengah, full otomasi | Bimbel besar / multi-cabang |
| Maks. Siswa | 50 | 200 | Unlimited |
| Maks. Staff | 3 (termasuk Admin) | 10 | Unlimited |
| Maks. Ruangan | 2 | 5 | Unlimited |
| Jadwal Anti-bentrok, QR Absen | Ya | Ya | Ya |
| Payment Gateway (Midtrans/Xendit) | Tidak (manual/cash) | Ya | Ya |
| Opsi Cicilan | Tidak | Ya | Ya |
| Custom Branding | Tidak | Tidak | Ya |
| Priority Support | Tidak | Tidak | Ya |

## 3. Matriks Hak Akses (RBAC)

### 3.1. Superadmin (Tim Internal BimbelSync)
- **Akses:** Platform-level (di luar operasional tenant).
- **Tugas Utama:**
  - Onboarding akademi baru.
  - Mengelola paket berlangganan (Plans) dan batasan fitur.
  - Men-generate dan memverifikasi tagihan bulanan ke bimbel (Platform_Invoices).
  - Melihat laporan keuangan platform & metrik agregat.
  - **Larangan:** Tidak dapat mengakses data operasional/finansial di dalam masing-masing akademi secara default (kecuali untuk keperluan support dengan izin eksplisit).

### 3.2. Admin (Pemilik Bimbel / Superuser Tenant)
- **Akses:** Penuh di dalam lingkup akademinya (tenant).
- **Tugas Utama:**
  - CRUD Master Data (Siswa, Program, Ruangan, Jadwal).
  - Mengatur harga & durasi program (`duration_months`), batas izin siswa (`max_leave_per_month`).
  - Mengatur konfigurasi Payment Gateway dan opsi bayar (Lunas/Cicilan) sesuai batasan paket.
  - Menampilkan layar QR presensi (semua kelas).
  - Memantau Dashboard Keuangan (daftar piutang, status invoice).
  - Rekonsiliasi pembayaran manual.
  - Mengelola akun Staff (undang tutor) & Siswa (generate password via WA).

### 3.3. Tutor (Pengajar)
- **Akses:** Terbatas pada kelas yang diajar.
- **Tugas Utama:**
  - Melihat jadwal mengajar pribadi & daftar siswa di kelas.
  - Menampilkan QR presensi untuk kelas sendiri.
  - Melihat rekap kelas dan estimasi honorarium.
  - **Larangan:** Tidak ada akses ke master data siswa/ruangan, fitur keuangan akademi, maupun konfigurasi sistem. Ditolak (403) jika mencoba.

### 3.4. Siswa (Pasif / Action-Only)
- **Akses:** Portal ringan tersendiri.
- **Tugas Utama:**
  - Memindai QR Code untuk presensi via smartphone.
  - Menerima notifikasi tagihan/cicilan otomatis via WhatsApp.
  - Login dengan username dan password yang di-generate sistem (wajib reset saat login pertama `must_change_password`).
  - **Larangan:** Akses read-only terhadap data pribadinya sendiri (jadwal, tagihan, presensi). Tidak bisa akses data siswa lain.

## 4. Kebutuhan Fungsional Utama

### Fase 1: Inisialisasi & Master Data
- **Manajemen Entitas:** Program, Ruangan, Tarif, durasi program (reguler vs paket intensif berjangka).
- **Feature Gating (Pembatasan Paket):** Pengecekan limit (Siswa, Staff, Ruangan, Payment Gateway, Opsi Cicilan) di sisi backend berdasarkan paket (Plan) yang aktif saat create data baru. Apabila terkena limit, muncul prompt upgrade paket.

### Fase 2: Penjadwalan
- **Algoritma Anti-Bentrok:** Penolakan pembuatan jadwal jika `tutor_id` atau `room_id` mengalami irisan waktu (atomik di level database PostgreSQL exclusion constraint).

### Fase 3: Operasional
- **Presensi QR Dinamis:** QR diperbarui periodik (polling 15 detik) untuk mencegah kecurangan absen dari jauh.
- **Sanksi Sesi Hangus (Alpa):** Jika izin siswa melebihi `max_leave_per_month`, sistem otomatis menolak absensi "Izin" dan mengubahnya menjadi "Alpa" (sesi hangus).

### Fase 4: Keuangan & Tagihan
- **Opsi Pembayaran (Lunas vs Cicilan):** Admin bisa memecah tagihan besar (Invoices) menjadi beberapa cicilan (Installments) dengan due date dan status terpisah, jika diizinkan oleh plan langganan.
- **Automasi Invoice:** Cron job menghasilkan tagihan bulanan (termasuk denda/prorata) dan notifikasi dikirim otomatis via WhatsApp Gateway.
- **Payment Gateway (BYOK):** Admin Bimbel dapat menyambungkan kunci Midtrans/Xendit mereka sendiri. Sistem menerima webhook untuk otomatis mengubah status menjadi "Lunas" pada tingkat Invoice atau tingkat Installment.
- **Rekonsiliasi Manual:** Admin bisa menandai pembayaran Lunas secara manual, disertai jejak audit (`verified_by_staff_id`).

### Fase 5: Pelaporan & Dashboard
- **Dashboard Keuangan Admin (Daftar Piutang):** Menampilkan daftar Invoice/Installment yang statusnya UNPAID atau OVERDUE, filter lama tunggakan, progress cicilan.
- **Dashboard Superadmin:** Menampilkan laporan keuangan platform, MRR (Monthly Recurring Revenue) per paket, total tunggakan bimbel, riwayat tagihan per akademi.

## 5. Non-Functional Requirements (NFR)
- **Arsitektur Multi-Tenant:** Shared-database, shared-schema dengan proteksi PostgreSQL Row-Level Security (RLS).
- **Performa:** FCP < 1.5s di koneksi 4G. Waktu eksekusi query jadwal anti-bentrok < 300ms.
- **Keamanan (AppSec):** 
  - Dynamic Rendering (SSR) penuh pada halaman internal tenant untuk mencegah kebocoran data lewat cache.
  - Validasi Signature Webhook.
  - Rate Limiting pada generator invoice dan sistem login.
- **Backup:** `pg_dump` otomatis setiap hari via GitHub Actions.
