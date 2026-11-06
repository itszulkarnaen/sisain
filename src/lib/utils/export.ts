import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { Transaction, Category } from '@/types';
import { formatRupiah } from './currency';

export function exportTransactionsToExcel(
  transactions: Transaction[],
  categories: Category[],
  fileName: string = 'NineToPay_Laporan_Keuangan.xlsx'
) {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const rows = transactions.map((tx) => ({
    Tanggal: tx.transaction_date,
    Tipe: tx.type === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan',
    Kategori: categoryMap.get(tx.category_id) || 'Lain-lain',
    Catatan: tx.notes || '-',
    Nominal: tx.amount,
    'Auto/Rutin': tx.is_recurring_instance ? 'Ya' : 'Tidak',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaksi');
  XLSX.writeFile(workbook, fileName);
}

export function exportTransactionsToPDF(
  transactions: Transaction[],
  categories: Category[],
  userName: string = 'Usep',
  totalExpense: number = 0,
  totalIncome: number = 0
) {
  const doc = new jsPDF();
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  // Header
  doc.setFontSize(18);
  doc.text('NineToPay — Laporan Keuangan', 14, 20);

  doc.setFontSize(10);
  doc.text(`Pemilik Akun: ${userName}`, 14, 28);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 34);

  // Summary box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(245, 247, 250);
  doc.rect(14, 38, 182, 20, 'FD');

  doc.text(`Total Pemasukan: ${formatRupiah(totalIncome)}`, 20, 48);
  doc.text(`Total Pengeluaran: ${formatRupiah(totalExpense)}`, 85, 48);
  doc.text(`Selisih: ${formatRupiah(totalIncome - totalExpense)}`, 145, 48);

  // Table header
  let y = 68;
  doc.setFont('helvetica', 'bold');
  doc.text('Tanggal', 14, y);
  doc.text('Tipe', 42, y);
  doc.text('Kategori', 75, y);
  doc.text('Catatan', 120, y);
  doc.text('Nominal', 170, y);

  doc.setLineWidth(0.5);
  doc.line(14, y + 2, 196, y + 2);

  // Rows
  doc.setFont('helvetica', 'normal');
  y += 8;

  for (const tx of transactions) {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }

    const catName = categoryMap.get(tx.category_id) || 'Umum';
    const amountStr = (tx.type === 'EXPENSE' ? '-' : '+') + formatRupiah(tx.amount);

    doc.text(tx.transaction_date, 14, y);
    doc.text(tx.type === 'EXPENSE' ? 'Keluar' : 'Masuk', 42, y);
    doc.text(catName.substring(0, 18), 75, y);
    doc.text((tx.notes || '-').substring(0, 22), 120, y);
    doc.text(amountStr, 170, y);

    y += 7;
  }

  doc.save('NineToPay_Laporan.pdf');
}

