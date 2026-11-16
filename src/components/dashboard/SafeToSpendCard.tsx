'use client';

import React from 'react';
import { ShieldCheck, Sparkles, AlertTriangle, AlertCircle, Layers, Calendar, DollarSign } from 'lucide-react';
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
    freeCash,
    remainingSalary,
    totalCommitted,
    daysUntilPayday,
    paydayFormatted,
    budgetAllocatedPercentage,
    salaryUsedPercentage,
    status,
    totalMonthlySalary,
  } = summary;

  const hasSalary = (totalMonthlySalary || 0) > 0 || (remainingSalary || 0) > 0;

  return (
    <div
      onClick={onCardClick}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7e7ef1] via-[#6c6ce8] to-[#5a5ae0] text-white p-5 shadow-[0_12px_30px_rgba(126,126,241,0.35)] cursor-pointer active:scale-[0.99] transition-transform group"
    >
      {/* Decorative background blurs */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#a0dafd]/25 rounded-full blur-xl pointer-events-none" />

      {/* Top Row: Label & Status Pill */}
      <div className="flex items-center justify-between mb-2 relative z-10">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
          <ShieldCheck className="w-4 h-4 text-[#a0dafd]" />
          <span>Sisa Saldo Gaji</span>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold">
          {!hasSalary ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-[#a0dafd]" />
              <span className="text-[#a0dafd]">Setup Gaji</span>
            </>
          ) : status === 'ON_TRACK' ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-[#a0dafd]" />
              <span>Aman</span>
            </>
          ) : status === 'WARNING' ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>Waspada</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-300" />
              <span>Defisit</span>
            </>
          )}
        </div>
      </div>

      {/* Big Display: Sisa Gaji Riil */}
      <div className="mb-4 relative z-10">
        {!hasSalary ? (
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight">Rp -</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-[#a0dafd] border border-[#a0dafd]/30 group-hover:bg-white/30 transition">
                Atur sekarang ➔
              </span>
            </div>
            <p className="text-[11px] text-white/75 mt-1">
              Ketuk kartu ini untuk mengatur nominal gaji & tanggal gajian kamu
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight">
                {formatRupiah(remainingSalary)}
              </span>
            </div>
            <p className="text-[11px] text-white/80 mt-0.5 font-medium">
              Sisa uang gaji riil di rekening saat ini
            </p>
          </div>
        )}
      </div>

      {/* 2-Column Info Cards: Total Ter-budget (Kiri) & Uang di Luar Budget (Kanan, tanpa subtext) */}
      <div className="grid grid-cols-2 gap-2 mb-3.5 relative z-10">
        {/* KIRI: Total Ter-budget */}
        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-2.5 border border-white/20 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-white/80 font-medium">
            <Layers className="w-3 h-3 text-[#a0dafd]" />
            <span>Total Ter-budget</span>
          </div>
          <p className="text-sm font-extrabold text-white mt-1">
            {hasSalary ? formatRupiah(totalCommitted) : '-'}
          </p>
          <span className="text-[9px] text-white/70 mt-0.5">
            {hasSalary ? `${budgetAllocatedPercentage}% dari gaji` : '0 pos'}
          </span>
        </div>

        {/* KANAN: Uang di Luar Budget (Tanpa sub-text) */}
        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-2.5 border border-white/20 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-[10px] text-white/80 font-medium">
            <DollarSign className="w-3 h-3 text-[#a0dafd]" />
            <span>Uang di Luar Budget</span>
          </div>
          <p className="text-sm font-extrabold text-white mt-1">
            {hasSalary ? formatRupiah(freeCash) : '-'}
          </p>
        </div>
      </div>

      {/* Countdown Payday Capsule */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-full bg-black/15 border border-[#a0dafd]/20 text-[11px] font-medium text-white/95 mb-3 relative z-10">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#a0dafd]" />
          <span>{hasSalary ? `${daysUntilPayday} hari lagi ke gajian (${paydayFormatted})` : 'Tanggal gajian belum diatur'}</span>
        </div>
        <span className="text-[10px] font-bold text-[#a0dafd] group-hover:underline">
          Detail ➔
        </span>
      </div>

      {/* Bottom Progress Bar: Real Expense vs Salary */}
      <div className="relative z-10">
        <div className="flex items-center justify-between text-[11px] mb-1 font-medium text-white/80">
          <span>Gaji bulan ini terpakai</span>
          <span className="font-bold text-white">{hasSalary ? `${salaryUsedPercentage}%` : '-'}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-white to-[#a0dafd] rounded-full transition-all duration-700 ease-out"
            style={{ width: `${hasSalary ? Math.min(100, Math.max(0, salaryUsedPercentage)) : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
};
