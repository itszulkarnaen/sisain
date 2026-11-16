'use client';

import React from 'react';
import { Bell, ChevronRight, Check } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/currency';
import { RecurringRule } from '@/types';

interface UpcomingRecurringBannerProps {
  rule?: RecurringRule | null;
  daysRemaining?: number;
  onClick?: () => void;
  onMarkAsPaid?: (rule: RecurringRule) => void;
}

export const UpcomingRecurringBanner: React.FC<UpcomingRecurringBannerProps> = ({
  rule,
  daysRemaining = 0,
  onClick,
  onMarkAsPaid,
}) => {
  if (!rule) return null;

  let titleText = `${rule.title} (${formatRupiah(rule.amount)})`;
  let subText = '';

  if (daysRemaining === 0) {
    titleText = `Hari Ini: ${rule.title} (${formatRupiah(rule.amount)})`;
    subText = 'Jatuh tempo hari ini, jangan lupa dibayar ya!';
  } else if (daysRemaining === 1) {
    titleText = `Besok: ${rule.title} (${formatRupiah(rule.amount)})`;
    subText = 'Ada tagihan buat besok, jangan lupa dibayar ya!';
  } else if (daysRemaining > 1) {
    subText = `${daysRemaining} hari lagi (tgl ${rule.execution_day}), siapkan dananya ya!`;
  } else {
    subText = `Terlewat ${Math.abs(daysRemaining)} hari (tgl ${rule.execution_day}), jangan lupa diselesaikan!`;
  }

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3.5 rounded-3xl bg-amber-50/90 border border-amber-200/70 shadow-xs cursor-pointer hover:bg-amber-100/70 active:scale-[0.99] transition"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        {/* Bell Icon container */}
        <div className="w-10 h-10 rounded-2xl bg-white shadow-2xs border border-amber-200/80 flex items-center justify-center shrink-0 text-amber-500">
          <Bell className="w-5 h-5 fill-amber-100" />
        </div>

        {/* Text Details */}
        <div className="truncate">
          <p className="text-[10px] font-extrabold tracking-wider text-amber-800 uppercase">
            Pengingat Tagihan
          </p>
          <p className="text-xs font-bold text-slate-800 truncate">
            {titleText}
          </p>
          <p className="text-[11px] text-amber-900/80 font-medium truncate mt-0.5">
            {subText}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-2">
        {onMarkAsPaid && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsPaid(rule);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            title="Tandai tagihan ini sudah dibayar"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Sudah Bayar</span>
          </button>
        )}
        <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition" />
      </div>
    </div>
  );
};

