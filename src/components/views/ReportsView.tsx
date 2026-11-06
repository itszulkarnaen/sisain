'use client';

import React, { useState } from 'react';
import { Transaction, Category } from '@/types';
import { formatRupiah } from '@/lib/utils/currency';
import { exportTransactionsToExcel, exportTransactionsToPDF } from '@/lib/utils/export';
import { FileSpreadsheet, FileText, Search } from 'lucide-react';

interface ReportsViewProps {
  transactions: Transaction[];
  categories: Category[];
  isProOrTrial: boolean;
  onLockedFeatureClick: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  categories,
  isProOrTrial,
  onLockedFeatureClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Calculate totals
  let totalExpense = 0;
  let totalIncome = 0;
  const categoryExpenses: Record<string, number> = {};

  for (const tx of transactions) {
    if (tx.type === 'EXPENSE') {
      totalExpense += tx.amount;
      categoryExpenses[tx.category_id] = (categoryExpenses[tx.category_id] || 0) + tx.amount;
    } else {
      totalIncome += tx.amount;
    }
  }

  // Filtered transactions for search
  const filteredTransactions = transactions.filter((tx) => {
    const notesMatch = tx.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const catName = categoryMap.get(tx.category_id)?.name.toLowerCase() || '';
    const catMatch = catName.includes(searchQuery.toLowerCase());
    return notesMatch || catMatch;
  });

  const handleExportExcel = () => {
    if (!isProOrTrial) {
      onLockedFeatureClick();
      return;
    }
    exportTransactionsToExcel(transactions, categories);
  };

  const handleExportPDF = () => {
    if (!isProOrTrial) {
      onLockedFeatureClick();
      return;
    }
    exportTransactionsToPDF(transactions, categories, 'Usep', totalExpense, totalIncome);
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="px-1">
        <h2 className="text-lg font-bold text-slate-900">Analitik & Laporan</h2>
        <p className="text-xs text-slate-500">
          Ringkasan arus kas, proporsi pos pengeluaran, dan unduhan pembukuan.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400">Total Pengeluaran</p>
          <p className="text-base font-extrabold text-rose-600 mt-0.5">
            -{formatRupiah(totalExpense)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400">Total Pemasukan</p>
          <p className="text-base font-extrabold text-emerald-600 mt-0.5">
            +{formatRupiah(totalIncome)}
          </p>
        </div>
      </div>

      {/* Category Breakdown Bars */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800">Proporsi Pengeluaran</h3>
        {Object.keys(categoryExpenses).length === 0 ? (
          <p className="text-xs text-slate-400 italic">Belum ada data pengeluaran.</p>
        ) : (
          Object.entries(categoryExpenses)
            .sort(([, a], [, b]) => b - a)
            .map(([catId, amount]) => {
              const cat = categoryMap.get(catId);
              const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;

              return (
                <div key={catId} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span>{cat?.icon || '📦'}</span>
                      <span>{cat?.name || 'Lain-lain'}</span>
                    </span>
                    <span>
                      {formatRupiah(amount)} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: cat?.color || '#6366F1',
                      }}
                    />
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Export Section */}
      <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/60 rounded-2xl p-4 border border-indigo-100 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900">Ekspor Laporan (Excel & PDF)</h3>
            <p className="text-[11px] text-slate-500">
              Download cadangan pembukuan ke smartphone atau laptop.
            </p>
          </div>
          {!isProOrTrial && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              Pro Feature
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 text-xs font-bold text-slate-700 shadow-xs transition active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Unduh Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white border border-slate-200 hover:border-rose-500 hover:text-rose-600 text-xs font-bold text-slate-700 shadow-xs transition active:scale-95"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Unduh PDF</span>
          </button>
        </div>
      </div>

      {/* Search & Transaction History */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Cari transaksi berdasarkan catatan atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-hidden text-xs text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden shadow-xs">
          {filteredTransactions.slice(0, 15).map((tx) => {
            const cat = categoryMap.get(tx.category_id);
            return (
              <div key={tx.id} className="p-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">{tx.notes || cat?.name || 'Transaksi'}</p>
                  <p className="text-[11px] text-slate-400">
                    {tx.transaction_date} • {cat?.name}
                  </p>
                </div>
                <span
                  className={
                    tx.type === 'EXPENSE' ? 'font-bold text-slate-900' : 'font-bold text-emerald-600'
                  }
                >
                  {tx.type === 'EXPENSE' ? '-' : '+'}
                  {formatRupiah(tx.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
