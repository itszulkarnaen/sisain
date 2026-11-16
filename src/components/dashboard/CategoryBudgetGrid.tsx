'use client';

import React from 'react';
import { formatRupiah } from '@/lib/utils/currency';
import { Category } from '@/types';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { clsx } from 'clsx';

export interface CategoryBudgetDisplay {
  category: Category;
  budgetLimit: number;
  spentAmount: number;
}

interface CategoryBudgetGridProps {
  items: CategoryBudgetDisplay[];
  onViewAllClick?: () => void;
  onItemClick?: (item: CategoryBudgetDisplay) => void;
}

export const CategoryBudgetGrid: React.FC<CategoryBudgetGridProps> = ({
  items,
  onViewAllClick,
  onItemClick,
}) => {
  return (
    <div>
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">Budget Kategori</h2>
        {onViewAllClick && (
          <button
            onClick={onViewAllClick}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 active:underline"
          >
            Lihat semua
          </button>
        )}
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const { category, budgetLimit, spentAmount } = item;
          const percentage = budgetLimit > 0 ? Math.round((spentAmount / budgetLimit) * 100) : 0;

          // Color rules:
          // < 75%: Hijau
          // 75% - 99%: Orange/Kuning
          // >= 100%: Merah
          let statusColorClass = 'text-emerald-600';
          let barBgClass = 'bg-emerald-500';

          if (percentage >= 100) {
            statusColorClass = 'text-rose-600';
            barBgClass = 'bg-rose-500';
          } else if (percentage >= 75) {
            statusColorClass = 'text-amber-600';
            barBgClass = 'bg-amber-500';
          }

          return (
            <div
              key={category.id}
              onClick={() => onItemClick?.(item)}
              className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs hover:border-indigo-100 active:scale-[0.98] transition cursor-pointer flex flex-col justify-between"
            >
              {/* Top Row: Icon circle + Percentage */}
              <div className="flex items-center justify-between">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-xs"
                  style={{ backgroundColor: category.color || '#F1F5F9' }}
                >
                  <CategoryIcon icon={category.icon} name={category.name} size={22} />
                </div>
                <span className={clsx('text-xs font-bold', statusColorClass)}>
                  {percentage}%
                </span>
              </div>

              {/* Text Info */}
              <div className="mt-3">
                <h3 className="text-xs font-bold text-slate-800 truncate">{category.name}</h3>
                <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                  {formatRupiah(spentAmount)} / {formatRupiah(budgetLimit)}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mt-2.5">
                <div
                  className={clsx('h-full rounded-full transition-all duration-500', barBgClass)}
                  style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
