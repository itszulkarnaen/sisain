'use client';

import React from 'react';
import { formatRupiah } from '@/lib/utils/currency';
import { Transaction, Category } from '@/types';
import { clsx } from 'clsx';

interface TodayTransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  totalTodayExpense: number;
  onItemClick?: (tx: Transaction) => void;
}

export const TodayTransactions: React.FC<TodayTransactionsProps> = ({
  transactions,
  categories,
  totalTodayExpense,
  onItemClick,
}) => {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">Transaksi Hari Ini</h2>
        <span className="text-xs font-semibold text-rose-500">
          Total keluar: -{formatRupiah(totalTodayExpense)}
        </span>
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
                className="flex items-center justify-between p-3.5 hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {/* Category icon circle */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 shadow-xs"
                    style={{ backgroundColor: category?.color || '#F1F5F9' }}
                  >
                    <span>{category?.icon || '💸'}</span>
                  </div>

                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 truncate">
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
                <div className="text-right shrink-0 ml-3">
                  <p
                    className={clsx(
                      'text-xs font-extrabold',
                      isExpense ? 'text-slate-900' : 'text-emerald-600'
                    )}
                  >
                    {isExpense ? '-' : '+'}{formatRupiah(tx.amount)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

