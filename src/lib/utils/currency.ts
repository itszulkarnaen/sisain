export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp0';
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absAmount).replace(/\s+/g, '');

  return isNegative ? `-${formatted}` : formatted;
}

export function formatNumberOnly(amount: number): string {
  if (isNaN(amount)) return '0';
  return new Intl.NumberFormat('id-ID').format(amount);
}

/**
 * Mengubah string / number input menjadi format Rupiah dengan pemisah ribuan titik.
 * Contoh: "8000000" -> "Rp 8.000.000"
 */
export function formatRupiahInput(value: string | number, withPrefix: boolean = true): string {
  if (value === '' || value === null || value === undefined) return '';
  const cleanStr = String(value).replace(/\D/g, '');
  if (!cleanStr) return '';
  const num = parseInt(cleanStr, 10);
  if (isNaN(num)) return '';
  const formatted = new Intl.NumberFormat('id-ID').format(num);
  return withPrefix ? `Rp ${formatted}` : formatted;
}

/**
 * Mengambil angka murni (number) dari string berformat Rupiah
 * Contoh: "Rp 8.000.000" -> 8000000
 */
export function parseRupiahInput(formattedValue: string | number | null | undefined): number {
  if (!formattedValue) return 0;
  const cleanStr = String(formattedValue).replace(/\D/g, '');
  return cleanStr ? parseInt(cleanStr, 10) : 0;
}

