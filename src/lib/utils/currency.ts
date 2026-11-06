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

