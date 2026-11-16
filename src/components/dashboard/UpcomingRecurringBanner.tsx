'use client';

import React from 'react';
import { Bell, ChevronRight, Check, ArrowUpRight } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/currency';
import { RecurringRule } from '@/types';
import { clsx } from 'clsx';

export interface UpcomingRecurringBannerProps {
  rule?: RecurringRule | null;
  daysRemaining?: number;
  totalUpcomingCount?: number;
  totalUpcomingAmount?: number;
  isIncome?: boolean;
  onClick?: () => void;
  onMarkAsPaid?: (rule: RecurringRule) => void;
}

export const UpcomingRecurringBanner: React.FC<UpcomingRecurringBannerProps> = ({
  rule,
  daysRemaining = 0,
  totalUpcomingCount = 1,
  totalUpcomingAmount = 0,
  isIncome = false,
  onClick,
  onMarkAsPaid,
}) => {
  if (!rule && totalUpcomingCount <= 0) return null;

  // MULTIPLE UPCOMING BILLS / INCOMES: Direct user to Automation View
  if (totalUpcomingCount > 1) {
    let daysLabel = `${daysRemaining} hari lagi`;
    if (daysRemaining === 0) daysLabel = 'Hari ini';
    if (daysRemaining === 1) daysLabel = 'Besok';

    return (
      <div
        onClick={onClick}
        className="flex items-center justify-between p-3.5 rounded-3xl bg-amber-50/90 border border-amber-200/70 shadow-xs cursor-pointer hover:bg-amber-100/70 active:scale-[0.99] transition group"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Bell Icon container with count badge */}
          <div className="relative w-10 h-10 rounded-2xl bg-white shadow-2xs border border-amber-200/80 flex items-center justify-center shrink-0 text-amber-600">
            <Bell className="w-5 h-5 fill-amber-100" />
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#7e7ef1] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs">
              {totalUpcomingCount}
            </span>
          </div>

          {/* Text Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200/60">
                {totalUpcomingCount} Jadwal Tagihan & Rutin
              </span>
            </div>
            <p className="text-xs font-extrabold text-slate-900 truncate">
              Total {formatRupiah(totalUpcomingAmount)}
            </p>
            <p className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
              Terdekat: <strong className="text-slate-800">{rule?.title}</strong> ({daysLabel})
            </p>
          </div>
        </div>

        {/* Right Action: Lihat Semua Pill */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <span className="text-xs font-bold text-amber-800 bg-white hover:bg-amber-100/60 px-3 py-1.5 rounded-xl border border-amber-200/80 shadow-2xs flex items-center gap-1 transition">
            <span>Lihat Semua</span>
            <ChevronRight className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-0.5 transition" />
          </span>
        </div>
      </div>
    );
  }

  // SINGLE UPCOMING ITEM (Expense or Income)
  if (!rule) return null;

  let titleText = `${rule.title} (${formatRupiah(rule.amount)})`;
  let subText = '';

  if (isIncome) {
    if (daysRemaining === 0) {
      titleText = `Hari Ini: ${rule.title} (+${formatRupiah(rule.amount)})`;
      subText = 'Jadwal masuk hari ini, jangan lupa cek rekening ya!';
    } else if (daysRemaining === 1) {
      titleText = `Besok: ${rule.title} (+${formatRupiah(rule.amount)})`;
      subText = 'Ada pemasukan rutin besok, pantau rekening ya!';
    } else if (daysRemaining > 1) {
      titleText = `${rule.title} (+${formatRupiah(rule.amount)})`;
      subText = `${daysRemaining} hari lagi (tgl ${rule.execution_day}), siap-siap cair!`;
    } else {
      titleText = `${rule.title} (+${formatRupiah(rule.amount)})`;
      subText = `Jadwal tgl ${rule.execution_day}, cek apakah sudah masuk rekening.`;
    }
  } else {
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
  }

  return (
    <div
      onClick={onClick}
      className={clsx(
        'flex items-center justify-between p-3.5 rounded-3xl border shadow-xs cursor-pointer active:scale-[0.99] transition',
        isIncome
          ? 'bg-emerald-50/90 border-emerald-200/70 hover:bg-emerald-100/70'
          : 'bg-amber-50/90 border-amber-200/70 hover:bg-amber-100/70'
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Icon container */}
        <div
          className={clsx(
            'w-10 h-10 rounded-2xl bg-white shadow-2xs border flex items-center justify-center shrink-0',
            isIncome
              ? 'border-emerald-200 text-emerald-600'
              : 'border-amber-200/80 text-amber-500'
          )}
        >
          {isIncome ? (
            <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
          ) : (
            <Bell className="w-5 h-5 fill-amber-100" />
          )}
        </div>

        {/* Text Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className={clsx(
                'text-[10px] font-bold px-2 py-0.5 rounded-md border',
                isIncome
                  ? 'text-emerald-800 bg-emerald-100/70 border-emerald-200/70'
                  : 'text-amber-800 bg-amber-100/80 border-amber-200/60'
              )}
            >
              {isIncome ? 'Pemasukan Rutin' : 'Pengingat Tagihan'}
            </span>
          </div>
          <p className="text-xs font-extrabold text-slate-900 truncate">
            {titleText}
          </p>
          <p className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
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
            className={clsx(
              'flex items-center gap-1 px-3 py-1.5 rounded-xl active:scale-95 text-white text-xs font-bold shadow-xs transition cursor-pointer',
              isIncome
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
            )}
            title={isIncome ? 'Tandai sudah masuk' : 'Tandai sudah dibayar'}
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isIncome ? 'Sudah Masuk' : 'Sudah Bayar'}</span>
          </button>
        )}
        <ChevronRight
          className={clsx(
            'w-4 h-4 group-hover:translate-x-0.5 transition',
            isIncome ? 'text-emerald-400' : 'text-amber-400'
          )}
        />
      </div>
    </div>
  );
};

