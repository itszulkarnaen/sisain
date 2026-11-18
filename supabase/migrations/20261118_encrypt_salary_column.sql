-- ============================================================
-- Migration: Encrypt Salary Column (ALFE AES-GCM)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Hapus constraint CHECK numerik lama jika ada
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_monthly_salary_check;

-- 2. Ubah tipe kolom monthly_salary dari NUMERIC ke TEXT
-- (Data angka lama otomatis di-cast menjadi string teks angka dan kompatibel dibaca oleh aplikasi)
ALTER TABLE public.profiles 
  ALTER COLUMN monthly_salary TYPE TEXT USING monthly_salary::TEXT,
  ALTER COLUMN monthly_salary SET DEFAULT '0';
