# Design System & Architecture - BimbelSync

Dokumen ini mendefinisikan arsitektur sistem, strategi rendering, model keamanan multi-tenant, dan panduan desain antarmuka (Design System) yang diterapkan pada platform BimbelSync.

---

## 1. Arsitektur Teknis & Infrastruktur

### 1.1. Teknologi Utama
- **Framework Aplikasi:** Next.js 16 (App Router) dengan React 19 dan TypeScript.
- **Styling & CSS:** Tailwind CSS v4 (`@tailwindcss/postcss`) dengan konfigurasi CSS Variable-first di `src/app/globals.css`.
- **Database & ORM:** PostgreSQL 17 (dihosting di Supabase) dengan Prisma ORM 6.12.0.
  - Port 6543: Supabase PgBouncer Transaction Pooler (`DATABASE_URL`).
  - Port 5432: PostgreSQL Direct Connection (`DIRECT_URL`) untuk migrasi dan sesi transaksi panjang.
- **PWA & Offline Capability:** `@serwist/next` & `serwist` untuk service worker (`public/sw.js`) dan web app manifest (`src/app/manifest.ts`).
- **State Management & UI Utilities:**
  - `lucide-react` untuk iconography modern.
  - `framer-motion` untuk mikro-animasi transisi halaman dan kartu harga.
  - `recharts` untuk visualisasi grafik omset dan laporan piutang.
  - `sweetalert2` untuk dialog konfirmasi tindakan kritis.
  - `@yudiel/react-qr-scanner` & `qrcode.react` untuk modul presensi digital.

### 1.2. Struktur Rute (Route Segregation)
Arsitektur direktori `src/app` memisahkan empat domain pengguna utama melalui nested layouts:

```
src/app/
├── page.tsx                             # Landing page publik & pricing section
├── superadmin/                          # Portal Internal Platform
│   ├── (dashboard)/                     # Modul Superadmin (Academies, Plans, Billing, Settings)
│   ├── login/ & logout/                 # Otentikasi Superadmin
├── [tenantSlug]/                        # Lingkup Tenant Bimbel (Multi-Tenant Path)
│   ├── dashboard/                       # Portal Admin & Tutor
│   │   ├── master-data/                 # Siswa, Staf, Ruangan, Program
│   │   ├── schedules/                   # Kalender jadwal & layar QR
│   │   ├── evaluations/                 # Evaluasi nilai & E-Rapor
│   │   ├── materials/                   # Repositori materi belajar
│   │   ├── finance/                     # Invoices & manajemen kas
│   │   ├── subscription/                # Kuota paket & tagihan platform
│   │   └── audit-logs/                  # Log audit keamanan (Tier Pro)
│   ├── student/(protected)/             # Portal Siswa (Mobile-First PWA)
│   │   ├── dashboard/                   # Ringkasan siswa
│   │   ├── scan/                        # Kamera pemindai QR presensi
│   │   ├── attendances/                 # Riwayat kehadiran
│   │   ├── schedules/                   # Jadwal bimbingan aktif
│   │   ├── materials/                   # Materi belajar terdaftar
│   │   ├── evaluations/                 # Rekap nilai E-Rapor
│   │   └── invoices/                    # Tagihan & pembayaran cicilan
│   └── login/                           # Login staf & siswa per akademi
└── api/
    └── cron/generate-invoices/          # Automasi penagihan bulanan terproteksi token
```

### 1.3. Strategi Rendering & Caching
1. **Full Dynamic SSR (Server-Side Rendering):**  
   Seluruh halaman internal tenant (`/[tenantSlug]/dashboard` dan `/[tenantSlug]/student`) serta panel `superadmin` WAJIB di-render secara dinamis dengan header `Cache-Control: no-store, no-cache, must-revalidate`. Hal ini menghilangkan risiko data satu akademi bocor ke pengguna akademi lain akibat caching CDN atau browser.
2. **Client Components Terisolasi:**  
   Digunakan hanya pada komponen yang membutuhkan interaktivitas peramban:
   - Layar QR presensi dinamis (timer countdown dan refresh otomatis).
   - Kamera pemindai QR presensi mandiri siswa.
   - Saklar siklus pembayaran landing page (Bulanan, Semester, Tahunan).
3. **PWA Static Asset Caching:**  
   Service worker Serwist melakukan precache pada aset statis (font, icon, shell UI) sehingga portal siswa dapat terbuka secara instan di smartphone.

---

## 2. Pendekatan Multi-Tenant, Keamanan & Transaksi

### 2.1. Isolasi Tenant (Tenant Isolation)
- **Path-Based Routing:** Sub-jalur pertama URL `/[tenantSlug]/...` menjadi identifier tenant.
- **Middleware Guard (`middleware.ts`):**  
  Middleware membaca token JWT dari cookie `bimbelsync_session`, memvalidasi apakah `session.tenant_slug` sesuai dengan `tenantSlug` di URL. Jika ada upaya melintasi batas akademi (*Cross-Tenant IDOR*), pengguna langsung dialihkan kembali ke tenant asalnya.
- **Server Action Validation (`requireTenantSession`):**  
  Setiap mutasi server memanggil helper `requireTenantSession()`. Helper ini memverifikasi bahwa akun staf di database masih aktif (`deleted_at IS NULL`), akademi tidak dinonaktifkan, dan `session.academy_id` cocok 100% dengan database.

### 2.2. Otentikasi & Sesi
- **Teknologi:** JSON Web Token (JWT) yang dienkripsi menggunakan library `jose` (algoritma HS256).
- **Penyimpanan:** Disimpan dalam HTTP-Only Cookie (`bimbelsync_session`) dengan flag `SameSite=Lax`, `Secure`, dan masa kedaluwarsa 8 jam.
- **Session Revocation:** Integer `session_version` pada tabel `Superadmin` digunakan untuk membatalkan seluruh sesi login lama secara instan saat terjadi pergantian password.
- **Anti-PII Leak pada Verifikasi OTP:**  
  Alur verifikasi OTP login staf atau reset password menggunakan token terenkripsi dalam cookie terpisah (`bimbelsync_otp_pending`) yang berdurasi 10 menit. Hal ini memastikan parameter sensitif (email, nomor telepon) tidak pernah terpapar di query string URL peramban.
- **Brute-Force Protection:**  
  Pencatatan frekuensi gagal login pada tabel `LoginRateLimit` berbasis alamat IP. Jika ambang batas terlampaui, akun diisolasi sementara hingga waktu `locked_until`.

### 2.3. Transaksi Atomik & Quota Concurrency
- Penegakan batas kuota siswa, staf, dan ruangan menggunakan utilitas `executeWithQuotaLock` di `src/lib/subscription.ts`.
- Fungsi ini mengunci baris `Academy` menggunakan query PostgreSQL `SELECT ... FOR UPDATE` di dalam transaksi Prisma. Mekanisme ini menjamin bahwa pendaftaran siswa atau penambahan staf yang terjadi secara bersamaan (konkuren) tidak akan menembus batas kuota paket.

---

## 3. Design System & Panduan Visual

### 3.1. Palet Warna (Tailwind Semantic Colors)

| Peran Warna | Kode Warna / Token | Penggunaan UI |
| :--- | :--- | :--- |
| **Primary Blue** | `#2563EB` (`blue-600`) | Tombol aksi primer (CTA), header aktif, link navigasi, brand logo. |
| **Accent Emerald** | `#059669` (`emerald-600`) | Indikator status Lunas (`PAID`), presensi Hadir (`PRESENT`), alert sukses. |
| **Accent Amber** | `#D97706` (`amber-600`) | Status Menunggu Pembayaran (`UNPAID`), Izin (`EXCUSED`), peringatan jatuh tempo. |
| **Accent Rose/Red** | `#DC2626` (`red-600`) | Status Jatuh Tempo (`OVERDUE`), Alpa (`ABSENT`), pembatalan, bentrok jadwal. |
| **Accent Indigo** | `#6366F1` (`indigo-500`) | Identitas paket Pro, kartu E-Rapor siswa, highlight evaluasi nilai. |
| **Neutral Slate** | `#0F172A` s.d. `#F8FAFC` | Latar belakang, kartu panel, teks judul, pembatas tabel (*borders*). |

### 3.2. Tipografi & Representasi Data
- **Font Utama:** Sans-serif modern (Inter / Roboto) dari Google Fonts.
- **Tabular Figures:** Seluruh kolom angka finansial (harga, sisa kuota, nominal tagihan) menggunakan font monospace atau `tabular-nums` agar sejajar secara vertikal pada tabel data.
- **Format Mata Uang:** Standar Rupiah Indonesia dengan pemisah ribuan titik (contoh: `Rp 199.000`).

### 3.3. Komponen UI Standar
1. **Sidebar Navigation (Desktop):**  
   Navigasi tetap di sebelah kiri dengan indikator badge status langganan bimbel dan pembeda visual antara mode Admin dan mode Tutor.
2. **Bottom Navigation Bar (Portal Siswa Mobile):**  
   Navigasi bawah yang ramah sentuhan jempol (*thumb-friendly*) pada perangkat smartphone dengan pintasan cepat ke: Beranda, Scan QR, Jadwal, Nilai, dan Tagihan.
3. **Action Menu Overlay:**  
   Dropdown aksi tabel menggunakan modal / floating overlay dengan z-index tinggi guna mencegah terpotong oleh batas kontainer tabel (*anti-clipping container overflow*).
4. **Modal Konfirmasi Destruktif:**  
   Menggunakan dialog `sweetalert2` yang di-styling selaras dengan palet tema untuk konfirmasi pembatalan sesi, penonaktifan siswa, atau penghapusan ruangan.

---

## 4. Pola Retensi & Manajemen Data

| Kategori Entitas | Contoh Model Prisma | Pendekatan Database | Rationale & Penanganan |
| :--- | :--- | :--- | :--- |
| **Master & Identitas** | `Superadmin`, `Academy`, `Staff`, `Student`, `Program`, `Room`, `Plan` | **Soft Delete** (`deleted_at`) | Baris data tidak dihapus secara fisik (`DELETE`). Query aktif selalu menyertakan filter `deleted_at: null`. Menjaga integritas foreign key pada laporan historis. |
| **Transaksional & Event** | `Schedule`, `Enrollment`, `Invoice`, `Installment`, `PlatformInvoice` | **Status Eksplisit** (Enum) | Tidak dihapus. Perubahan status menggunakan status terstruktur: `CANCELLED` (jadwal), `WITHDRAWN` (pendaftaran), `VOID` (tagihan batal). |
| **Asesmen & Akademik** | `StudentEvaluation` | **Draft-to-Publish Lifecycle** | Nilai dibuat dalam status `DRAFT` sebelum dipublikasikan (`PUBLISHED`) untuk verifikasi tutor. |
| **Append-Only Logs** | `Attendance`, `AuditLog` | **Immutable (Tidak Dapat Diubah)** | Data presensi dan log audit keamanan dicatat secara kronologis dan tidak menyediakan antarmuka edit/hapus. |
