# Technical Architecture & System Design Document (TDD) — MVP v1.0

**Aplikasi:** Smart Daily Expense Tracker (PWA)  
**Target Pengguna:** Usep (Karyawan Gen-Z & Rekan Kerja Kantor)  
**Infrastructure Stack:** Vercel (Hobby Free Tier) + Supabase (Free Tier PostgreSQL with RLS)  
**Skema Monetisasi:** Soft-Lock (Trial 30 Hari) + Manual Direct Transfer / QRIS Pribadi + Konfirmasi WhatsApp  
**Versi Dokumen:** 1.1 (Simplified No-PG / Zero-KYC Edition)

---

## 1. Ringkasan Eksekutif & Pemilihan Stack

Arsitektur aplikasi dirancang menggunakan pola **Hybrid Offline-First Progressive Web App (PWA)** tanpa ketergantungan pada payment gateway pihak ketiga (Zero KYC & Zero Platform Fee). Solusi ini dioptimalkan untuk proyek internal/lingkup rekan kantor ($10-20$ pengguna), tanpa beban operasional biaya bulanan dan minim pemeliharaan (*low maintenance*).

### Komponen Inti
* **Frontend:** Next.js (App Router), Tailwind CSS, Lucide Icons, Dexie.js (IndexedDB local wrapper).
* **Hosting & Runtime:** Vercel Hobby Free Tier (Edge Network & Serverless API Routes).
* **Database & Auth:** Supabase Managed PostgreSQL Free Tier dengan Row Level Security (RLS) serta Supabase Auth (Google OAuth & Register Manual Email/Password).
* **Scheduled Job (Automation):** Vercel Cron Jobs memanggil endpoint pemrosesan potongan rutin harian via bearer token rahasia.
* **Monetization & Access Management:** Tampilan paywall QRIS / Rekening Bank pribadi dengan tombol WhatsApp Deep Link. Pemilik proyek (*admin*) memberikan akses Pro secara manual langsung via **Supabase Table Editor**.

---

## 2. Arsitektur Autentikasi & Manajemen Akun

Sistem autentikasi mengandalkan modul bawaan Supabase Auth (`auth.users`) yang terisolasi dari tabel data aplikasi di skema `public`:

```
[ Registrasi Manual (Email/Pass) ] ──┐
                                     ├──► [ auth.users (Internal Supabase Auth) ]
[ Login Google OAuth ] ──────────────┘           │ (Otomatis hash, JWT & metadata)
                                                 │
                                                 ▼ (PostgreSQL Trigger: on_auth_user_created)
                                     [ public.profiles ] (Data ekstensi: gaji, trial, status pro)
                                                 │
                                                 ▼
                                     [ public.wallets ]  (Inisialisasi 'Dompet Utama' default)
```

### Mekanisme Kerja:
1. **Google OAuth & Register Manual:** Pengguna dapat mendaftar dengan satu klik akun Google atau memasukkan email & password manual. Password otomatis dienkripsi dengan *bcrypt* di tabel `auth.users`.
2. **Koneksi ke Data Aplikasi (`public.profiles`):** Tabel `public.profiles` adalah ekstensi profil bisnis aplikasi di mana kolom `id` merujuk langsung ke `auth.users.id`.
3. **Database Trigger Otomatis:** Setiap pendaftaran baru memicu trigger PostgreSQL `on_auth_user_created` yang mengaktifkan masa **Free Trial 30 hari** secara otomatis (`subscription_status = 'TRIAL'`, `trial_ends_at = NOW() + INTERVAL '30 days'`) dan membuat 1 dompet bawaan di `public.wallets`.

---

## 3. Skema Database Lengkap & Kebijakan Keamanan (PostgreSQL DDL)

Eksekusi DDL berikut pada Supabase SQL Editor:

```sql
-- Aktifkan ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Data Pengguna & Status Langganan - Ekstensi dari auth.users)
CREATE TABLE public.profiles (
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
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Dompet Utama',
  is_default BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORIES (Kategori Transaksi Bawaan & Kustom)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL jika kategori bawaan global
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('EXPENSE', 'INCOME')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BUDGETS (Alokasi Bujet per Kategori per Siklus)
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  monthly_limit NUMERIC(15, 2) NOT NULL CHECK (monthly_limit > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);

-- 5. RECURRING_RULES (Mesin Monthly Fee Automation)
CREATE TABLE public.recurring_rules (
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
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY, -- Client-generated UUID dari IndexedDB
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
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX idx_recurring_rules_active_day ON public.recurring_rules(execution_day) WHERE is_active = TRUE;

-- OTOMASI TRIGGER REGISTRASI PENGGUNA
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
```

---

## 4. Mekanisme Soft-Lock & Manual Grant Access

### A. Alur di Aplikasi (Client-Side)
1. Setiap kali halaman **Budgeting**, **Monthly Fee Automation**, atau tombol **Export Data** dibuka, sistem memeriksa status akun:
   * Jika `subscription_status == 'TRIAL'` dan `NOW() < trial_ends_at`: Akses penuh terbuka.
   * Jika `subscription_status == 'ACTIVE'` dan `NOW() < subscription_ends_at`: Akses penuh terbuka.
   * Jika masa berlaku habis: Modal Soft-Lock muncul di layar.
2. Modal Soft-Lock menampilkan:
   * Gambar kode QRIS Statis Pribadi / Nomor Rekening Bank pemilik aplikasi.
   * Keterangan harga: **Rp10.000 / Bulan**.
   * Tombol: **"Kirim Bukti Pembayaran via WhatsApp"**.
3. Tombol WhatsApp menghasilkan link dengan pesan otomatis (*URL Encoded*):
   ```
   https://wa.me/6281234567890?text=Halo%20bro%2C%20gue%20udah%20transfer%20Rp10.000%20buat%20perpanjang%20Pro%20Expense%20Tracker.%0AEmail%20Akun%3A%20usep%40kantor.com%0ABukti%20terlampir%20ya!
   ```

### B. Prosedur Manual Grant Access via Supabase Table Editor
Sebagai pemilik sistem, ketika teman kantor mengirimkan konfirmasi transfer:
1. Buka browser ponsel atau laptop ke [Supabase Dashboard](https://supabase.com/dashboard).
2. Pilih project $\rightarrow$ Masuk ke menu **Table Editor** $\rightarrow$ Pilih tabel **`profiles`**.
3. Temukan baris akun pengguna berdasarkan kolom `email` atau `full_name`.
4. Lakukan pembaruan nilai kolom secara langsung (*inline edit*):
   * Ubah `subscription_status` menjadi: `'ACTIVE'`
   * Ubah `subscription_ends_at` menjadi: tanggal 30 hari ke depan dari tanggal sekarang (misal: `2026-12-06 23:59:59+07`).
5. Simpan baris data. Saat pengguna membuka kembali aplikasinya, modal kunci terbuka secara otomatis.

---

## 5. Algoritma Bisnis & Kontrak API

### A. Algoritma Safe-to-Spend Harian
$$\text{Safe-to-Spend Harian} = \frac{\text{Sisa Gaji Periode Berjalan} - \text{Total Tagihan Rutin yang Belum Terpotong}}{\text{Sisa Hari Menuju Tanggal Gajian}}$$

### B. Kontrak API: Sinkronisasi Transaksi Offline-First
* **Path:** `POST /api/v1/sync/transactions`
* **Auth:** Bearer Token (Supabase JWT)
* **Request Body:**
  ```json
  {
    "transactions": [
      {
        "id": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
        "wallet_id": "c3f8b2d2-8b43-4c54-9f2d-6211832b4b21",
        "category_id": "7b0d5c80-165f-4a0b-8d1e-e24c29d109f0",
        "amount": 35000,
        "type": "EXPENSE",
        "transaction_date": "2026-11-06",
        "notes": "Makan siang kantin",
        "created_at": "2026-11-06T12:00:00Z"
      }
    ]
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "synced_count": 1,
    "timestamp": "2026-11-06T12:00:02Z"
  }
  ```

### C. Kontrak API: Eksekusi Otomasi Tagihan Bulanan (Cron)
* **Path:** `POST /api/v1/cron/execute-recurring`
* **Auth:** Header `Authorization: Bearer <VERCEL_CRON_SECRET>`
* **Logika:** Dijalankan setiap hari pukul 00:05 WIB oleh Vercel Cron. Membuat entri baru pada tabel `transactions` untuk semua rule aktif yang jatuh tempo hari ini dan status langganan pemiliknya aktif atau dalam masa trial.