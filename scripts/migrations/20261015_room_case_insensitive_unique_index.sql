-- ==============================================================================
-- BimbelSync Migration: Case-Insensitive Unique Index for Active Rooms
-- Purpose: Menjamin keunikan nama ruangan aktif per Academy secara case-insensitive
-- Target Table: public."Room"
-- Target Index: room_academy_id_lower_name_active_idx
-- Replaces:     room_academy_id_name_active_idx (case-sensitive)
-- ==============================================================================

-- 1. Buat partial unique index berbasis ekspresi LOWER(name)
CREATE UNIQUE INDEX IF NOT EXISTS "room_academy_id_lower_name_active_idx" 
ON public."Room" (academy_id, LOWER(name)) 
WHERE deleted_at IS NULL;

-- 2. Hapus index lama yang case-sensitive agar tidak redundan
DROP INDEX IF EXISTS "room_academy_id_name_active_idx";
