/**
 * Konfigurasi Maintenance Mode sisa.in
 * 
 * - Saat enabled = true:
 *   - Di PRODUCTION: Aplikasi langsung menampilkan MaintenanceScreen, tanpa koneksi ke Supabase / DB.
 *   - Di LOCAL (development): Tetap jalan normal agar developer bisa coding & testing,
 *     kecuali jika env NEXT_PUBLIC_MAINTENANCE_MODE=true atau URL memiliki query param ?maintenance=preview.
 * - Developer bisa bypass maintenance di production dengan menambahkan ?bypass=dev pada URL.
 */

export const MAINTENANCE_CONFIG = {
  enabled: true, // Set ke false jika maintenance database/fitur sudah beres
  title: 'Sedang Ada Pembaruan Sistem',
  subtitle: 'Kami sedang melakukan pemeliharaan database & peningkatan enkripsi keamanan untuk melindungi privasi finansialmu.',
  estimatedTime: 'Segera (Hari Ini)',
};

export function isMaintenanceActive(): boolean {
  // 1. Cek query param atau localStorage untuk developer bypass / preview (hanya di browser)
  if (typeof window !== 'undefined') {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('bypass') === 'dev') {
        localStorage.setItem('sisain_maintenance_bypass', 'true');
        return false;
      }
      if (urlParams.get('bypass') === 'reset') {
        localStorage.removeItem('sisain_maintenance_bypass');
      }
      if (localStorage.getItem('sisain_maintenance_bypass') === 'true') {
        return false;
      }
      if (urlParams.get('maintenance') === 'preview') {
        return true;
      }
    } catch {}
  }

  // 2. Cek explicit environment variable override
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'false') return false;
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true') return true;

  // 3. Di environment local development (npm run dev), jangan halangi developer
  if (process.env.NODE_ENV === 'development') {
    return false;
  }

  // 4. Di production, gunakan status dari config
  return MAINTENANCE_CONFIG.enabled;
}
