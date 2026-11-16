-- ============================================================
-- sisa.in Database Schema & Security Policies (Supabase DDL)
-- Version: 1.1 (MVP Zero-KYC Edition)
-- ============================================================

-- Aktifkan ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Data Pengguna & Status Langganan - Ekstensi dari auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  monthly_salary NUMERIC(15, 2) DEFAULT 0 CHECK (monthly_salary >= 0),
  payday_date INT DEFAULT 25 CHECK (payday_date BETWEEN 1 AND 31),
  subscription_status TEXT DEFAULT 'TRIAL' CHECK (subscription_status IN ('TRIAL', 'ACTIVE', 'EXPIRED')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  subscription_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WALLETS (Persiapan Skalabilitas V2.0)
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Dompet Utama',
  is_default BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORIES (Kategori Transaksi Bawaan & Kustom)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL jika kategori bawaan global
  name TEXT NOT NULL,
  icon TEXT NOT NULL, -- Unicode emoji string (contoh: '🍜', '☕', '🚗')
  color TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('EXPENSE', 'INCOME')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BUDGETS (Alokasi Bujet per Kategori per Siklus)
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  monthly_limit NUMERIC(15, 2) NOT NULL CHECK (monthly_limit > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);

-- 5. RECURRING_RULES (Mesin Monthly Fee Automation)
CREATE TABLE IF NOT EXISTS public.recurring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  execution_day INT NOT NULL CHECK (execution_day BETWEEN 1 AND 31),
  is_active BOOLEAN DEFAULT TRUE,
  last_executed_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TRANSACTIONS (Penyimpanan Transaksi Offline-First)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY, -- Client-generated UUID dari IndexedDB / crypto.randomUUID()
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('EXPENSE', 'INCOME')),
  transaction_date DATE NOT NULL,
  notes TEXT,
  is_recurring_instance BOOLEAN DEFAULT FALSE,
  recurring_rule_id UUID REFERENCES public.recurring_rules(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks Performa
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_recurring_rules_active_day ON public.recurring_rules(execution_day) WHERE is_active = TRUE;

-- OTOMASI TRIGGER REGISTRASI PENGGUNA BARU
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name, 
    avatar_url, 
    subscription_status, 
    trial_ends_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Pengguna Baru'),
    NEW.raw_user_meta_data->>'avatar_url',
    'TRIAL',
    NOW() + INTERVAL '30 days'
  );
  
  -- Buat default wallet untuk user baru
  INSERT INTO public.wallets (user_id, name, is_default)
  VALUES (NEW.id, 'Dompet Utama', TRUE);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- AKTIVASI ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- POLICIES: Isolasi Data User (Hanya pemilik akun yang dapat membaca & mengubah datanya)
CREATE POLICY "Users can manage their own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage their own wallets" ON public.wallets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view default categories or own" ON public.categories
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can manage own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own budgets" ON public.budgets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own recurring rules" ON public.recurring_rules
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own transactions" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

-- SEED DATA: Kategori Default Global (user_id IS NULL)
INSERT INTO public.categories (id, user_id, name, icon, color, type) VALUES
  ('c0000001-0000-0000-0000-000000000001', NULL, 'Makan & Minum', '/category/makan_minum.png', '#FED7AA', 'EXPENSE'),
  ('c0000001-0000-0000-0000-000000000002', NULL, 'Nongkrong/Kopi', '/category/kopi.png', '#FEF08A', 'EXPENSE'),
  ('c0000001-0000-0000-0000-000000000003', NULL, 'Transport', '/category/transport.png', '#BAE6FD', 'EXPENSE'),
  ('c0000001-0000-0000-0000-000000000004', NULL, 'Belanja', '/category/belanja.png', '#FBCFE8', 'EXPENSE'),
  ('c0000001-0000-0000-0000-000000000005', NULL, 'Kosan/Tagihan', '/category/kosan.png', '#BBF7D0', 'EXPENSE'),
  ('c0000001-0000-0000-0000-000000000006', NULL, 'Hiburan', '/category/hiburan.png', '#DDD6FE', 'EXPENSE'),
  ('c0000001-0000-0000-0000-000000000009', NULL, 'Tidak Terduga', '/category/tak_terduga.png', '#FECDD3', 'EXPENSE'),
  ('c0000001-0000-0000-0000-000000000007', NULL, 'Gaji Pokok', '/category/gaji.png', '#A7F3D0', 'INCOME'),
  ('c0000001-0000-0000-0000-000000000008', NULL, 'Side Hustle', '/category/side_husle.png', '#E9D5FF', 'INCOME')
ON CONFLICT (id) DO UPDATE SET
  icon = EXCLUDED.icon,
  name = EXCLUDED.name,
  color = EXCLUDED.color;

