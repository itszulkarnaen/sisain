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
    totalMonthlySalary,
  } = summary;

  const hasSalary = totalMonthlySalary > 0;

  return (
    <div
      onClick={onCardClick}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7e7ef1] via-[#6c6ce8] to-[#5a5ae0] text-white p-5 shadow-[0_12px_30px_rgba(126,126,241,0.35)] cursor-pointer active:scale-[0.99] transition-transform group"
    >
      {/* Decorative background blurs */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-[#a0dafd]/25 rounded-full blur-xl pointer-events-none" />

      {/* Top Row: Label & Status Pill */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-1.5 text-xs font-medium text-white/90">
          <ShieldCheck className="w-4 h-4 text-white" />
          <span>Aman Belanja Hari Ini</span>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold">
          {!hasSalary ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-[#a0dafd]" />
              <span className="text-[#a0dafd]">Setup Gaji</span>
            </>
          ) : status === 'ON_TRACK' ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-[#a0dafd]" />
              <span>On track</span>
            </>
          ) : status === 'WARNING' ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>Hati-hati</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-300" />
              <span>Defisit</span>
            </>
          )}
        </div>
      </div>

      {/* Big Display Safe-to-Spend */}
      <div className="mb-4 relative z-10">
        {!hasSalary ? (
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight">
                Rp -
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-[#a0dafd] border border-[#a0dafd]/30 group-hover:bg-white/30 transition">
                Atur sekarang ➔
              </span>
            </div>
            <p className="text-[11px] text-white/75 mt-1">
              Tap kartu ini buat masukin nominal gaji & tanggal gajian lu
            </p>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold tracking-tight">
              {formatRupiah(dailySafeToSpend)}
            </span>
            <span className="text-sm font-medium text-white/80">/ hari</span>
          </div>
        )}
      </div>

      {/* Info Capsule */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 border border-[#a0dafd]/20 backdrop-blur-md text-xs font-medium text-white/95 mb-4 relative z-10">
        <span>Sisa Gaji: {hasSalary ? formatRupiah(remainingSalary) : '-'}</span>
        <span className="opacity-60">•</span>
        <span>{daysUntilPayday} hari menuju gajian ({paydayFormatted})</span>
      </div>

      {/* Bottom Progress Bar */}
      <div className="relative z-10">
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
          <span className="text-white/80">Gaji bulan ini terpakai</span>
          <span className="font-bold text-white">{hasSalary ? `${salaryUsedPercentage}%` : '-'}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/25 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-white to-[#a0dafd] rounded-full transition-all duration-700 ease-out"
            style={{ width: `${hasSalary ? Math.min(100, Math.max(0, salaryUsedPercentage)) : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
};

