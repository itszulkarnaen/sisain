-- ============================================================
-- NineToPay Initial Seed Data (Kategori Default Global)
-- Eksekusi di Supabase SQL Editor
-- ============================================================

INSERT INTO public.categories (name, icon, color, type, user_id)
VALUES 
  ('Makan & Minum', '🍜', '#FED7AA', 'EXPENSE', NULL),
  ('Nongkrong/Kopi', '☕', '#FEF08A', 'EXPENSE', NULL),
  ('Transport', '🚗', '#BAE6FD', 'EXPENSE', NULL),
  ('Belanja', '🛍️', '#FBCFE8', 'EXPENSE', NULL),
  ('Kosan/Tagihan', '🏠', '#BBF7D0', 'EXPENSE', NULL),
  ('Hiburan', '🎬', '#DDD6FE', 'EXPENSE', NULL),
  ('Gaji Pokok', '💰', '#A7F3D0', 'INCOME', NULL),
  ('Side Hustle', '💻', '#E9D5FF', 'INCOME', NULL)
ON CONFLICT DO NOTHING;
