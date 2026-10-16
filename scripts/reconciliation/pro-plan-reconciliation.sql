-- ==============================================================================
-- BimbelSync Phase 2.4 - Phase E: Pro Plan Production Record Reconciliation
-- Purpose: Menyelaraskan kuota paket Pro aktif di database produksi dengan kontrak bisnis
-- Target Record ID: '45870399-4b03-475b-b580-4616b4686ad5' (Plan "Pro")
-- Target Values: max_students = 500, max_staff = 25, max_rooms = 15
-- Current Values: max_students = 500, max_staff = NULL, max_rooms = NULL
-- PENTING: JANGAN DIJALANKAN SEBELUM PERSETUJUAN GATE 3 DIBERIKAN OLEH USER.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PRE-VERIFIKASI (Verifikasi kondisi sebelum mutasi)
-- ------------------------------------------------------------------------------
SELECT 
  id, 
  name, 
  price, 
  max_students, 
  max_staff, 
  max_rooms, 
  is_active, 
  deleted_at 
FROM public."Plan" 
WHERE id = '45870399-4b03-475b-b580-4616b4686ad5';

-- ------------------------------------------------------------------------------
-- 2. MUTASI IDEMPOTEN (Hanya memutasi kolom yang disetujui jika nilainya belum sesuai)
-- ------------------------------------------------------------------------------
UPDATE public."Plan"
SET 
  max_students = 500,
  max_staff = 25,
  max_rooms = 15
WHERE id = '45870399-4b03-475b-b580-4616b4686ad5'
  AND (
    max_students IS DISTINCT FROM 500 
    OR max_staff IS DISTINCT FROM 25 
    OR max_rooms IS DISTINCT FROM 15
  );

-- ------------------------------------------------------------------------------
-- 3. POST-VERIFIKASI (Verifikasi hasil mutasi)
-- ------------------------------------------------------------------------------
SELECT 
  id, 
  name, 
  price, 
  max_students, 
  max_staff, 
  max_rooms, 
  is_active, 
  deleted_at 
FROM public."Plan" 
WHERE id = '45870399-4b03-475b-b580-4616b4686ad5';

-- ------------------------------------------------------------------------------
-- 4. EVALUASI DAN PROSEDUR ROLLBACK
-- ------------------------------------------------------------------------------
-- PERINGATAN KEAMANAN & INTEGRITAS DATA:
-- Nilai sebelum rekonsiliasi adalah `max_staff = NULL` dan `max_rooms = NULL`.
-- Pada logika aplikasi `src/lib/subscription.ts` (fungsi getPlanResourceLimit), 
-- nilai eksplisit `NULL` dievaluasi sebagai UNLIMITED (tanpa batas kuota).
-- 
-- Oleh karena itu, mengembalikan nilai ke NULL bukanlah tindakan aman tanpa risiko,
-- karena akan membuka kembali celah kuota tanpa batas pada tier Pro.
--
-- Rekomendasi Rollback:
-- 1. Jika terjadi isu kompatibilitas pada tenant Pro tertentu, lakukan penyesuaian 
--    kuota secara eksplisit (misal: memberikan batas transisi lebih tinggi) daripada 
--    mengembalikannya menjadi NULL.
-- 2. Jika rollback ke kondisi historis mutlak diperlukan untuk audit/investigasi:
--    Eksekusi query berikut HANYA jika disetujui secara sadar bahwa tier Pro kembali 
--    menjadi unlimited untuk staff dan ruangan:
--
-- UPDATE public."Plan"
-- SET 
--   max_students = 500,
--   max_staff = NULL,
--   max_rooms = NULL
-- WHERE id = '45870399-4b03-475b-b580-4616b4686ad5';

