# User Stories & Acceptance Criteria — Smart Daily Expense Tracker (PWA)

**Project Name:** Dompetku / Smart Daily Expense Tracker  
**Target User Persona:** Usep (Karyawan Gen-Z, 23 tahun) & Admin (Pemilik Aplikasi)  
**Skema Monetisasi:** Soft-Lock (Trial 30 Hari) + Transfer Manual QRIS/Bank Pribadi + Konfirmasi WhatsApp  
**Versi:** 1.1 (Manual Grant Edition)

---

## Modul 1: Onboarding, Setup Siklus Gaji & Masa Trial

### US-1.1: Registrasi Akun & Inisialisasi Free Trial 30 Hari
* **Sebagai:** Pengguna baru (Usep),
* **Saya ingin:** Mendaftar akun dengan cepat via Google OAuth atau email manual,
* **Agar:** Saya bisa langsung memakai aplikasi tanpa registrasi yang rumit dan langsung mendapatkan akses fitur lengkap.

#### Acceptance Criteria (AC):
1. Pengguna dapat mendaftar menggunakan Google OAuth satu klik atau memasukkan email dan password.
2. Saat pendaftaran berhasil, sistem secara otomatis:
   * Mengatur `subscription_status = 'TRIAL'`.
   * Mengatur `trial_ends_at = NOW() + INTERVAL '30 days'`.
   * Membuat satu dompet bawaan (`is_default = TRUE`).
3. Pengguna langsung diarahkan ke layar konfigurasi awal (gaji dan tanggal gajian).

---

### US-1.2: Konfigurasi Gaji & Tanggal Gajian
* **Sebagai:** Karyawan (Usep),
* **Saya ingin:** Mengatur nominal gaji bulanan dan tanggal gajian saya,
* **Agar:** Perhitungan "Aman Belanja Hari Ini" (*Safe-to-Spend*) berjalan akurat sesuai siklus finansial saya.

#### Acceptance Criteria (AC):
1. Tersedia input angka untuk nominal gaji bulanan (contoh: `Rp5.000.000`) dengan pemisah ribuan otomatis.
2. Tersedia pemilih tanggal gajian (angka 1 s/d 31, default: tanggal 25).
3. Data tersimpan di tabel `profiles` dan langsung mengalkulasi sisa hari serta Safe-to-Spend pada halaman beranda.

---

## Modul 2: Pencatatan Transaksi & Algoritma Safe-to-Spend

### US-2.1: Pencatatan Pengeluaran Cepat (< 5 Detik)
* **Sebagai:** Pengguna yang sedang sibuk nongkrong/makan (Usep),
* **Saya ingin:** Mencatat transaksi pengeluaran dalam hitungan detik tanpa membuka keyboard HP bawaan,
* **Agar:** Kebiasaan mencatat uang tidak terasa merepotkan dan tidak terlupa.

#### Acceptance Criteria (AC):
1. Menekan tombol `(+)` di bawah layar langsung memunculkan Quick Numpad Drawer dari bawah.
2. Layar drawer menampilkan input angka besar dengan tombol kustom numpad di layar (1-9, 0, 000, ⌫).
3. Pemilihan kategori berupa satu kali tap pada ikon/emoji (Makan, Kopi, Transport, Belanja, Kosan, Hiburan).
4. Menekan tombol `[ Simpan Transaksi ✓ ]` menutup drawer dan langsung memperbarui angka Safe-to-Spend seketika.

---

### US-2.2: Mode Offline-First & Indikator Sinkronisasi
* **Sebagai:** Pengguna yang sering berada di area sinyal lemah (basement/lift),
* **Saya ingin:** Tetap bisa membuka aplikasi dan mencatat pengeluaran tanpa internet,
* **Agar:** Pengalaman pakai aplikasi tidak macet saat koneksi offline.

#### Acceptance Criteria (AC):
1. Setiap transaksi baru langsung disimpan ke IndexedDB browser lokal secara instan (< 100ms).
2. Badge status di pojok kanan atas menampilkan status koneksi:
   * Warna Hijau (`Cloud Synced`): Semua data lokal sudah tersimpan di server awan.
   * Warna Kuning / Kedip (`Pending Sync`): Ada data lokal yang belum terunggah ke database awan.
3. Saat koneksi internet kembali aktif (`online` event), aplikasi otomatis menjalankan sinkronisasi latar belakang ke endpoint Supabase.

---

## Modul 3: Otomasi Tagihan Bulanan & Pos Anggaran

### US-3.1: Otomasi Tagihan Rutin (Monthly Fee Automation)
* **Sebagai:** Pengguna yang punya pengeluaran tetap bulanan (Usep),
* **Saya ingin:** Mendaftarkan tagihan rutin (kosan, Wi-Fi, langganan streaming) agar terpotong otomatis setiap bulannya,
* **Agar:** Saya tidak perlu mengulang input transaksi yang sama setiap bulan.

#### Acceptance Criteria (AC):
1. Pengguna dapat mendaftarkan aturan tagihan rutin berisi: Nama Tagihan, Nominal, Kategori, dan Tanggal Potong (1-31).
2. Serverless Cron Job berjalan otomatis setiap tengah malam untuk mengeksekusi tagihan yang jatuh tempo hari ini.
3. Transaksi hasil otomasi ditandai dengan badge khusus `"Auto"` di daftar riwayat mutasi.
4. Nominal tagihan yang belum terpotong pada bulan berjalan otomatis menjadi pengurang dalam rumus Safe-to-Spend.

---

### US-3.2: Guardrail Pos Anggaran (Budgeting)
* **Sebagai:** Pengguna yang ingin membatasi pos gaya hidup (nongkrong/kopi),
* **Saya ingin:** Melihat sisa kuota bujet per kategori dengan indikator visual,
* **Agar:** Saya sadar sebelum uang untuk pos tersebut habis terpakai.

#### Acceptance Criteria (AC):
1. Pengguna dapat menentukan limit bulanan pada kategori tertentu.
2. Setiap kartu kategori menampilkan bar persentase:
   * Hijau: Pengeluaran < 75% limit.
   * Kuning: Pengeluaran 75% - 99% limit (peringatan waspada).
   * Merah: Pengeluaran $\ge$ 100% (peringatan overbudget).

---

## Modul 4: Soft-Lock Paywall & Aktivasi Manual via WhatsApp

### US-4.1: Trigger Soft-Lock Paywall
* **Sebagai:** Pengguna yang masa free trial 30 harinya telah berakhir,
* **Saya ingin:** Mendapatkan informasi transparan tentang status langganan dan instruksi aktivasi,
* **Agar:** Saya memahami nilai fitur Pro dan mengetahui cara memperpanjang akses.

#### Acceptance Criteria (AC):
1. Jika `subscription_status == 'EXPIRED'` atau (`subscription_status == 'TRIAL'` dan `NOW() > trial_ends_at`):
   * Fitur dasar (pencatatan transaksi harian) tetap dapat digunakan secara gratis.
   * Akses ke menu **Budgeting**, **Tagihan Rutin**, dan **Export Laporan** memunculkan modal Paywall Soft-Lock.
2. Modal Paywall Soft-Lock menampilkan:
   * Headline: "Masa Free Trial 30 Hari Selesai".
   * Ringkasan benefit Pro (Otomasi Tagihan, Smart Budgeting, Export Data).
   * Harga jelas: "Langganan Pro — Hanya Rp10.000 / bulan".
   * Gambar QRIS Statis pribadi pemilik dan alternatif nomor rekening bank/e-wallet.

---

### US-4.2: Konfirmasi Pembayaran Melalui WhatsApp Deep Link
* **Sebagai:** Pengguna yang sudah mentransfer uang langganan Rp10.000,
* **Saya ingin:** Menghubungi admin langsung melalui WhatsApp dengan pesan yang sudah terisi otomatis,
* **Agar:** Saya tidak perlu mengetik ulang data email atau detail pembayaran saya.

#### Acceptance Criteria (AC):
1. Tombol utama pada modal bertuliskan `[ Konfirmasi Pembayaran (WA) ]`.
2. Saat tombol ditekan, aplikasi membuka aplikasi WhatsApp menuju nomor admin dengan format pesan dinamis:
   ```text
   Halo bro, gue mau konfirmasi langganan Pro Dompetku untuk:
   Email Akun: usep@kantor.com
   Nama: Usep
   Bukti transfer terlampir ya!
   ```
3. Pengguna melampirkan screenshot bukti transfer pada ruang chat WhatsApp tersebut.

---

### US-4.3: Manual Grant Access oleh Admin (Backoffice Flow)
* **Sebagai:** Pemilik aplikasi / Admin,
* **Saya ingin:** Mengaktifkan status Pro pengguna secara langsung dari database tanpa koding sistem pembayaran otomatis,
* **Agar:** Saya tidak perlu mengurus verifikasi KYC, biaya MDR payment gateway, atau pemeliharaan webhook yang rumit.

#### Acceptance Criteria (AC):
1. Admin menerima notifikasi chat WhatsApp beserta bukti transfer sebesar Rp10.000 dari pengguna.
2. Admin membuka browser ke **Supabase Dashboard** $\rightarrow$ **Table Editor** $\rightarrow$ tabel **`profiles`**.
3. Admin mencari baris data pengguna berdasarkan email pengguna yang tertera di chat.
4. Admin melakukan perubahan nilai kolom secara langsung (*inline edit*):
   * `subscription_status` diubah menjadi `'ACTIVE'`.
   * `subscription_ends_at` diatur ke tanggal $+30$ hari ke depan dari hari verifikasi.
5. Perubahan data tersimpan. Saat pengguna membuka atau merefresh aplikasi di ponselnya, seluruh fitur Pro langsung terbuka kembali.