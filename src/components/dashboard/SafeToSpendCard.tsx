'use client';

import React from 'react';
import { ShieldCheck, Sparkles, AlertTriangle, AlertCircle } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/currency';
import { SafeToSpendSummary } from '@/types';

interface SafeToSpendCardProps {
  summary: SafeToSpendSummary;
  onCardClick?: () => void;
}

export const SafeToSpendCard: React.FC<SafeToSpendCardProps> = ({
  summary,
  onCardClick,
}) => {
  const {
    dailySafeToSpend,
    remainingSalary,
    daysUntilPayday,
    paydayFormatted,
    salaryUsedPercentage,
    status,
  } = summary;

  return (
    <div
      onClick={onCardClick}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5352ed] via-[#4834d4] to-[#3742fa] text-white p-5 shadow-[0_12px_30px_rgba(72,52,212,0.35)] cursor-pointer active:scale-[0.99] transition-transform"
    >
      {/* Decorative background blurs */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-blue-400/20 rounded-full blur-xl pointer-events-none" />

      {/* Top Row: Label & Status Pill */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-1.5 text-xs font-medium text-white/90">
          <ShieldCheck className="w-4 h-4 text-white" />
          <span>Aman Belanja Hari Ini</span>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold">
          {status === 'ON_TRACK' && (
            <>
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>On track</span>
            </>
          )}
          {status === 'WARNING' && (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>Hati-hati</span>
            </>
          )}
          {status === 'DEFICIT' && (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-300" />
              <span>Defisit</span>
            </>
          )}
        </div>
      </div>

      {/* Big Display Safe-to-Spend */}
      <div className="mb-4 relative z-10">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold tracking-tight">
            {formatRupiah(dailySafeToSpend)}
          </span>
          <span className="text-sm font-medium text-white/80">/ hari</span>
        </div>
      </div>

      {/* Info Capsule */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium text-white/95 mb-4 relative z-10">
        <span>Sisa Gaji: {formatRupiah(remainingSalary)}</span>
        <span className="opacity-60">•</span>
        <span>{daysUntilPayday} hari menuju gajian ({paydayFormatted})</span>
      </div>

      {/* Bottom Progress Bar */}
      <div className="relative z-10">
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
          <span className="text-white/80">Gaji bulan ini terpakai</span>
          <span className="font-bold text-white">{salaryUsedPercentage}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/25 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, salaryUsedPercentage))}%` }}
          />
        </div>
      </div>
    </div>
  );
};

