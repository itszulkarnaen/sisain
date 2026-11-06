# Strategic Lean Canvas: Smart Daily Expense Tracker (MVP v1.0)

**Model:** Mobile-First Web App (PWA) with Hybrid Offline-First Sync  
**Target Monetisasi:** Soft-Lock Premium (Rp10.000 / Bulan) pasca Free Trial 30 Hari

---

| Blok Lean Canvas | Deskripsi Rinci Implementasi |
| :--- | :--- |
| **Problem (Masalah Utama)** | 1. **Pengeluaran Rutin Manual:** Tagihan bulanan (*monthly fee*) seperti kos, internet, dan langganan digital harus diinput berulang kali secara manual dan rawan terlewat.<br>2. **Pencatatan Pasif:** Aplikasi eksisting hanya mencatat histori transaksi tanpa proteksi bujet yang memberi sinyal batas aman belanja harian.<br>3. **Data Rentan Hilang:** Penyimpanan lokal di perangkat berisiko hilang saat ganti smartphone karena tiadanya sinkronisasi cloud.<br>4. **Kesenjangan Platform:** Fragmentasi ketersediaan aplikasi antara Android (Google Play Store) dan iOS (Apple App Store). |
| **Customer Segments (Target Pasar)** | • **Target Inti:** Pekerja muda Gen-Z (*first-jobbers* dan karyawan kantoran) yang memiliki penghasilan bulanan tetap.<br>• **Karakteristik:** Melek digital, *mobile-first*, memprioritaskan estetika visual yang bersih, dan mengutamakan kecepatan interaksi.<br>• **Early Adopters:** Pengguna aktif aplikasi Catatan Keuangan, Monekin, Money+, atau Google Sheets yang membutuhkan otomasi dan sinkronisasi awan. |
| **Unique Value Proposition (UVP)** | Aplikasi pencatatan transaksi & pengelola gaji harian yang simpel dan lucu, dilengkapi otomasi potongan bulanan serta penyimpanan cloud lintas perangkat tanpa perlu instalasi aplikasi store. |
| **Solution (Solusi MVP)** | 1. **Monthly Fee Automation:** Penjadwalan transaksi rutin bulanan yang dieksekusi otomatis oleh server pada tanggal tertentu.<br>2. **Simple Salary Budgeting:** Alokasi batas bujet bulanan per kategori dan kalkulator indikator sisa uang belanja harian (*safe-to-spend*).<br>3. **Centralized Cloud Database:** Penyimpanan data terpusat berbasis akun pengguna (Google Auth / Email).<br>4. **Mobile-First PWA:** Web aplikasi responsif dengan kapabilitas *Add to Home Screen* yang dapat diakses dari OS mana saja.<br>5. **Export Data:** Penyediaan fitur unduh riwayat keuangan dalam format Excel (.xlsx) dan PDF. |
| **Channels (Kanal Distribusi)** | • **Organik Media Sosial:** Konten tips budgeting dan showcase estetika UI di TikTok, Instagram Reels, dan X (Twitter).<br>• **Komunitas & Rekan Kerja:** Word-of-Mouth melalui *closed beta testing* di lingkungan kantor.<br>• **Web Distribution:** Distribusi langsung via tautan URL PWA tanpa perantara review store. |
| **Revenue Streams (Model Pendapatan)** | **Soft-Lock Premium Subscription:**<br>• Pengguna baru mendapatkan **Free Trial 30 Hari** akses seluruh fitur.<br>• Masuk hari ke-31, fitur dasar (catat manual, custom kategori, cloud sync, grafik ringkas) tetap gratis selamanya.<br>• Fitur unggulan (*Budgeting*, *Monthly Fee Automation*, dan *Export Data*) di-soft lock dan dapat dibuka dengan biaya langganan **Rp10.000 / bulan**. |
| **Cost Structure (Struktur Biaya)** | • Biaya sewa server cloud & managed database.<br>• Biaya domain tahunan.<br>• Biaya komisi transaksi / Payment Gateway (MDR QRIS / e-wallet). |
| **Key Metrics (Metrik Keberhasilan)** | 1. **User Retention:** Retensi aktif mingguan dan bulanan (konsistensi mencatat pasca tanggal gajian).<br>2. **Weekly Transactions:** Rata-rata transaksi tercatat per user aktif ($> 5$ entri/minggu).<br>3. **Feature Activation:** Persentase pengguna yang mengaktifkan fitur *Monthly Fee Automation* & *Budgeting*.<br>4. **Trial-to-Paid Conversion Rate:** Persentase user aktif yang meng-upgrade akun ke Rp10.000/bulan setelah masa 30 hari berakhir. |
| **Unfair Advantage (Keunggulan Bersaing)** | **Arsitektur Hybrid Offline-First PWA & Cloud Account Sync:** Pengguna mendapatkan kecepatan input lokal seketika ($< 5$ detik) tanpa hambatan kuota/sinyal via IndexedDB, dengan sinkronisasi otomatis ke cloud server lintas platform dan mesin tagihan bulanan mandiri di server. |

---

## Catatan Parking Lot (Backlog V2.0+)

* **Segmen Bisnis/Freelancer:** Ditangguhkan dari MVP v1.0 untuk menjaga kecepatan rilis.
* **Fitur Masa Depan:** Multi-Wallet (pemisahan dompet operasional usaha vs domestik pribadi) dan kalkulator *Cash Runway*.
* **Antisipasi Database MVP:** Skema tabel transaksi MVP v1.0 disiapkan dengan atribut `wallet_id` (default: `main_wallet`) agar migrasi multi-wallet di versi 2.0 tidak merombak skema data.