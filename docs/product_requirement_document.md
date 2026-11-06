# Product Requirement Document (PRD) — MVP v1.0

**Nama Produk (Tentatif):** Smart Daily Expense Tracker  
**Target Pengguna:** Usep (Karyawan Gen-Z & First-Jobber)  
**Tipe Platform:** Progressive Web App (PWA) — Mobile-First  
**Dokumen Versi:** 1.0 (Baseline Scope)

---

## 1. Pendahuluan & Latar Belakang

Aplikasi pencatatan keuangan harian saat ini mengalami kesenjangan: aplikasi gratisan di Play Store sering kali tidak tersedia di iOS, didominasi penyimpanan data lokal yang rentan hilang saat ganti perangkat, serta menuntut penginputan manual berulang kali untuk tagihan tetap bulanan. 

Produk ini hadir sebagai aplikasi web *Mobile-First (PWA)* yang menggabungkan kecepatan input *Offline-First*, sinkronisasi akun berbasis cloud, otomasi tagihan berulang, serta sistem proteksi anggaran gaji bulanan.

---

## 2. Metrik Keberhasilan (KPI)

* **Speed to Log:** Waktu rata-rata dari membuka aplikasi hingga transaksi tersimpan $< 5$ detik.
* **Logging Habit:** Rata-rata transaksi tercatat $> 5$ entri per user aktif per minggu.
* **Core Adoption:** $> 40\%$ pengguna aktif mengonfigurasi minimal 1 aturan *Monthly Fee Automation*.
* **Monetization KPI:** *Trial-to-Paid Conversion Rate* mencapai target minimal $5 - 8\%$ setelah masa 30 hari habis.

---

## 3. Ruang Lingkup Fitur (MoSCoW Framework)

### A. Must-Have (MVP v1.0)
1. **Autentikasi & Akun:** Login berbasis Google OAuth dan Magic Link / Email.
2. **Hybrid Offline-First Sync:** Penginputan transaksi via IndexedDB lokal saat tanpa koneksi internet, otomatis tersinkronisasi ke PostgreSQL server saat online.
3. **Pencatatan Cepat & Kategori Dinamis:** Numpad terintegrasi di halaman utama, dukungan kustomisasi nama kategori, ikon/emoji, dan warna.
4. **Siklus Gajian & Budgeting:** Kustomisasi tanggal gajian, limit anggaran per kategori, dan metrik *Safe-to-Spend* harian.
5. **Monthly Fee Automation:** Penjadwalan transaksi rutin bulanan otomatis.
6. **Riwayat & Visualisasi Ringkas:** Pencarian histori instan dan grafik proporsi pengeluaran (*Donut/Bar Chart*).
7. **Export Data:** Pengunduhan laporan pembukuan ke format Excel (.xlsx) dan PDF.
8. **Subscription & Soft-Lock:** Manajemen masa Free Trial 30 hari dan integrasi Payment Gateway Rp10.000/bulan.

### B. Won't-Have (Ditunda ke V2.0+)
* Manajemen Multi-Wallet / Multi-Rekening (rekening kantor vs pribadi).
* Kalkulator proyeksi ketahanan kas bisnis (*cash runway*).
* Scan struk belanja otomatis berbasis Optical Character Recognition (OCR).
* Sinkronisasi otomatis open-banking / mutasi bank.

---

## 4. Aturan Bisnis Inti (Business Rules)

### BR-01: Siklus Tanggal Gajian (Custom Payday Cycle)
* Periode pembukuan tidak terpaku pada tanggal 1 kalender. Pengguna dapat memilih tanggal gajian (misal: tanggal 25).
* Rentang siklus berjalan dihitung dari tanggal gajian bulan ini sampai H-1 tanggal gajian bulan berikutnya (misal: 25 Okt – 24 Nov).

### BR-02: Formula Safe-to-Spend Harian
Indikator batas belanja aman harian dihitung secara otomatis dengan rumus:
$$\text{Safe-to-Spend Harian} = \frac{\text{Sisa Gaji Periode Berjalan} - \text{Total Tagihan Rutin yang Belum Terpotong}}{\text{Sisa Hari Menuju Tanggal Gajian}}$$

### BR-03: Eksekusi Monthly Fee Automation
* Server menjalankan scheduler (*cron job*) harian pada pukul 00:05 WIB.
* Jika pengguna mengatur jadwal eksekusi pada tanggal 31, sementara bulan berjalan hanya sampai tanggal 28, 29, atau 30, sistem secara otomatis mengeksekusi pemotongan pada hari terakhir di bulan tersebut.
* Saldo periode berjalan otomatis terpotong dan transaksi diberi label penanda khusus `Auto / Rutin`.

### BR-04: Mekanisme Soft-Lock Monetisasi (Hari ke-31)
* Seluruh pengguna baru berhak atas akses **Free Trial Pro selama 30 hari kalender**.
* Pada hari ke-31 (apabila status langganan belum aktif berbayar):
  * Pengguna **tetap memiliki akses penuh** untuk mencatat transaksi manual, melihat riwayat data, dan sinkronisasi cloud.
  * Jadwal *Monthly Fee Automation* otomatis diubah menjadi status `Paused`.
  * Halaman rincian *Budgeting* dan tombol *Export Data (Excel/PDF)* dikunci dengan pop-up penawaran langganan Rp10.000/bulan.

### BR-05: Penanganan Idempotensi Offline-First
* Setiap pencatatan transaksi lokal saat offline wajib menghasilkan UUID v4 (`client_generated_id`) dan stempel waktu lokal (`created_at`).
* Saat koneksi internet tersambung kembali, payload sinkronisasi dikirim dengan mekanisme *idempotent upsert* untuk mencegah duplikasi data transaksi pada server.

---

## 5. Alur Pengguna Utama (Core User Flows)

### Flow 1: Onboarding Pengguna Baru ($< 30$ Detik)
1. Pengguna membuka URL PWA di browser ponsel.
2. Pengguna menekan tombol "Lanjutkan dengan Google".
3. Pengguna mengisi dua data konfigurasi: **Nominal Gaji Bulanan** dan **Tanggal Gajian**.
4. Sistem mengaktifkan status *Free Trial Pro (30 Hari)* dan mengarahkan pengguna ke Dashboard Utama.

### Flow 2: Pencatatan Transaksi Kilat ($< 5$ Detik)
1. Pengguna membuka PWA (langsung masuk ke layar input atau menekan tombol `+` besar).
2. Pengguna mengetik nominal angka (contoh: `25000`).
3. Pengguna memilih salah satu ikon kategori (contoh: `Makan Siang`).
4. Pengguna menekan tombol `Simpan`.
5. Data tersimpan ke IndexedDB lokal, status saldo serta nominal *Safe-to-Spend* langsung ter-update seketika, dan antrean sinkronisasi dikirim ke cloud.