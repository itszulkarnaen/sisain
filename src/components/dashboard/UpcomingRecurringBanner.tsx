'use client';

import React from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/currency';
import { RecurringRule } from '@/types';

interface UpcomingRecurringBannerProps {
  rule?: RecurringRule;
  daysRemaining?: number;
  onClick?: () => void;
}

export const UpcomingRecurringBanner: React.FC<UpcomingRecurringBannerProps> = ({
  rule,
  daysRemaining = 5,
  onClick,
}) => {
  if (!rule) return null;

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/60 shadow-xs cursor-pointer hover:bg-amber-100/60 active:scale-[0.99] transition"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        {/* Bell Icon container */}
        <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-amber-200/70 flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 text-amber-500 fill-amber-100" />
        </div>

        {/* Text Details */}
        <div className="truncate">
          <p className="text-[10px] font-bold tracking-wider text-amber-800 uppercase">
            Auto-Debit Mendatang
          </p>
          <p className="text-xs font-semibold text-slate-800 truncate">
            {rule.title} ({formatRupiah(rule.amount)}) • {daysRemaining} hari lagi
          </p>
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 ml-2" />
    </div>
  );
};

