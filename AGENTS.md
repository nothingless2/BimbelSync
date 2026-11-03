<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# BimbelSync — AI Agent Engineering Guide

Dokumen panduan arsitektur, standar penulisan kode, konvensi lingkungan, dan aturan eksekusi untuk agen AI (Antigravity/Gemini) yang bekerja pada repositori **BimbelSync**.

---

## 1. Ikhtisar Sistem & Tech Stack

- **Nama Produk:** BimbelSync — Sistem Orkestrasi Penjadwalan & Otomasi Keuangan Bimbel (B2B Micro-SaaS).
- **Framework Utama:** Next.js 16.3.3 (App Router), React 19.2.8, TypeScript.
- **Basis Data & ORM:** PostgreSQL 17 (Supabase) dengan Prisma ORM 6.12.0.
  - Pooler URL: Port 6543 (`DATABASE_URL`).
  - Direct URL: Port 5432 (`DIRECT_URL`) untuk migrasi skema.
- **CSS & UI:** Tailwind CSS v4, Lucide React, Framer Motion, Recharts.
- **PWA & Offline:** `@serwist/next` & `serwist` untuk service worker (`public/sw.js`).
- **Otentikasi & Sesi:** JWT via `jose`, HTTP-Only cookie `bimbelsync_session` (HS256).

---

## 2. Aturan Lingkungan & Eksekusi Perintah (Kritis di Windows)

> [!CAUTION]
> **Drive C memiliki keterbatasan ruang disk bebas (0 bytes cache free).**
> - **JANGAN PERNAH** menjalankan perintah `npx` (misal `npx tsc` atau `npx prisma`), karena `npx` akan mencoba menulis ke cache npm di Drive C (`%LOCALAPPDATA%\npm-cache`) dan menyebabkan kegagalan fatal `ENOSPC`.
> - **Gunakan executable lokal di Drive D:**
>   - Typecheck: `cmd /c "node_modules\.bin\tsc.cmd --noEmit"`
>   - Next.js Build: `cmd /c "node_modules\.bin\next.cmd build --webpack"`
>   - Prisma CLI: `cmd /c "node_modules\.bin\prisma.cmd ..."`
> - **Pembersihan Otomatis `public/sw.js`:** Build Next.js akan memperbarui `public/sw.js`. Setelah build verifikasi selesai, selalu jalankan `cmd /c "git checkout public/sw.js"` agar commit tree tetap bersih.

---

## 3. Struktur Direktori & Segregasi Rute

```
src/
├── app/
│   ├── page.tsx                             # Landing page publik & pricing section
│   ├── register/ & onboarding/              # Alur pendaftaran bimbel baru
│   ├── superadmin/                          # Portal Internal Platform
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/                   # KPI Cards Platform (MRR, Pendapatan, Piutang, Status Bimbel)
│   │   │   ├── academies/                   # Manajemen Tenant & Onboarding Bimbel
│   │   │   ├── plans/                       # Konfigurasi Paket & Diskon Dinamis
│   │   │   ├── billing/                     # Platform Invoices, Mutasi Transfer & Verifikasi
│   │   │   ├── reports/                     # Laporan Keuangan Platform, Grafik & Tabel Transaksi
│   │   │   └── audit-logs/                  # Jejak Audit Superadmin
│   │   └── login/ & logout/
│   ├── [tenantSlug]/                        # Lingkup Multi-Tenant Scoped
│   │   ├── dashboard/                       # Portal Operasional Admin & Tutor
│   │   │   ├── master-data/                 # Siswa, Staf, Ruangan, Program
│   │   │   ├── schedules/                   # Kalender Jadwal Kelas & Layar QR Dinamis
│   │   │   ├── evaluations/                 # Asesmen Nilai Siswa, Bobot Nilai & E-Rapor
│   │   │   ├── materials/                   # Repositori Modul Materi Pembelajaran
│   │   │   ├── finance/                     # Tagihan SPP Siswa, Termin Cicilan & Kas
│   │   │   ├── subscription/                # Kuota Paket & Riwayat Tagihan Platform
│   │   │   └── settings/email/              # Konfigurasi BYO SMTP Kustom
│   │   ├── student/(protected)/             # Portal Siswa (Mobile PWA)
│   │   └── login/
│   └── api/cron/                            # Automasi penagihan bulanan terproteksi token
├── components/
│   ├── landing/                             # Komponen landing page (pricing, showcase, hero)
│   ├── modals/                              # Dialog & modal operasional sistem
│   └── ui/                                  # Komponen UI primitif (CustomSelect, Pagination, dll.)
└── lib/
    ├── prisma.ts                            # Singleton Prisma Client
    ├── auth.ts & session.ts                 # Enkripsi JWT & sesi multi-role
    ├── pricing.ts                           # Kalkulasi harga paket & diskon terpusat
    └── subscription.ts                      # Quota gating & kunci konkurensi (FOR UPDATE)
```

---

## 4. Konvensi Paket, Harga & Diskon Dinamis

Seluruh kalkulasi biaya berlangganan platform **WAJIB** menggunakan modul terpusat [`src/lib/pricing.ts`](file:///d:/bimbelsync/src/lib/pricing.ts):
- **Bulanan (1 Bulan):** Tarif dasar paket per bulan (`plan.price`).
- **Semester (6 Bulan):** Diskon persentase `plan.discount_6_months` (default 10%), pembulatan ribuan genap.
- **Tahunan (12 Bulan):** Diskon persentase dinamis `plan.discount_12_months` (default 17%), pembulatan ribuan genap.
- **Formula Resmi:**
  $$\text{Total Tagihan} = \text{Harga Bulanan} \times \text{Durasi Bulan} \times \left(1 - \frac{\text{Diskon \%}}{100}\right)$$
- **Tampilan Badge UI:** Gunakan format persentase dinamis (misal: `HEMAT 10%`, `HEMAT 17%`). Hindari teks statis seperti *"Hemat 2 Bulan"* agar sinkron otomatis saat Superadmin mengubah diskon di menu *Plans*.

---

## 5. Standar UI/UX & Design System

1. **Palet Warna Semantic:**
   - Biru Primer: `blue-600` (Aksi utama, tombol CTA, kartu revenue).
   - Hijau Emerald: `emerald-500` / `emerald-600` (Status Lunas `PAID`, Presensi Hadir, ARPU, diskon tahunan).
   - Amber/Kuning: `amber-500` / `amber-600` (Status `UNPAID`, Trial, cicilan).
   - Merah Rose: `rose-500` / `rose-600` (Status `OVERDUE`, Piutang, Churn, Alpa).
2. **Visualisasi Grafik (Recharts):**
   - Wajib memberikan `margin={{ top: 10, right: 10, bottom: 5, left: 15 }}`.
   - Sumbu Y mata uang kiri wajib menggunakan `width={80}`, `dx={-4}`, dan `tickFormatter={formatCompactRupiah}` (misal: `Rp 6 jt`, `Rp 4,5 jt`, `Rp 500 rb`).
   - Sumbu Y unit kanan wajib `width={35}`, `dx={4}`, dan `allowDecimals={false}`.
   - Sediakan indikator warna (legend dots) di header grafik agar dual-axis langsung dipahami pengguna.
3. **Penyajian Tabel Data:**
   - Tabel transaksi terstandarisasi dengan header uppercase tebal, status pill berwarna kontras tinggi, input pencarian *real-time*, dan komponen `<Pagination />`.

---

## 6. Integritas Keamanan & Transaksi Database

- **Multi-Tenant Isolation:** Selalu sertakan `academy_id` dalam setiap klausa `where` database pada modul tenant bimbel.
- **Atomic Quota Gating:** Penambahan siswa/staf/ruangan wajib dibungkus dalam `executeWithQuotaLock` yang mengunci baris `Academy` dengan query `SELECT ... FOR UPDATE` di dalam transaksi Prisma.
- **Soft Delete:** Entitas master (`Academy`, `Staff`, `Student`, `Program`, `Room`, `Plan`) menggunakan `deleted_at: null`. Jangan lakukan hard delete fisik (`DELETE`).
- **Maintenance Integrity:** Pertahankan seluruh komentar kode dan docstring yang sudah ada di codebase.
