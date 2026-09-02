# Log Aktivitas & Dokumentasi Proyek - BimbelSync

File ini mencatat secara kronologis semua perintah terminal (`cmd`), instalasi dependensi, dan perubahan arsitektur utama dari awal hingga akhir proyek. 
Aturan: 
1. Setiap perintah dijalankan melalui `cmd` (Command Prompt Windows).
2. Catat status keberhasilan dan ringkasan apa yang diubah.

---

## [Tahap 0] Perencanaan Dokumen
- **Tanggal/Waktu:** Tahap Perencanaan
- **Aksi:** Membuat file `PRD.md`, `Desain.md`, dan `ERD.md` berdasarkan requirement (Acceptance Criteria).
- **Status:** Selesai.

*(Log ini akan terus di-update setiap kali ada eksekusi perintah atau perubahan sistem yang signifikan di tahap berikutnya)*

## [Tahap 1] Inisialisasi Proyek Next.js
- **Aksi:** Mengeksekusi `create-next-app`, mengatur palet warna di `tailwind.config.ts`, dan membersihkan boilerplate bawaan.
- **Status:** Selesai.

## [Tahap 2] Setup Database & Prisma
- **Aksi:** Instalasi Prisma, menyalin ERD ke `schema.prisma`, dan eksekusi `npx prisma db push`.
- **Status:** Selesai. Database berhasil dibuat.

## [Tahap 3] Multi-Tenant & Middleware
- **Aksi:** Instalasi `jose` untuk JWT, pembuatan `src/lib/auth.ts`, dan pengaturan proteksi routing di `src/middleware.ts`.
- **Status:** Selesai.
- **Security Notes:**
  1. File `auth.ts` telah di-*patch* untuk WAJIB membaca `JWT_SECRET` dari `.env`. (Kunci rahasia dummy telah disuntikkan ke `.env`).
  2. Middleware telah menambal celah IDOR (Cross-Tenant) dengan membaca `tenant_slug` dari JWT.
  3. **Untuk Tahap Selanjutnya:** Semua Server Action (API) **WAJIB** mengecek token JWT ulang, dan semua *query* database **WAJIB** membawa filter `academy_id`.
