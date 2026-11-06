'use client';

import React, { useState } from 'react';
import { Category, Budget } from '@/types';
import { formatRupiah } from '@/lib/utils/currency';
import { Edit2, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';

interface BudgetViewProps {
  categories: Category[];
  budgets: Budget[];
  categorySpendingMap: Map<string, number>;
  isProOrTrial: boolean;
  onLockedFeatureClick: () => void;
  onSaveBudget: (categoryId: string, monthlyLimit: number) => Promise<void>;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  categories,
  budgets,
  categorySpendingMap,
  isProOrTrial,
  onLockedFeatureClick,
  onSaveBudget,
}) => {
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editLimitStr, setEditLimitStr] = useState('');

  if (!isProOrTrial) {
    return (
      <div className="py-8 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Fitur Smart Budgeting Terkunci</h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto mb-5 leading-relaxed">
          Masa Free Trial 30 hari telah berakhir. Aktifkan paket Pro Rp10.000/bulan untuk membuka kembali alokasi bujet per kategori.
        </p>
        <button
          onClick={onLockedFeatureClick}
          className="px-6 py-3 rounded-full bg-indigo-600 text-white font-bold text-xs shadow-md hover:bg-indigo-700 transition"
        >
          Buka Kunci Fitur Pro (Rp10.000)
        </button>
      </div>
    );
  }

  const budgetMap = new Map(budgets.map((b) => [b.category_id, b]));

  const handleStartEdit = (catId: string, currentLimit: number) => {
    setEditingCategoryId(catId);
    setEditLimitStr(currentLimit > 0 ? currentLimit.toString() : '');
  };

  const handleSave = async (catId: string) => {
    const val = parseInt(editLimitStr, 10) || 0;
    if (val > 0) {
      await onSaveBudget(catId, val);
    }
    setEditingCategoryId(null);
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="px-1">
        <h2 className="text-lg font-bold text-slate-900">Alokasi Anggaran Kategori</h2>
        <p className="text-xs text-slate-500">
          Atur batas maksimal belanja bulanan agar guardrail aman berjalan optimal.
        </p>
      </div>

      <div className="space-y-3">
        {categories.filter((c) => c.type === 'EXPENSE').map((cat) => {
          const budget = budgetMap.get(cat.id);
          const limit = budget?.monthly_limit || 0;
          const spent = categorySpendingMap.get(cat.id) || 0;
          const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
          const isEditing = editingCategoryId === cat.id;

          let barColor = 'bg-emerald-500';
          if (percentage >= 100) barColor = 'bg-rose-500';
          else if (percentage >= 75) barColor = 'bg-amber-500';

          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-xs"
                    style={{ backgroundColor: cat.color || '#F1F5F9' }}
                  >
                    <span>{cat.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">{cat.name}</h3>
                    <p className="text-[11px] text-slate-400">
                      Terpakai: <span className="font-semibold text-slate-700">{formatRupiah(spent)}</span>
                    </p>
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editLimitStr}
                      onChange={(e) => setEditLimitStr(e.target.value)}
                      placeholder="Nominal"
                      className="w-24 px-2 py-1 text-xs border rounded-lg outline-hidden"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSave(cat.id)}
                      className="px-2.5 py-1 text-xs font-bold bg-indigo-600 text-white rounded-lg"
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartEdit(cat.id, limit)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>{limit > 0 ? formatRupiah(limit) : 'Atur Limit'}</span>
                  </button>
                )}
              </div>

              {limit > 0 ? (
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                    <span>{percentage}% terpakai</span>
                    <span>Sisa: {formatRupiah(Math.max(0, limit - spent))}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={clsx('h-full rounded-full transition-all duration-500', barColor)}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">Belum ada pagu anggaran untuk kategori ini.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
