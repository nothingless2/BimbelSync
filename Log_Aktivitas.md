# Log Aktivitas & Dokumentasi Proyek - BimbelSync

File ini mencatat secara kronologis semua perintah terminal (`cmd`), instalasi dependensi, dan perubahan arsitektur utama dari awal hingga akhir proyek. 
Aturan: 
1. Setiap perintah dijalankan melalui `cmd` (Command Prompt Windows).
2. Catat status keberhasilan dan ringkasan apa yang diubah.

---

## [Tahap 0] Perencanaan Dokumen
- **Aksi:** Membuat file `PRD.md`, `Desain.md`, dan `ERD.md` berdasarkan requirement (Acceptance Criteria).
- **Status:** ✅ Selesai.

---

## [Tahap 1] Inisialisasi Proyek Next.js
- **Aksi:** Mengeksekusi `create-next-app`, mengatur palet warna di `tailwind.config.ts`, dan membersihkan boilerplate bawaan.
- **Tech Stack:** Next.js 16.3.3, React 19.2.8, TypeScript, Tailwind CSS v4.
- **Status:** ✅ Selesai.

---

## [Tahap 2] Setup Database & Prisma
- **Aksi:** Instalasi Prisma ORM 6.12.0, menyalin ERD ke `schema.prisma`, dan eksekusi `npx prisma db push`.
- **Database:** PostgreSQL 17 (Supabase) dengan dual-port (6543 PgBouncer, 5432 Direct).
- **Models yang dibuat (16 model):**
  - `Superadmin` — Pengelola platform global.
  - `AuditLog` — Jejak audit keamanan.
  - `Plan` — Paket berlangganan (Starter/Growth/Pro) dengan fitur gating.
  - `Academy` — Entitas tenant/bimbel multi-tenant.
  - `Room` — Ruangan kelas per akademi.
  - `Staff` — Staf/Tutor dengan role ADMIN atau TUTOR.
  - `Student` — Data siswa per akademi.
  - `Program` — Program bimbingan (dengan bobot evaluasi `weight_exam`/`weight_homework`).
  - `Schedule` — Jadwal kelas dengan status SCHEDULED/CANCELLED.
  - `Attendance` — Presensi siswa per sesi.
  - `Enrollment` — Pendaftaran siswa ke program (dengan alasan withdraw).
  - `Invoice` — Tagihan SPP siswa (FULL/INSTALLMENT).
  - `InvoiceItem` — Rincian item tagihan.
  - `Installment` — Cicilan pembayaran per termin.
  - `PlatformInvoice` — Tagihan langganan platform ke akademi.
  - `LearningMaterial` — Materi belajar (DOCUMENT_LINK/VIDEO_LINK/OTHER_LINK).
  - `StudentEvaluation` — Evaluasi nilai siswa (EXAM/HOMEWORK/MONTHLY_REPORT).
  - `LoginRateLimit` — Rate limiter login berbasis IP.
  - `PlatformSetting` — Pengaturan global platform (key-value).
- **Enum yang dibuat:** `SubscriptionStatus`, `EvaluationStatus`, `StaffRole`, `ScheduleStatus`, `AttendanceStatus`, `EnrollmentStatus`, `WithdrawnReason`, `PaymentOption`, `PaymentMethod`, `PaymentStatus`, `MaterialType`, `EvaluationType`.
- **Seeder (`prisma/seed.ts`):** Seed data 3 paket (Starter/Growth/Pro), 1 Superadmin, dan 1 Academy demo.
- **Status:** ✅ Selesai. Database berhasil dibuat.

---

## [Tahap 3] Multi-Tenant, Middleware & Autentikasi
- **Aksi:** Instalasi `jose` untuk JWT, pembuatan `src/lib/auth.ts` & `src/lib/session.ts`, dan pengaturan proteksi routing di `middleware.ts`.
- **Fitur Keamanan yang Diimplementasikan:**
  1. **JWT Authentication** (`src/lib/auth.ts`) — Enkripsi/dekripsi token dengan `jose`, membaca `JWT_SECRET` dari `.env`.
  2. **Session Management** (`src/lib/session.ts`, ~10KB) — Pembuatan sesi, verifikasi, dan manajemen cookie untuk 3 tipe user (Superadmin, Staff, Student).
  3. **Middleware Routing Protection** (`middleware.ts`) — Proteksi rute `/superadmin/*`, `/[tenantSlug]/dashboard/*`, dan `/[tenantSlug]/student/*`.
  4. **Anti-IDOR (Cross-Tenant)** — Middleware membaca `tenant_slug` dari JWT dan memvalidasi terhadap URL path.
  5. **Login Rate Limiter** — Model `LoginRateLimit` berbasis IP untuk mencegah brute-force.
  6. **OTP Email Verification** (`src/lib/email.ts`) — Pengiriman OTP via Brevo SMTP / Gmail SMTP / Resend API dengan template HTML profesional.
  7. **Password Hashing** — Menggunakan `bcryptjs` untuk hashing password staff & student.
  8. **Cache Prevention** — Header `no-store, no-cache, must-revalidate` pada respons middleware untuk mencegah browser back setelah logout.
- **Status:** ✅ Selesai.

---

## [Tahap 4] Landing Page & Halaman Publik
- **Aksi:** Membuat landing page publik dan halaman-halaman informasi.
- **Halaman yang Dibuat:**
  1. **Landing Page** (`src/app/page.tsx`, ~25KB) — Hero section dengan animasi, fitur showcase, pricing section dinamis (dari database), testimonial, FAQ, metrics counter, dan final CTA.
  2. **Halaman Register** (`src/app/register/`) — Pendaftaran akademi baru dengan pemilihan paket.
  3. **Halaman Verify OTP** (`src/app/verify-otp/`) — Form verifikasi OTP 6 digit dengan auto-submit dan countdown timer.
  4. **Halaman Onboarding** (`src/app/onboarding/`) — Wizard setup awal akademi (nama bimbel, slug URL, data admin pertama).
  5. **Halaman Login Tenant** (`src/app/login/`) — Login page untuk staf dan siswa bimbel.
  6. **Halaman Privacy Policy** (`src/app/privacy/`) — Kebijakan privasi lengkap.
  7. **Halaman Terms of Service** (`src/app/terms/`) — Syarat dan ketentuan penggunaan.
  8. **Error Pages** — `error.tsx`, `not-found.tsx`, `forbidden.tsx`, `unauthorized.tsx`, `global-error.tsx`.
- **Komponen Landing Page:**
  - `LandingHeader` — Navbar sticky dengan navigasi dan CTA.
  - `PricingSection` — Kartu harga dinamis dengan toggle billing cycle dan badge rekomendasi.
  - `Showcase` — Showcase fitur utama dengan gambar ilustrasi.
  - `Testimonials` — Slider testimoni pengguna.
  - `Metrics` — Counter animasi angka pencapaian.
  - `FAQ` — Accordion tanya-jawab.
  - `FinalCTA` — Section CTA akhir dengan tombol WhatsApp.
- **UI Primitif yang Dibuat:**
  - `CustomCursor` — Kursor animasi custom.
  - `MagneticButton` — Tombol dengan efek magnet hover.
  - `TextReveal` — Animasi reveal teks saat scroll.
  - `TextRotator` — Teks berganti otomatis (typewriter).
  - `ParallaxElement` — Elemen dengan efek parallax scroll.
  - `FadeInView` — Animasi fade-in saat masuk viewport.
- **SEO:** Metadata OpenGraph, Twitter Card, `robots.ts`, `sitemap.ts`, `manifest.ts` (PWA).
- **Status:** ✅ Selesai.

---

## [Tahap 5] Portal Superadmin
- **Aksi:** Membuat panel administrasi internal platform BimbelSync.
- **Halaman yang Dibuat:**
  1. **Login Superadmin** (`superadmin/login/`) — Form login khusus superadmin.
  2. **Logout Superadmin** (`superadmin/logout/`) — Proses logout dan hapus cookie sesi.
  3. **Dashboard Superadmin** (`superadmin/(dashboard)/dashboard/`) — Statistik platform (total akademi, pendapatan, tagihan), grafik omset (Recharts).
  4. **Manajemen Akademi** (`superadmin/(dashboard)/academies/`) — Daftar semua akademi terdaftar dengan CRUD, arsip, halaman detail (`[id]/`), filter, dan pencarian.
  5. **Manajemen Paket/Plans** (`superadmin/(dashboard)/plans/`) — CRUD paket berlangganan, pengaturan kuota, fitur gating, dan diskon billing cycle.
  6. **Billing Platform** (`superadmin/(dashboard)/billing/`) — Daftar tagihan platform ke akademi, verifikasi pembayaran manual, generate tagihan otomatis.
  7. **Manajemen User Superadmin** (`superadmin/(dashboard)/users/`) — CRUD akun superadmin, dengan profil (`profile/`).
  8. **Laporan Platform** (`superadmin/(dashboard)/reports/`) — Laporan omset dan statistik platform.
  9. **Audit Log Platform** (`superadmin/(dashboard)/audit-logs/`) — Jejak audit aktivitas seluruh platform.
  10. **Pencarian Global** (`superadmin/(dashboard)/search/`) — Pencarian lintas entitas (akademi, staf, siswa).
  11. **Support** (`superadmin/(dashboard)/support/`) — Halaman bantuan/dukungan.
- **Server Actions** (`superadmin/(dashboard)/actions.ts`, ~19KB) — Semua operasi CRUD superadmin termasuk verifikasi billing, manajemen akademi, dan subscription management.
- **Navigasi:** `SuperadminHeader`, `SuperadminNav`, `SuperadminMobileSidebar`.
- **Status:** ✅ Selesai.

---

## [Tahap 6] Portal Admin & Tutor (Dashboard Tenant)
- **Aksi:** Membuat dashboard operasional bimbel untuk admin dan tutor.
- **Layout & Navigasi:**
  - `dashboard/layout.tsx` (~7KB) — Layout tenant dengan sidebar, header, dan RBAC-aware navigation.
  - `TenantNav` (`tenant-nav.tsx`, ~6KB) — Navigasi sidebar dengan pembatasan menu berdasarkan role (Admin/Tutor).
  - `MobileSidebar` — Sidebar responsif untuk mobile.
  - `SearchBar` — Pencarian global dalam tenant.
  - `BillingBanner` & `BillingBannerWrapper` — Banner peringatan status langganan (trial/expired/suspended).
  - `FeatureLockBanner` — Banner fitur terkunci berdasarkan paket.

### 6.1. Dashboard Utama
- **Dashboard Admin** (`dashboard/client-page.tsx`, ~12KB) — Statistik tenant: total siswa, staf, jadwal hari ini, pendapatan bulan ini, grafik omset bulanan (Recharts), daftar tagihan tertunggak, jadwal mendatang.
- **Dashboard Tutor** — Tampilan terpisah dari Admin (Tutor tidak bisa melihat data finansial/omset).
- **Status:** ✅ Selesai.

### 6.2. Master Data
- **Siswa** (`master-data/students/`) — Daftar siswa dengan CRUD, import CSV/Excel (`papaparse`), pencarian, dan pagination.
  - Modal: `add-student-modal`, `edit-student-modal`, `import-students-modal`.
  - Server Actions: Tambah, edit, hapus (soft delete), import batch dari CSV.
- **Staf/Tutor** (`master-data/staff/`) — Daftar staf dengan CRUD, pembagian role ADMIN/TUTOR.
  - Modal: `add-staff-modal`, `edit-staff-modal`.
  - Server Actions: Tambah, edit, hapus staf.
- **Ruangan** (`master-data/rooms/`) — Daftar ruangan kelas dengan CRUD dan kapasitas.
  - Modal: `add-room-modal`, `edit-room-modal`.
  - Server Actions: Tambah, edit, hapus ruangan.
- **Program Bimbingan** (`master-data/programs/`) — Daftar program dengan CRUD, biaya bulanan, durasi, total pertemuan, dan bobot evaluasi.
  - Modal: `add-program-modal`, `edit-program-modal`.
  - Halaman Detail Program (`programs/[id]/`) — Daftar siswa terdaftar dalam program dan manajemen enrollment.
  - Modal Enrollment: `enroll-student-modal`, `manage-enrollments-modal`.
  - Server Actions: Tambah, edit, hapus program, kelola pendaftaran siswa.
- **Status:** ✅ Selesai.

### 6.3. Penjadwalan Kelas
- **Halaman Jadwal** (`schedules/client-page.tsx`, ~30KB) — Kalender interaktif dengan tampilan minggu/hari, tabel jadwal, filter program/tutor/ruangan, validasi anti-bentrok.
  - Modal: `add-schedule-modal`, `reschedule-modal`, `cancel-schedule-modal`, `day-schedules-modal`.
  - **Auto Scheduler** (`auto-scheduler-modal.tsx`, ~13KB) — Penjadwalan otomatis batch berdasarkan preferensi hari, jam, dan ketersediaan ruangan.
  - Server Actions (~17KB): Tambah jadwal (dengan validasi bentrok tutor & ruangan), reschedule, batalkan, auto-generate batch.
- **Detail Jadwal & Presensi** (`schedules/[scheduleId]/`) — Halaman presensi per sesi kelas.
  - `attendance-client.tsx` (~9KB) — Daftar siswa terdaftar dengan status kehadiran (PRESENT/EXCUSED/ABSENT), input manual admin/tutor.
  - Server Actions: Update status kehadiran per siswa.
- **Status:** ✅ Selesai.

### 6.4. Presensi QR Dinamis
- **Layar QR Tutor/Admin** (`[tenantSlug]/present/[scheduleId]/`) — Layar penampil QR Code dinamis yang di-refresh berkala.
  - QR Data dienkripsi dengan AES-256-CBC (`src/lib/qr-crypto.ts`).
  - URL QR menggunakan `window.location.origin` (dinamis sesuai host).
- **Scan QR Siswa** (`student/(protected)/scan/`) — Halaman pemindai QR via kamera mobile (`@yudiel/react-qr-scanner`).
  - Sub-halaman konfirmasi scan (`scan/[scheduleId]/`).
  - Server Actions: Validasi dan record kehadiran setelah scan berhasil.
- **Status:** ✅ Selesai.

### 6.5. Keuangan & Tagihan (Finance)
- **Halaman Keuangan** (`finance/client-page.tsx`, ~25KB) — Daftar semua invoice siswa, filter status pembayaran (UNPAID/PAID/OVERDUE/VOID), pencarian, pagination.
  - Modal: `add-invoice-modal`, `verify-payment-modal`, `upload-proof-modal`, `split-installment-modal`.
  - **Generate Invoice Button** (`generate-button.tsx`) — Tombol eksekusi manual pembuatan tagihan bulanan otomatis.
  - Server Actions (~14KB): Buat invoice, verifikasi pembayaran manual, void invoice, split cicilan (khusus paket Pro), dan verifikasi pelunasan per termin cicilan (`verifyInstallmentAction`).
- **Detail Invoice** (`finance/[id]/`) — Detail tagihan dengan rincian item, status pembayaran, bukti transfer, daftar jadwal cicilan per termin, tombol verifikasi tunai/transfer per termin, progress bar pelunasan cicilan, dan opsi pelunasan seluruh termin sekaligus.
- **Automasi Tagihan Cron** (`api/cron/generate-invoices/`) — API endpoint untuk generate invoice bulanan otomatis berdasarkan enrollment aktif.
- **Status:** ✅ Selesai (Termasuk Verifikasi Cicilan Bertahap).

### 6.6. Evaluasi & E-Rapor
- **Halaman Evaluasi** (`evaluations/client-page.tsx`, ~25KB) — Daftar evaluasi siswa dengan CRUD, filter program, tipe evaluasi (EXAM/HOMEWORK/MONTHLY_REPORT), status (DRAFT/PUBLISHED).
  - Modal: `add-evaluation-modal`.
  - Server Actions (~11KB): Tambah, edit, hapus, publish evaluasi.
- **Gradebook** (`evaluations/gradebook/`) — Tampilan buku nilai per program, rekap skor dengan pembobotan otomatis (`weight_exam` + `weight_homework`).
- **Status:** ✅ Selesai.

### 6.7. Repositori Materi Belajar
- **Halaman Materi** (`materials/client-page.tsx`, ~8KB) — Daftar materi pembelajaran per program (link dokumen, video, atau lainnya).
  - Modal: `add-material-modal`.
  - Server Actions: Tambah dan hapus materi.
- **Status:** ✅ Selesai.

### 6.8. Audit Log Tenant
- **Halaman Audit Log** (`audit-logs/client-page.tsx`, ~8KB) — Daftar log audit aktivitas dalam tenant (CREATE/UPDATE/DELETE/VERIFY/LOGIN), fitur khusus paket Pro.
  - Utility: `src/lib/audit.ts` — Helper untuk mencatat log audit secara non-blocking.
- **Status:** ✅ Selesai.

### 6.9. Subscription & Kuota
- **Halaman Subscription** (`subscription/client-page.tsx`, ~10KB) — Informasi paket aktif, status langganan, sisa kuota (siswa/staf/ruangan), opsi upgrade.
  - Server Actions: Request upgrade/downgrade paket.
- **Library Subscription** (`src/lib/subscription.ts`, ~29KB) — Engine lengkap untuk:
  - Quota Gating atomik (validasi maks siswa/staf/ruangan).
  - Feature Gating (QR attendance, e-rapor, installment, audit trail, automated email, learning materials).
  - Kalkulasi status efektif langganan (TRIAL/ACTIVE/SUSPENDED/EXPIRED_TRIAL).
  - Validasi akses berdasarkan status subscription.
- **Plan Validation** (`src/lib/plan-validation.ts`) — Validasi constraint paket sebelum operasi CRUD.
- **Status:** ✅ Selesai.

### 6.10. Laporan Tenant
- **Halaman Laporan** (`reports/client-page.tsx`, ~23KB) — Laporan komprehensif: omset bulanan, piutang, kehadiran, rekap per program. Visualisasi dengan Recharts.
- **Status:** ✅ Selesai.

### 6.11. Profil & Support
- **Halaman Profil** (`profile/client-page.tsx`, ~15KB) — Edit profil staf (nama, email, password).
- **Halaman Support** (`support/client-page.tsx`, ~9KB) — Pusat bantuan dan kontak dukungan.
- **Status:** ✅ Selesai.

---

## [Tahap 7] Portal Siswa (Mobile-First PWA)
- **Aksi:** Membuat portal khusus siswa dengan desain mobile-first.
- **Layout & Navigasi:**
  - `student/(protected)/layout.tsx` — Layout siswa dengan proteksi autentikasi.
  - `desktop-nav.tsx` — Navigasi desktop siswa.
  - `mobile-nav.tsx` (~8KB) — Bottom navigation bar mobile-first.
  - `StudentBillingBanner` — Banner status pembayaran siswa.
- **Halaman yang Dibuat:**
  1. **Dashboard Siswa** (`student/(protected)/dashboard/`) — Ringkasan: jadwal hari ini, kehadiran, tagihan tertunggak.
  2. **Scan QR Presensi** (`student/(protected)/scan/`) — Kamera pemindai QR Code untuk presensi digital.
     - Sub-halaman konfirmasi (`scan/[scheduleId]/`) — Konfirmasi dan submit kehadiran.
  3. **Riwayat Kehadiran** (`student/(protected)/attendances/`) — Rekap kehadiran lengkap per sesi.
  4. **Jadwal Bimbingan** (`student/(protected)/schedules/`) — Daftar jadwal kelas aktif siswa.
  5. **Materi Belajar** (`student/(protected)/materials/`) — Akses materi pembelajaran per program terdaftar.
  6. **Evaluasi / E-Rapor** (`student/(protected)/evaluations/`) — Rekap nilai dan rapor siswa.
  7. **Tagihan & Pembayaran** (`student/(protected)/invoices/`) — Daftar tagihan SPP, rincian, dan upload bukti pembayaran.
     - Detail Invoice (`invoices/[id]/`) — Detail tagihan dan cicilan.
  8. **Profil Siswa** (`student/(protected)/profile/`) — Edit profil dan foto siswa.
  9. **Login Siswa** (`[tenantSlug]/login/`) — Login siswa per akademi.
  10. **Ubah Password** (`student/change-password/`) — Halaman wajib ubah password untuk siswa baru (`must_change_password` flag).
- **Status:** ✅ Selesai.

---

## [Tahap 8] PWA & Service Worker
- **Aksi:** Implementasi Progressive Web App menggunakan `@serwist/next` & `serwist`.
- **File yang Dibuat:**
  - `src/app/sw.ts` — Service Worker registration.
  - `public/sw.js` (~53KB) — Service Worker compiled untuk caching strategi.
  - `src/app/manifest.ts` — Web App Manifest (nama, ikon, warna tema, display standalone).
- **Status:** ✅ Selesai.

---

## [Tahap 9] RBAC (Role-Based Access Control)
- **Aksi:** Menerapkan pembatasan akses berdasarkan role secara menyeluruh.
- **Implementasi:**
  1. **Navigasi Sidebar** — Menu Master Data, Finance, dan Sistem disembunyikan untuk role TUTOR.
  2. **Dashboard Terpisah** — Admin melihat statistik finansial, Tutor hanya melihat jadwal dan presensi.
  3. **Action Restriction** — Tutor tidak bisa menghapus/membatalkan jadwal, tidak bisa mengelola invoice.
  4. **Middleware Level** — Validasi role di middleware untuk setiap route group.
  5. **Server Action Level** — Setiap Server Action memvalidasi JWT dan role sebelum eksekusi.
- **Status:** ✅ Selesai.

---

## [Tahap 10] UI/UX Components & Design System
- **Aksi:** Membangun komponen UI reusable dan design system.
- **Komponen UI Reusable (`src/components/ui/`):**
  - `Pagination` — Komponen pagination universal dengan navigasi halaman.
  - `LoadingSpinner` — Indikator loading animasi.
  - `DashboardSkeleton` — Skeleton loading untuk halaman dashboard.
  - `Sonner` (~6KB) — Sistem notifikasi toast custom.
  - `CustomSelect` (~5KB) — Dropdown select custom dengan styling konsisten.
  - `SearchableSelect` (~7KB) — Select dengan fitur pencarian/filter.
  - `CustomCursor` (~3KB) — Kursor animasi interaktif untuk landing page.
  - `MagneticButton` — Tombol dengan efek magnet hover.
  - `TextReveal` — Animasi reveal teks saat scroll.
  - `TextRotator` — Teks berganti otomatis (typewriter effect).
  - `ParallaxElement` — Elemen dengan efek parallax scroll.
- **Modal Components (`src/components/modals/`, 31 modal):**
  - CRUD Modals: Academy, Plan, Superadmin, Student, Staff, Room, Program, Schedule, Evaluation, Invoice, Material.
  - Action Modals: Enroll Student, Manage Enrollments, Import Students (CSV), Verify Payment, Upload Proof, Split Installment, Cancel Schedule, Reschedule, Auto Scheduler, Day Schedules.
  - Delete Modals: Delete Academy, Delete Plan, Delete Superadmin.
- **Theme System:**
  - `ThemeProvider` — Dukungan dark/light mode dengan `next-themes`.
  - `ThemeToggle` — Tombol toggle tema.
  - `UserAvatar` — Komponen avatar user.
- **Styling:** Tailwind CSS v4 dengan CSS Variables, `globals.css` (~1KB) untuk token warna global.
- **Animasi:** Framer Motion untuk transisi halaman, hover effects, dan micro-animations.
- **Iconography:** Lucide React untuk set ikon konsisten.
- **Konfirmasi Dialog:** SweetAlert2 untuk dialog konfirmasi tindakan kritis (hapus, batalkan, void).
- **Status:** ✅ Selesai.

---

## [Tahap 11] Dependensi & Konfigurasi
- **Dependencies Utama yang Terinstal:**
  | Package | Versi | Fungsi |
  | :--- | :---: | :--- |
  | `next` | 16.3.3 | Framework aplikasi utama |
  | `react` / `react-dom` | 19.2.8 | Library UI |
  | `@prisma/client` / `prisma` | 6.12.0 | ORM Database |
  | `@serwist/next` / `serwist` | 9.5.12 | PWA Service Worker |
  | `jose` | 6.2.10 | JWT Authentication |
  | `bcrypt` / `bcryptjs` | 6.0.0 / 3.0.3 | Password Hashing |
  | `nodemailer` | 10.1.0 | Pengiriman Email (OTP, Notifikasi) |
  | `framer-motion` | 13.3.0 | Animasi & transisi UI |
  | `recharts` | 3.10.1 | Visualisasi grafik & chart |
  | `sweetalert2` | 11.26.25 | Dialog konfirmasi |
  | `lucide-react` | 1.39.0 | Set ikon |
  | `@yudiel/react-qr-scanner` | 2.6.0 | Pemindai QR kamera mobile |
  | `qrcode.react` | 4.2.0 | Generator QR Code |
  | `papaparse` | 5.7.0 | Parser CSV untuk import siswa |
  | `zod` | 4.5.4 | Validasi schema data |
  | `date-fns` | 4.4.0 | Utilitas manipulasi tanggal |
  | `next-themes` | 0.4.6 | Dark/light mode |
  | `typewriter-effect` | 2.22.0 | Animasi teks typewriter |
  | `@next/third-parties` | 16.3.6 | Integrasi analytics |
  | `tailwindcss` | v4 | Styling CSS framework |

- **File Konfigurasi:**
  - `next.config.ts` — Konfigurasi Next.js (Serwist PWA, image domains).
  - `tsconfig.json` — TypeScript config dengan path alias `@/`.
  - `eslint.config.mjs` — Konfigurasi ESLint.
  - `postcss.config.mjs` — PostCSS dengan Tailwind CSS.
  - `prisma.config.ts` — Konfigurasi Prisma client.
  - `.env` — Environment variables (DATABASE_URL, JWT_SECRET, SMTP credentials, dll.).
  - `.gitignore` — Pengecualian file dari Git.

- **Aset Publik (`public/`):**
  - Logo & ikon (`logo.png`, `icon.png`).
  - Gambar landing page (`photo.avif`, `photo-1.avif`, `photo-2.avif`, `login-bg.png`).
  - Gambar CS Agent (`cs-agent.png`, `cs-agent-transparent.png`).
  - Gambar fitur showcase (`features/calendar-bg.png`, `qr-bg.png`, `payment-bg.png`, `email-bg.png`, `whatsapp-bg.png`).
- **Status:** ✅ Selesai.

---

## Ringkasan Status Keseluruhan

| Modul | Status | Keterangan |
| :--- | :---: | :--- |
| Perencanaan (PRD, ERD, Desain) | ✅ | Dokumen lengkap |
| Inisialisasi Next.js 16 | ✅ | App Router + TypeScript |
| Database PostgreSQL + Prisma | ✅ | 16 model, 12 enum, seeder |
| Autentikasi JWT + Middleware | ✅ | Multi-tenant, anti-IDOR, rate limit |
| Landing Page & Halaman Publik | ✅ | SEO, animasi, pricing dinamis |
| Portal Superadmin | ✅ | Dashboard, akademi, billing, plans, audit |
| Portal Admin/Tutor (Dashboard) | ✅ | 11 modul operasional |
| Master Data (Siswa, Staf, Ruangan, Program) | ✅ | CRUD + import CSV + enrollment |
| Penjadwalan Anti-Bentrok | ✅ | Kalender, auto-scheduler, reschedule |
| Presensi QR Dinamis | ✅ | Enkripsi AES-256, scan kamera mobile |
| Keuangan & Tagihan | ✅ | Invoice, cicilan, verifikasi, cron auto-generate |
| Evaluasi & E-Rapor | ✅ | Gradebook, pembobotan, publish |
| Repositori Materi Belajar | ✅ | Link dokumen/video per program |
| Audit Log | ✅ | Jejak keamanan (fitur Pro) |
| Subscription & Quota Gating | ✅ | Feature gating + quota atomik |
| Laporan & Grafik | ✅ | Recharts, omset, piutang, kehadiran |
| Portal Siswa (Mobile-First) | ✅ | 10 halaman, PWA, bottom nav |
| PWA & Service Worker | ✅ | Offline capability, installable |
| RBAC | ✅ | Admin vs Tutor separation |
| Dark/Light Mode | ✅ | next-themes |
| UI Components & Design System | ✅ | 11 komponen UI + 31 modal |
| Email OTP | ✅ | Brevo/Gmail/Resend multi-provider |

**Total File Kode:** ~150+ file TypeScript/React
**Total Ukuran Codebase:** ~700KB+ (tanpa node_modules)

---

## [Tahap Penyesuaian 1] Penyesuaian Batasan Paket & Gating Engine
- **Tanggal:** 27 Oktober 2026
- **Status:** ✅ Selesai & Tervalidasi (Typecheck clean 0 errors).
- **Rincian Implementasi:**
  1. **Paket Starter (Rp 99.000/bln):**
     - Kapasitas ruangan ditingkatkan dari 2 menjadi 3 ruangan (`CANONICAL_PLAN_LIMITS.starter.rooms = 3`, `prisma/seed.ts`, `pricing-section.tsx`).
     - Akses Repositori Materi Belajar dibuka untuk Starter dengan kuota terkontrol maksimal 15 modul aktif (`getMaxLearningMaterials(planName) === 15`).
     - Fitur pemecahan cicilan tetap terkunci (hanya bayar lunas penuh).
  2. **Paket Growth (Rp 199.000/bln):**
     - Fitur Pemecahan Cicilan diizinkan dengan batasan kuota maksimal 3 termin (`getMaxInstallmentTerms(planName) === 3`).
     - Akses Materi Belajar bebas tanpa batas kuota (unlimited).
  3. **Paket Pro (Rp 399.000/bln):**
     - Fitur Pemecahan Cicilan bebas tanpa batas termin (unlimited).
     - Materi Belajar bebas tanpa batas kuota (unlimited).
     - Audit Trail aktif.
     - Penyiapan gating key dan pesan penolakan untuk fitur kalkulator honor tutor (`tutor_payroll`).
  4. **Proteksi Backend & Tindakan Server:**
     - [`src/lib/subscription.ts`](file:///d:/bimbelsync/src/lib/subscription.ts): Penambahan fungsi `getMaxInstallmentTerms`, `getMaxLearningMaterials`, penyesuaian `isFeatureAllowedByPlan`, dan penambahan kunci `tutor_payroll`.
     - [`src/app/[tenantSlug]/dashboard/materials/actions.ts`](file:///d:/bimbelsync/src/app/[tenantSlug]/dashboard/materials/actions.ts): Enforce kuota 15 modul untuk Starter, validasi URL protokol (`http://` atau `https://`), serta perbaikan revalidasi cache ke dashboard dan portal siswa.
     - [`src/app/[tenantSlug]/dashboard/finance/actions.ts`](file:///d:/bimbelsync/src/app/[tenantSlug]/dashboard/finance/actions.ts): Enforce maksimal termin cicilan pada `splitInstallmentsAction` sesuai tier akademi, minimal 2 termin.
  5. **Penyesuaian UI & Modal:**
     - [`src/components/modals/split-installment-modal.tsx`](file:///d:/bimbelsync/src/components/modals/split-installment-modal.tsx): Menerima `maxTerms`, menonaktifkan tombol tambah termin jika batas kuota tercapai, dan menampilkan pesan edukasi upgrade.
     - [`src/app/[tenantSlug]/dashboard/finance/[id]/page.tsx`](file:///d:/bimbelsync/src/app/[tenantSlug]/dashboard/finance/[id]/page.tsx) & [`client-page.tsx`](file:///d:/bimbelsync/src/app/[tenantSlug]/dashboard/finance/[id]/client-page.tsx): Meneruskan `maxTerms` dari langganan aktif ke modal pemecahan cicilan.
     - [`src/components/landing/pricing-section.tsx`](file:///d:/bimbelsync/src/components/landing/pricing-section.tsx): Menyelaraskan kartu harga, toggle fitur, dan tabel perbandingan spesifikasi paket.

---

## [Tahap Penyesuaian 1.1] Penyeimbangan Nilai Paket Growth vs Pro & Perbaikan Duplikasi Visual
- **Tanggal:** 27 Oktober 2026
- **Status:** ✅ Selesai & Tervalidasi (Typecheck clean 0 errors).
- **Rincian Perubahan:**
  1. **Penyeimbangan Kuota Materi Belajar (Growth vs Pro):**
     - Kuota materi belajar pada paket **Growth** disesuaikan menjadi **Maksimal 50 Modul** (`getMaxLearningMaterials(planName) === 50` di [`src/lib/subscription.ts`](file:///d:/bimbelsync/src/lib/subscription.ts)).
     - Hak **Materi Belajar Tanpa Batas (Unlimited Modul)** diposisikan sebagai nilai keunggulan eksklusif paket **Pro**.
  2. **Pembersihan Duplikasi Visual Kartu Pricing:**
     - Memperbaiki `pricing-section.tsx` yang sebelumnya menampilkan fitur `additional_features` dan `toggleableFeatures` secara bertumpuk (menyebabkan Absensi QR, E-Rapor, dan Cicilan muncul dua kali pada kartu Growth).
     - Menambahkan sanitasi otomatis untuk memfilter fitur tumpang tindih serta menyediakan fallback default yang simetris jika data database belum terisi lengkap.
  3. **Penegasan Nilai Jual Paket Pro (Rp 399.000):**
     - Menampilkan **"Kalkulator Honor & Gaji Tutor (Payroll)"** sebagai fitur unggulan aktif dengan penekanan visual tebal (bold) pada kartu Pro, dan ditampilkan bersilang (X) pada paket Starter dan Growth.
     - Menyelaraskan baris perbandingan di tabel komparasi: Materi Digital (15 vs 50 vs Unlimited), Cicilan Tagihan (X vs 3 Termin vs Unlimited), dan Kalkulator Honor Tutor (X vs X vs Check).
  4. **Sinkronisasi Database:**
     - [`prisma/seed.ts`](file:///d:/bimbelsync/prisma/seed.ts) diperbarui dan seluruh baris tabel `Plan` disinkronkan langsung via `npx prisma db seed`.

---

## [Tahap Penyesuaian 1.2] Penyajian Kartu Harga Bertingkat (Progressive Tiering)
- **Tanggal:** 27 Oktober 2026
- **Status:** ✅ Selesai & Tervalidasi (Typecheck clean 0 errors).
- **Rincian Perubahan:**
  1. **Format Kartu Ringkas & Eksklusif:**
     - Mengubah penyajian fitur kartu harga di [`src/components/landing/pricing-section.tsx`](file:///d:/bimbelsync/src/components/landing/pricing-section.tsx) menggunakan model **Progressive Tiering**:
       - **Starter:** Fitur inti esensial (Jadwal, Portal Siswa, Cetak PDF, Materi 15 Modul, Presensi Manual).
       - **Growth:** Banner *"✨ Semua fitur paket Starter, ditambah:"* + 5 fitur pembeda utama (Absensi QR Dinamis, E-Rapor, Email Tagihan Otomatis, Materi hingga 50 Modul, Cicilan Tagihan Maks. 3 Termin).
       - **Pro:** Banner *"🚀 Semua fitur paket Growth, ditambah:"* + 5 fitur eksklusif Pro (Kalkulator Honor & Payroll Tutor, Materi Unlimited Modul, Cicilan Unlimited Termin, Audit Trail Keamanan, Prioritas Dukungan Teknis 24/7).
  2. **Eliminasi Visual Bloat:**
     - Menghilangkan deretan baris silang (X) abu-abu yang membuat kartu molor vertikal, sehingga ketiga kartu memiliki tinggi (*height*) yang proporsional, padat, dan simetris.
     - Checklist matriks lengkap tetap tersedia dan dapat diinspeksi secara detail pada Tabel Perbandingan Fitur di bawah kartu.




---

## [Tahap Penyesuaian 1.3] Normalisasi Penamaan Fitur Portal Siswa
- Status: Selesai & Tervalidasi.
- Mengubah seluruh label Portal Siswa & Orang Tua/Wali Murid menjadi Portal Siswa di pricing-section.tsx, prisma/seed.ts, dan sinkronisasi database.

---

## [Tahap Penyesuaian 1.4] Refaktor UI/UX Modal Pecah Cicilan (SplitInstallmentModal)
- Status: Selesai & Tervalidasi.
- Mengubah tata letak kartu bertumpuk menjadi tabel baris horizontal kompak (menghemat 65% tinggi vertikal).
- Menambahkan preset 1-klik bagi rata cepat (2x, 3x, 4x, 6x).
- Menerapkan sticky header dan sticky footer agar tombol aksi dan status alokasi selalu terlihat di layar.

---

## [Tahap Penyesuaian 1.5] Perbaikan Form Siswa & Program
- Status: Selesai & Tervalidasi.
- Memperbaiki duplikasi bintang merah (*) pada field Nama Lengkap di modal pendaftaran siswa.
- Memperbaiki teks placeholder terpotong pada field Total Pertemuan di modal tambah program.
- Menghapus dropdown filter Semua Tipe pada halaman Master Data Program.
