'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Category } from '@/types';
import { formatRupiah } from '@/lib/utils/currency';
import { exportTransactionsToExcel, exportTransactionsToPDF } from '@/lib/utils/export';
import {
  FileSpreadsheet,
  FileText,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PieChart,
  History,
  Calendar,
  X,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { CuteDatePickerModal } from '@/components/common/CuteDatePickerModal';
import { CuteMonthPickerModal } from '@/components/common/CuteMonthPickerModal';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { clsx } from 'clsx';

interface ReportsViewProps {
  transactions: Transaction[];
  categories: Category[];
  isProOrTrial: boolean;
  userName?: string;
  onLockedFeatureClick: () => void;
  onItemClick?: (tx: Transaction) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  categories,
  isProOrTrial,
  userName = 'Pengguna',
  onLockedFeatureClick,
  onItemClick,
}) => {
  // Navigation / Tabs state
  const [activeTab, setActiveTab] = useState<'statistic' | 'historical'>('statistic');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  // Month navigation state for monthly cards & statistics
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => new Date());

  // Date range state in Historical tab (locked to selectedMonth)
  const [startDate, setStartDate] = useState(() =>
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(() =>
    format(endOfMonth(new Date()), 'yyyy-MM-dd')
  );
  const [pickingDateType, setPickingDateType] = useState<'START' | 'END' | null>(null);

  // Historical search & pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(15);

  // Synchronize date range whenever selectedMonth changes
  useEffect(() => {
    setStartDate(format(startOfMonth(selectedMonth), 'yyyy-MM-dd'));
    setEndDate(format(endOfMonth(selectedMonth), 'yyyy-MM-dd'));
    setVisibleCount(15);
  }, [selectedMonth]);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  // Filter transactions for the selected month (Used by Monthly Cards & Statistik Tab)
  const monthPrefix = useMemo(() => format(selectedMonth, 'yyyy-MM'), [selectedMonth]);

  const { monthlyTotalExpense, monthlyTotalIncome, monthlyCategoryExpenses } = useMemo(() => {
    let expense = 0;
    let income = 0;
    const catExpenses: Record<string, number> = {};

    for (const tx of transactions) {
      if (tx.transaction_date.startsWith(monthPrefix)) {
        if (tx.type === 'EXPENSE') {
          expense += tx.amount;
          catExpenses[tx.category_id] = (catExpenses[tx.category_id] || 0) + tx.amount;
        } else {
          income += tx.amount;
        }
      }
    }

    return {
      monthlyTotalExpense: expense,
      monthlyTotalIncome: income,
      monthlyCategoryExpenses: catExpenses,
    };
  }, [transactions, monthPrefix]);

  const sortedMonthlyCategoryExpenses = useMemo(() => {
    return Object.entries(monthlyCategoryExpenses).sort(([, a], [, b]) => b - a);
  }, [monthlyCategoryExpenses]);

  // Overall totals for full export
  const { totalExpenseAll, totalIncomeAll } = useMemo(() => {
    let expense = 0;
    let income = 0;
    for (const tx of transactions) {
      if (tx.type === 'EXPENSE') expense += tx.amount;
      else income += tx.amount;
    }
    return { totalExpenseAll: expense, totalIncomeAll: income };
  }, [transactions]);

  // SVG Donut calculation for Monthly Expense Proportion
  const donutSlices = useMemo(() => {
    if (monthlyTotalExpense === 0) return [];
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    return sortedMonthlyCategoryExpenses.map(([catId, amount]) => {
      const cat = categoryMap.get(catId);
      const ratio = amount / monthlyTotalExpense;
      const strokeDash = ratio * circumference;
      const strokeOffset = -accumulatedOffset;
      accumulatedOffset += strokeDash;

      return {
        catId,
        name: cat?.name || 'Lain-lain',
        color: cat?.color || '#6366F1',
        icon: cat?.icon,
        amount,
        percentage: Math.round(ratio * 100),
        strokeDasharray: `${strokeDash} ${circumference - strokeDash}`,
        strokeDashoffset: strokeOffset,
      };
    });
  }, [monthlyTotalExpense, sortedMonthlyCategoryExpenses, categoryMap]);

  // Filtered transactions for Historical Tab (locked to startDate & endDate)
  const filteredHistoricalTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Date range bounded strictly within selectedMonth
        if (startDate && tx.transaction_date < startDate) return false;
        if (endDate && tx.transaction_date > endDate) return false;

        // Search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const catName = categoryMap.get(tx.category_id)?.name.toLowerCase() || '';
          const notes = tx.notes?.toLowerCase() || '';
          if (!notes.includes(query) && !catName.includes(query)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const dateCmp = b.transaction_date.localeCompare(a.transaction_date);
        if (dateCmp !== 0) return dateCmp;
        return (b.created_at || '').localeCompare(a.created_at || '');
      });
  }, [transactions, startDate, endDate, searchQuery, categoryMap]);

  const displayedHistoricalTransactions = useMemo(() => {
    return filteredHistoricalTransactions.slice(0, visibleCount);
  }, [filteredHistoricalTransactions, visibleCount]);

  const hasMoreHistorical = visibleCount < filteredHistoricalTransactions.length;
  const remainingCount = filteredHistoricalTransactions.length - visibleCount;

  // Export handlers
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
    exportTransactionsToPDF(
      transactions,
      categories,
      userName,
      totalExpenseAll,
      totalIncomeAll
    );
  };

  const defaultMonthStart = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
  const defaultMonthEnd = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');
  const isCustomRangeActive = startDate !== defaultMonthStart || endDate !== defaultMonthEnd;

  return (
    <div className="space-y-4 pb-24">
      {/* Header with Compact Export Button */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Analitik & Laporan</h2>
          <p className="text-xs text-slate-500">
            Arus kas bulanan, proporsi pengeluaran, dan riwayat.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-[#7e7ef1] hover:text-[#7e7ef1] shadow-xs transition active:scale-95 shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-[#7e7ef1]" />
          <span>Ekspor</span>
          {!isProOrTrial && (
            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-700 ml-0.5">
              PRO
            </span>
          )}
        </button>
      </div>

      {/* Month Navigator for Monthly Scoped Cards */}
      <div className="flex items-center justify-between bg-white rounded-2xl px-3.5 py-2.5 border border-slate-100 shadow-xs">
        <button
          type="button"
          onClick={() => setSelectedMonth((prev) => subMonths(prev, 1))}
          className="p-1.5 rounded-xl hover:bg-slate-100 active:scale-95 text-slate-600 transition"
          title="Bulan sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setIsMonthPickerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl hover:bg-slate-100 transition active:scale-95 group"
          title="Klik untuk memilih bulan & tahun"
        >
          <Calendar className="w-4 h-4 text-[#7e7ef1] group-hover:scale-110 transition" />
          <span className="text-xs font-extrabold text-slate-800 capitalize group-hover:text-[#7e7ef1] transition">
            {format(selectedMonth, 'MMMM yyyy', { locale: id })}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#7e7ef1] transition" />
        </button>

        <button
          type="button"
          onClick={() => setSelectedMonth((prev) => addMonths(prev, 1))}
          className="p-1.5 rounded-xl hover:bg-slate-100 active:scale-95 text-slate-600 transition"
          title="Bulan berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Monthly Summary Cards (Scoped per Month) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            <span>Pengeluaran</span>
          </div>
          <p className="text-base font-extrabold text-rose-600 mt-1">
            -{formatRupiah(monthlyTotalExpense)}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Pemasukan</span>
          </div>
          <p className="text-base font-extrabold text-emerald-600 mt-1">
            +{formatRupiah(monthlyTotalIncome)}
          </p>
        </div>
      </div>

      {/* Segmented Tab Switcher */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('statistic')}
          className={clsx(
            'flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition',
            activeTab === 'statistic'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>Statistik</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('historical')}
          className={clsx(
            'flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition',
            activeTab === 'historical'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <History className="w-3.5 h-3.5" />
          <span>Historical</span>
        </button>
      </div>

      {/* TAB 1: STATISTIK */}
      {activeTab === 'statistic' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {/* Donut Chart Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800">Chart Proporsi Pengeluaran</h3>
              <span className="text-[11px] text-slate-400 font-medium capitalize">
                {format(selectedMonth, 'MMMM yyyy', { locale: id })}
              </span>
            </div>

            {monthlyTotalExpense === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                  <PieChart className="w-8 h-8" />
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Belum ada pengeluaran yang tercatat di bulan ini.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2">
                {/* SVG Donut */}
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg viewBox="0 0 160 160" className="w-40 h-40 transform -rotate-90">
                    {/* Background Ring */}
                    <circle
                      cx="80"
                      cy="80"
                      r="54"
                      fill="transparent"
                      stroke="#F1F5F9"
                      strokeWidth="18"
                    />
                    {/* Category Slices */}
                    {donutSlices.map((slice) => (
                      <circle
                        key={slice.catId}
                        cx="80"
                        cy="80"
                        r="54"
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth="18"
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        className="transition-all duration-500 ease-out"
                      />
                    ))}
                  </svg>

                  {/* Centered Total Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
                    <span className="text-[10px] font-semibold text-slate-400">Total Keluar</span>
                    <span className="text-xs font-extrabold text-slate-800 leading-tight mt-0.5">
                      {formatRupiah(monthlyTotalExpense)}
                    </span>
                  </div>
                </div>

                {/* Donut Quick Legend Badges */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 max-w-xs">
                  {donutSlices.slice(0, 4).map((slice) => (
                    <span
                      key={slice.catId}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 border border-slate-100 text-slate-600"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span>{slice.name}</span>
                      <span className="text-slate-400">{slice.percentage}%</span>
                    </span>
                  ))}
                  {donutSlices.length > 4 && (
                    <span className="text-[10px] text-slate-400 font-medium px-1">
                      +{donutSlices.length - 4} lainnya
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Category Breakdown Bars */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800">Rincian Pos Pengeluaran</h3>

            {sortedMonthlyCategoryExpenses.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada data pengeluaran.</p>
            ) : (
              sortedMonthlyCategoryExpenses.map(([catId, amount]) => {
                const cat = categoryMap.get(catId);
                const percentage =
                  monthlyTotalExpense > 0 ? Math.round((amount / monthlyTotalExpense) * 100) : 0;

                return (
                  <div key={catId} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <CategoryIcon
                          icon={cat?.icon}
                          name={cat?.name}
                          size={16}
                          className="w-4 h-4 object-contain inline-block shrink-0"
                        />
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
        </div>
      )}

      {/* TAB 2: HISTORICAL */}
      {activeTab === 'historical' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {/* Locked Date Range Box */}
          <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Calendar className="w-3.5 h-3.5 text-[#7e7ef1]" />
                <span>Rentang Tanggal</span>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                  {format(selectedMonth, 'MMMM yyyy', { locale: id })}
                </span>
              </div>
              {isCustomRangeActive && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate(defaultMonthStart);
                    setEndDate(defaultMonthEnd);
                    setVisibleCount(15);
                  }}
                  className="text-[10px] font-bold text-[#7e7ef1] hover:underline"
                >
                  Reset Sebulan
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Dari Tanggal */}
              <button
                type="button"
                onClick={() => setPickingDateType('START')}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-[#7e7ef1] hover:bg-white text-left transition group active:scale-98"
              >
                <div>
                  <span className="block text-[10px] font-semibold text-slate-400">
                    Dari Tanggal
                  </span>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-[#7e7ef1] transition">
                    {format(parseISO(startDate), 'd MMM yyyy', { locale: id })}
                  </span>
                </div>
                <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#7e7ef1] transition" />
              </button>

              {/* Sampai Tanggal */}
              <button
                type="button"
                onClick={() => setPickingDateType('END')}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-[#7e7ef1] hover:bg-white text-left transition group active:scale-98"
              >
                <div>
                  <span className="block text-[10px] font-semibold text-slate-400">
                    Sampai Tanggal
                  </span>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-[#7e7ef1] transition">
                    {format(parseISO(endDate), 'd MMM yyyy', { locale: id })}
                  </span>
                </div>
                <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#7e7ef1] transition" />
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs shadow-xs">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Cari transaksi berdasarkan catatan atau kategori..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(15);
              }}
              className="w-full bg-transparent outline-none text-xs text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Transaction List with Load More */}
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden shadow-xs">
            {displayedHistoricalTransactions.length === 0 ? (
              <div className="p-8 text-center space-y-1">
                <p className="text-xs font-semibold text-slate-600">Tidak ada transaksi ditemukan</p>
                <p className="text-[11px] text-slate-400">
                  Coba sesuaikan rentang tanggal atau kata kunci pencarian.
                </p>
              </div>
            ) : (
              displayedHistoricalTransactions.map((tx) => {
                const cat = categoryMap.get(tx.category_id);
                let formattedDate = tx.transaction_date;
                try {
                  formattedDate = format(parseISO(tx.transaction_date), 'd MMM yyyy', {
                    locale: id,
                  });
                } catch {
                  // fallback to raw string
                }

                return (
                  <div
                    key={tx.id}
                    onClick={() => onItemClick?.(tx)}
                    className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer group"
                    title="Klik untuk detail / edit transaksi"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                        <CategoryIcon
                          icon={cat?.icon}
                          name={cat?.name}
                          size={20}
                          className="w-5 h-5 object-contain"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 group-hover:text-[#7e7ef1] transition">
                          {tx.notes || cat?.name || 'Transaksi'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {formattedDate} • {cat?.name || 'Lain-lain'}
                          {tx.is_recurring_instance && (
                            <span className="ml-1.5 text-[9px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-[#7e7ef1]">
                              Rutin
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <span
                      className={
                        tx.type === 'EXPENSE'
                          ? 'font-bold text-slate-900'
                          : 'font-bold text-emerald-600'
                      }
                    >
                      {tx.type === 'EXPENSE' ? '-' : '+'}
                      {formatRupiah(tx.amount)}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Load More Button */}
          {hasMoreHistorical && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 15)}
              className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:border-[#7e7ef1] hover:text-[#7e7ef1] rounded-2xl text-xs font-bold text-slate-700 shadow-xs transition active:scale-98 flex items-center justify-center gap-1.5"
            >
              <span>Muat Lebih Banyak</span>
              <span className="text-[11px] font-normal text-slate-400">
                ({remainingCount} tersisa)
              </span>
            </button>
          )}

          {!hasMoreHistorical && filteredHistoricalTransactions.length > 0 && (
            <p className="text-center text-[11px] font-medium text-slate-400 py-2">
              Menampilkan semua {filteredHistoricalTransactions.length} transaksi pada rentang ini.
            </p>
          )}
        </div>
      )}

      {/* Month Picker Modal */}
      <CuteMonthPickerModal
        isOpen={isMonthPickerOpen}
        selectedMonth={selectedMonth}
        onSelectMonth={(newMonth) => setSelectedMonth(newMonth)}
        onClose={() => setIsMonthPickerOpen(false)}
      />

      {/* Date Range Picker Modal (for START) */}
      <CuteDatePickerModal
        isOpen={pickingDateType === 'START'}
        selectedDate={startDate}
        lockedMonth={selectedMonth}
        maxDate={endDate}
        title="Pilih Tanggal Mulai"
        subtitle={`Kunci periode ${format(selectedMonth, 'MMMM yyyy', { locale: id })}`}
        onSelectDate={(newDate) => {
          setStartDate(newDate);
          setVisibleCount(15);
        }}
        onClose={() => setPickingDateType(null)}
      />

      {/* Date Range Picker Modal (for END) */}
      <CuteDatePickerModal
        isOpen={pickingDateType === 'END'}
        selectedDate={endDate}
        lockedMonth={selectedMonth}
        minDate={startDate}
        title="Pilih Tanggal Selesai"
        subtitle={`Kunci periode ${format(selectedMonth, 'MMMM yyyy', { locale: id })}`}
        onSelectDate={(newDate) => {
          setEndDate(newDate);
          setVisibleCount(15);
        }}
        onClose={() => setPickingDateType(null)}
      />

      {/* EXPORT POPUP MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-100 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Ekspor Laporan</h3>
                <p className="text-xs text-slate-500">Pilih format unduhan pembukuan</p>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Excel Option */}
              <button
                type="button"
                onClick={() => {
                  setIsExportModalOpen(false);
                  handleExportExcel();
                }}
                className="w-full flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition text-left group"
              >
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                      Microsoft Excel (.xlsx)
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                      Spreadsheet
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tabel lengkap transaksi untuk olah data mandiri atau Google Sheets.
                  </p>
                </div>
              </button>

              {/* PDF Option */}
              <button
                type="button"
                onClick={() => {
                  setIsExportModalOpen(false);
                  handleExportPDF();
                }}
                className="w-full flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:border-rose-500 hover:bg-rose-50/40 transition text-left group"
              >
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-100 transition shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-rose-700">
                      Dokumen PDF (.pdf)
                    </span>
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded-full">
                      Siap Cetak
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Laporan rapi disertai ringkasan pemasukan & pengeluaran.
                  </p>
                </div>
              </button>
            </div>

            {!isProOrTrial && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center gap-2">
                <span className="text-amber-500 text-xs">⭐</span>
                <p className="text-[11px] text-amber-700 font-medium">
                  Fitur ekspor laporan tersedia untuk pengguna <span className="font-bold">PRO</span>.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsExportModalOpen(false)}
              className="w-full py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
