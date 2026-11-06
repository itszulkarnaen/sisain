# Diagram Arsitektur & Alur Sistem (Mermaid.js)

Salin kode blok di bawah ini langsung ke editor di [mermaid.live](https://mermaid.live).

## 1. Flowchart: Alur Pencatatan Offline-First & Guardrail Safe-to-Spend

Diagram alur dari input transaksi harian oleh Usep sampai sinkronisasi awan dan validasi kuota bujet.

```
flowchart TD
    Start([Usep Buka PWA]) --> CheckAuth{Status Sesi Auth?}
    CheckAuth -- Belum Ada --> Onboarding[Tampilkan Login Google / Email]
    CheckAuth -- Sudah Login --> InputForm[Buka Form Numpad Cepat]

    InputForm --> SubmitTx[Ketik Nominal, Kategori, Simpan]
    SubmitTx --> GenUUID[Generate Client UUID & Timestamp]
    
    GenUUID --> SaveIDB[(Simpan ke IndexedDB Lokal)]
    SaveIDB --> UpdateUI[Perbarui UI Dashboard & Sisa Safe-to-Spend Lokal]
    
    UpdateUI --> CheckNet{Koneksi Internet Aktif?}
    
    CheckNet -- Tidak (Offline) --> FlagPending[Tandai is_synced = FALSE]
    FlagPending --> WaitOnline[Dengarkan Event Browser 'online']
    WaitOnline --> TriggerSync[Koneksi Pulih: Trigger Background Sync]
    
    CheckNet -- Ya (Online) --> TriggerSync
    
    TriggerSync --> PostSync[POST /api/v1/sync/transactions]
    PostSync --> SupaUpsert[(Supabase Upsert ke PostgreSQL)]
    
    SupaUpsert --> RLSCheck{Lolos Row Level Security?}
    RLSCheck -- Gagal --> SyncErr[Tampilkan Indikator Sync Error]
    RLSCheck -- Berhasil --> FlagSuccess[Perbarui is_synced = TRUE di IndexedDB]
    FlagSuccess --> SyncDone([Status Sinkron Selesai])

```

## 2. Entity Relationship Diagram (ERD)

Struktur tabel relasional PostgreSQL pada Supabase, lengkap dengan relasi dan skema ekstensi autentikasi.

```
erDiagram
    PROFILES ||--o{ WALLETS : "has"
    PROFILES ||--o{ CATEGORIES : "defines"
    PROFILES ||--o{ BUDGETS : "allocates"
    PROFILES ||--o{ RECURRING_RULES : "schedules"
    PROFILES ||--o{ TRANSACTIONS : "logs"

    WALLETS ||--o{ TRANSACTIONS : "stores"
    WALLETS ||--o{ RECURRING_RULES : "executes_from"

    CATEGORIES ||--o{ BUDGETS : "constrained_by"
    CATEGORIES ||--o{ RECURRING_RULES : "categorizes"
    CATEGORIES ||--o{ TRANSACTIONS : "classifies"

    RECURRING_RULES ||--o{ TRANSACTIONS : "generates"

    PROFILES {
        uuid id PK "references auth.users"
        text email
        text full_name
        text avatar_url
        numeric monthly_salary
        int payday_date
        text subscription_status
        timestamptz trial_ends_at
        timestamptz subscription_ends_at
        timestamptz created_at
        timestamptz updated_at
    }

    WALLETS {
        uuid id PK
        uuid user_id FK
        text name
        boolean is_default
        timestamptz created_at
    }

    CATEGORIES {
        uuid id PK
        uuid user_id FK "nullable for global templates"
        text name
        text icon
        text color
        text type
        timestamptz created_at
    }

    BUDGETS {
        uuid id PK
        uuid user_id FK
        uuid category_id FK
        numeric monthly_limit
        timestamptz created_at
        timestamptz updated_at
    }

    RECURRING_RULES {
        uuid id PK
        uuid user_id FK
        uuid wallet_id FK
        uuid category_id FK
        text title
        numeric amount
        int execution_day
        boolean is_active
        date last_executed_at
        timestamptz created_at
        timestamptz updated_at
    }

    TRANSACTIONS {
        uuid id PK "client generated"
        uuid user_id FK
        uuid wallet_id FK
        uuid category_id FK
        numeric amount
        text type
        date transaction_date
        text notes
        boolean is_recurring_instance
        uuid recurring_rule_id FK
        timestamptz created_at
        timestamptz synced_at
    }

```

## 3. Sequence Diagram per Modul

### Modul A: Sinkronisasi Transaksi Offline-First (Sync Engine)

```
sequenceDiagram
    autonumber
    actor Usep
    participant PWA as PWA Client (React/Next.js)
    participant IDB as Local IndexedDB (Dexie)
    participant API as Vercel Edge API (/sync/transactions)
    participant DB as Supabase PostgreSQL

    Usep->>PWA: Masukkan transaksi pengeluaran (offline)
    PWA->>PWA: Buat UUID lokal & timestamp
    PWA->>IDB: Simpan data (is_synced = FALSE)
    IDB-->>PWA: Tersimpan (<100ms)
    PWA-->>Usep: Update tampilan sisa safe-to-spend seketika

    Note over PWA,API: Koneksi internet tersambung kembali (event: online)

    PWA->>IDB: Query transaksi dengan is_synced == FALSE
    IDB-->>PWA: Kembalikan antrean data
    PWA->>API: POST /api/v1/sync/transactions (Payload antrean + JWT)
    API->>DB: INSERT ... ON CONFLICT (id) DO UPDATE
    DB-->>API: Berhasil tersimpan (Idempotent)
    API-->>PWA: Response 200 OK (synced_count: N)
    PWA->>IDB: Update status is_synced = TRUE
    PWA-->>Usep: Ubah badge status menjadi 'Synced' (Awan Hijau)

```

### Modul B: Mesin Otomasi Tagihan Bulanan (Monthly Fee Engine)

```
sequenceDiagram
    autonumber
    participant Cron as Vercel Cron (00:05 WIB)
    participant API as Vercel Serverless (/cron/execute-recurring)
    participant DB as Supabase PostgreSQL

    Cron->>API: Trigger POST dengan Bearer VERCEL_CRON_SECRET
    API->>API: Verifikasi Bearer Token
    API->>DB: SELECT * FROM recurring_rules WHERE execution_day == CurrentDay AND is_active == TRUE
    DB-->>API: Daftar tagihan aktif (kos, wi-fi, streaming)
    
    loop Setiap Tagihan
        API->>DB: INSERT INTO transactions (id, user_id, amount, is_recurring_instance = TRUE, recurring_rule_id)
        API->>DB: UPDATE recurring_rules SET last_executed_at = CURRENT_DATE WHERE id = rule.id
    end
    
    DB-->>API: Transaksi berhasil dibuat
    API-->>Cron: Response 200 OK (executed_rules_count: N)

```

### Modul C: Alur Pembayaran Manual & Grant Access via Supabase Table Editor

```
sequenceDiagram
    autonumber
    actor Usep as Teman Kantor (Usep)
    participant PWA as PWA Client
    actor Admin as Lu (Owner / Admin)
    participant WA as WhatsApp
    participant Supa as Supabase Table Editor

    Usep->>PWA: Buka Menu Budgeting / Klik Export (Hari ke-31)
    PWA->>PWA: Cek subscription_status: EXPIRED
    PWA-->>Usep: Tampilkan Modal QRIS Pribadi & Rekening Bank

    Usep->>Usep: Transfer Rp10.000 via M-Banking / E-Wallet
    Usep->>PWA: Klik 'Kirim Bukti via WhatsApp'
    PWA->>WA: Buka WhatsApp ke kontak Owner dengan template otomatis
    Usep->>WA: Kirim pesan konfirmasi + lampiran screenshot bukti transfer
    
    WA-->>Admin: Notifikasi pesan masuk di HP Owner
    Admin->>Admin: Cek mutasi rekening / e-wallet (Transfer Rp10.000 terverifikasi)
    
    Admin->>Supa: Buka Dashboard Supabase di browser HP
    Admin->>Supa: Masuk ke tabel 'profiles' -> Cari email Usep
    Admin->>Supa: Ubah subscription_status = 'ACTIVE' & tambah subscription_ends_at (+30 hari)
    Supa-->>Admin: Simpan baris data
    
    Admin->>WA: Balas chat Usep ("Akun Pro lu udah aktif bro!")
    Usep->>PWA: Buka kembali aplikasi (Refresh)
    PWA-->>Usep: Fitur Budgeting, Monthly Fee & Export terbuka penuh

```