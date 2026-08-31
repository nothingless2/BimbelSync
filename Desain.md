# Design System & Architecture - BimbelSync

## 1. Arsitektur Teknis & Infrastruktur
- **Framework Utama:** Next.js (menggunakan App Router) dengan TypeScript. Pendekatan Nested Layout sangat cocok untuk memisahkan 3 lingkungan kerja utama:
  - `/internal` (Superadmin Panel)
  - `/dashboard` (Admin & Tutor Portal)
  - `/siswa` (Portal Siswa)
- **Strategi Rendering (Per Rute):**
  - **SSR (Dynamic Rendering):** Halaman Dashboard Admin/Tutor, Portal Siswa, dan halaman internal Superadmin WAJIB di-render secara dinamis. Hal ini memastikan isolasi tenant dan mencegah caching yang dapat melayani data satu akademi ke pengguna akademi lain.
  - **Client Component:** Digunakan khusus pada layar QR Presensi dengan implementasi interval polling per 15 detik.
  - **SSG / ISR:** Digunakan pada Landing Page publik BimbelSync (termasuk halaman paket harga).
- **State Management:** Zustand untuk state lokal di sisi client.
- **ORM & Database:** Prisma ORM dengan database PostgreSQL.
- **Infrastruktur API:** Vercel Serverless Functions.
- **Notifikasi & Pesan:** WhatsApp Gateway (WAG) untuk tagihan, cicilan, password generator siswa. Email via Resend (untuk undangan Tutor dan reset password Staff).
- **Payment Gateway:** Midtrans / Xendit dengan model BYOK (Bring Your Own Key) untuk pembayaran Siswa ke Bimbel, serta key milik platform untuk pembayaran berlangganan Bimbel ke BimbelSync.

## 2. Pendekatan Multi-Tenant
- **Isolasi Tenant:** 
  - Middleware Next.js bertugas membaca subdomain atau `path_url` akademi.
  - Middleware mencocokkan URL dengan `academy_id` dan menyuntikkannya ke dalam request header untuk pengamanan di layer API/Server Action.
- **Skema Database:** Multi-tenant shared-database, shared-schema. Isolasi data ditangani secara ketat di tingkat basis data menggunakan fitur **PostgreSQL Row-Level Security (RLS)**.
- **Otentikasi (Sesi Terpisah):** JWT via HTTP-Only Cookies (SameSite=Lax) dengan masa kedaluwarsa 30 hari. Sesi dibedakan secara tegas antara Staff, Superadmin, dan Siswa.

## 3. Design System & Branding
Tampilan platform ditargetkan bernuansa B2B modern, padat informasi (data-centric), namun tidak mengorbankan estetika dan kemudahan navigasi.

### 3.1. Palet Warna (Wajib Dipatuhi)
- **Primary Blue (`#2563EB`):** Digunakan untuk header utama, link aktif, dan CTA primer (Tombol Simpan, dll).
- **Accent Green (`#16A34A`):** Indikator positif (Status Lunas, QR berhasil dipindai, alert sukses).
- **Accent Red (`#DC2626`):** Indikator negatif/peringatan (Status Tunggakan/Overdue, Jadwal Bentrok, alert gagal/alpa).
- **Neutral White (`#FFFFFF`):** Warna latar belakang utama halaman.
- **Soft Gray (`#F3F4F6`):** Digunakan untuk background panel/kartu, baris tabel alternate, serta pembatas (border).

### 3.2. Tipografi
- **Font Utama:** Sans-serif modern (direkomendasikan **Inter** atau **Roboto** dari Google Fonts) agar terbaca jelas pada tabel berisi angka/uang.

### 3.3. Prinsip Layout & Breakpoints
- **Mobile (`≤640px`):** Tabel responsif dengan horizontal scrolling atau stack cards.
- **Tablet (`≤1024px`):** Layout penyesuaian sidebar (collapsible).
- **Desktop (`>1024px`):** Mode penuh dengan navigasi tetap (fixed sidebar) di sisi kiri.

## 4. Pola Manajemen Data (Status vs Soft Delete)

BimbelSync menggunakan dua pendekatan berbeda dalam menangani "penghapusan" atau pembatalan data, agar integritas rekam jejak tetap terjaga:

| Kategori | Contoh Entitas | Pendekatan | Penjelasan |
|---|---|---|---|
| **Master Data & Identitas** | Superadmin, Academy, Staff, Students, Programs, Rooms, Plans | **Soft Delete** (`deleted_at`) | Data tetap di database, namun di-filter dari query aktif. Mencegah error foreign key. |
| **Transaksional & Event** | Schedules, Enrollments, Invoices, Installments, Platform_Invoices | **Status Eksplisit** (Enum) | Tidak dihapus. Jadwal dibatalkan diubah statusnya menjadi `CANCELLED`. Tagihan batal menjadi `VOID`. Enrollment batal menjadi `WITHDRAWN`. |
| **Append-Only Log** | Attendances (Kehadiran) | **Immutable** | Data presensi tidak pernah bisa diubah atau dihapus secara langsung. |
