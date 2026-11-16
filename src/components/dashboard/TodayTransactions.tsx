'use client';

import React from 'react';
import { formatRupiah } from '@/lib/utils/currency';
import { Transaction, Category } from '@/types';
import { clsx } from 'clsx';
import { ChevronRight } from 'lucide-react';
import { CategoryIcon } from '@/components/common/CategoryIcon';

interface TodayTransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  totalTodayExpense: number;
  totalTodayIncome?: number;
  onItemClick?: (tx: Transaction) => void;
  onViewAllClick?: () => void;
}

export const TodayTransactions: React.FC<TodayTransactionsProps> = ({
  transactions,
  categories,
  totalTodayExpense,
  totalTodayIncome = 0,
  onItemClick,
  onViewAllClick,
}) => {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Transaksi Hari Ini</h2>
          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#a0dafd]/30 border border-[#a0dafd]/70 text-[11px] font-medium text-slate-700 shadow-2xs">
              <span>Keluar:</span>
              <span className="font-extrabold text-slate-900">
                {totalTodayExpense > 0 ? `-${formatRupiah(totalTodayExpense)}` : formatRupiah(0)}
              </span>
            </span>
            {totalTodayIncome > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-800 shadow-2xs">
                <span>Masuk:</span>
                <span className="font-extrabold text-emerald-600">
                  +{formatRupiah(totalTodayIncome)}
                </span>
              </span>
            )}
          </div>
        </div>
        {onViewAllClick && (
          <button
            onClick={onViewAllClick}
            className="text-xs font-bold text-[#7e7ef1] hover:underline flex items-center gap-0.5 group self-start mt-1"
          >
            <span>Semua riwayat</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </button>
        )}
      </div>

      {/* Transaction List */}
      {transactions.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center border border-slate-100 shadow-xs">
          <p className="text-2xl mb-1">🎉</p>
          <p className="text-xs font-medium text-slate-500">Belum ada transaksi hari ini.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Tekan tombol + di bawah untuk mencatat.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl divide-y divide-slate-100 border border-slate-100 shadow-xs overflow-hidden">
          {transactions.map((tx) => {
            const category = categoryMap.get(tx.category_id);
            const isExpense = tx.type === 'EXPENSE';

            return (
              <div
                key={tx.id}
                onClick={() => onItemClick?.(tx)}
                className="flex items-center justify-between p-3.5 hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer group"
                title="Klik untuk edit / hapus transaksi"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {/* Category icon */}
                  <div className="w-10 h-10 flex items-center justify-center shrink-0">
                    <CategoryIcon icon={category?.icon} name={category?.name} size={40} className="w-10 h-10 object-contain" />
                  </div>

                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 truncate group-hover:text-[#7e7ef1] transition">
                      {tx.notes || category?.name || 'Transaksi'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {category?.name || 'Umum'}
                      </span>
                      {tx.is_recurring_instance && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-[#7e7ef1]/10 text-[#7e7ef1] font-semibold border border-[#a0dafd]/30">
                          Auto / Rutin
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0 ml-3 flex items-center gap-1.5">
                  <p
                    className={clsx(
                      'text-xs font-extrabold',
                      isExpense ? 'text-slate-900' : 'text-emerald-600'
                    )}
                  >
                    {isExpense ? '-' : '+'}{formatRupiah(tx.amount)}
                  </p>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
