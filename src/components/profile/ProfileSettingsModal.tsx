'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Calendar, CreditCard, Sparkles, Save, CalendarCheck } from 'lucide-react';
import { Profile } from '@/types';
import { formatRupiah, formatRupiahInput, parseRupiahInput } from '@/lib/utils/currency';
import { getPaydayCycle } from '@/lib/utils/payday';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { clsx } from 'clsx';

type PaydayOption = 'LAST_DAY' | 'DAY_25' | 'CUSTOM';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onSaveProfile: (data: {
    fullName: string;
    monthlySalary: number;
    paydayDate: number;
  }) => Promise<void>;
  onOpenPaywall: () => void;
  onLogout?: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onOpenPaywall,
  onLogout,
}) => {
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [salaryStr, setSalaryStr] = useState(
    profile?.monthly_salary && profile.monthly_salary > 0
      ? formatRupiahInput(profile.monthly_salary)
      : ''
  );
  const [paydayDate, setPaydayDate] = useState<number>(profile?.payday_date || 25);
  const [paydayOption, setPaydayOption] = useState<PaydayOption>('DAY_25');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state only when modal opens or profile ID changes (prevent clobbering while typing)
  useEffect(() => {
    if (isOpen) {
      setFullName(profile?.full_name || '');
      setSalaryStr(
        profile?.monthly_salary && profile.monthly_salary > 0
          ? formatRupiahInput(profile.monthly_salary)
          : ''
      );
      const initialDate = profile?.payday_date || 25;
      setPaydayDate(initialDate);

      if (initialDate >= 31) {
        setPaydayOption('LAST_DAY');
      } else if (initialDate === 25) {
        setPaydayOption('DAY_25');
      } else {
        setPaydayOption('CUSTOM');
      }
    }
  }, [isOpen, profile?.id, profile?.full_name, profile?.monthly_salary, profile?.payday_date]);

  if (!isOpen) return null;

  const handleSelectLastDay = () => {
    setPaydayOption('LAST_DAY');
    setPaydayDate(31);
  };

  const handleSelectDay25 = () => {
    setPaydayOption('DAY_25');
    setPaydayDate(25);
  };

  const handleSelectCustom = (customDay?: number) => {
    setPaydayOption('CUSTOM');
    const target = customDay || (paydayDate >= 31 || paydayDate === 25 ? 1 : paydayDate);
    setPaydayDate(target);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const salary = parseRupiahInput(salaryStr);
    if (salary < 0) return;

    setIsSaving(true);
    try {
      await onSaveProfile({
        fullName: fullName.trim() || 'Pengguna',
        monthlySalary: salary,
        paydayDate: paydayOption === 'LAST_DAY' ? 31 : paydayDate,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const status = profile?.subscription_status || 'TRIAL';
  const cycleInfo = getPaydayCycle(paydayDate);
  const formattedNextDate = format(cycleInfo.nextPaydayDate, 'd MMMM yyyy', { locale: id });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl z-10 px-5 pt-3 pb-6 flex flex-col max-h-[92vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Pengaturan Akun & Gaji</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subscription Status Card */}
        <div className="p-3.5 rounded-2xl bg-[#7e7ef1]/10 border border-[#a0dafd]/40 mb-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-[#7e7ef1] uppercase">
              Status Keanggotaan
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-extrabold text-slate-900">
                {status === 'TRIAL' && 'Free Trial (30 Hari)'}
                {status === 'ACTIVE' && 'sisa.in Pro Aktif ✨'}
                {status === 'EXPIRED' && 'Paket Pro Berakhir'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenPaywall();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#7e7ef1] hover:bg-[#6c6ce8] text-white text-xs font-bold shadow-xs ring-1 ring-[#a0dafd]/40 active:scale-95 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>{status === 'ACTIVE' ? 'Detail Pro' : 'Upgrade Pro'}</span>
          </button>
        </div>

        {/* Form Settings */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nama Panggilan (Bisa diedit bebas) */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#7e7ef1]" />
                <span>Nama Panggilan</span>
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ketik nama panggilan lu..."
                className="w-full pl-3.5 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-[#7e7ef1] focus:ring-2 focus:ring-[#a0dafd]/40 outline-hidden font-bold text-slate-900 transition bg-white"
                required
              />
              {fullName && (
                <button
                  type="button"
                  onClick={() => setFullName('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 flex items-center justify-center text-[10px] transition"
                  title="Hapus"
                >
                  ✕
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Nama ini yang muncul di sapaan dashboard (&quot;Halo, {fullName.trim() || 'Pengguna'}&quot;).
            </p>
          </div>

          {/* Nominal Gaji Bulanan */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#7e7ef1]" />
              <span>Gaji Pokok Bulanan</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={salaryStr}
              onChange={(e) => setSalaryStr(formatRupiahInput(e.target.value))}
              placeholder="Contoh: Rp 8.000.000"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-[#7e7ef1] focus:ring-2 focus:ring-[#a0dafd]/40 outline-hidden font-bold text-slate-900"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Dipakai untuk menghitung batas belanja harian (*Safe-to-Spend*): {formatRupiah(parseRupiahInput(salaryStr))}
            </p>
          </div>

          {/* Tanggal Gajian (Picker 3 Opsi) */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#7e7ef1]" />
              <span>Tanggal Gajian Bulanan</span>
            </label>

            {/* 3 Opsi: Akhir Bulan, Tanggal 25, Pilih Tanggal */}
            <div className="grid grid-cols-3 gap-2">
              {/* Opsi 1: Akhir Bulan */}
              <button
                type="button"
                onClick={handleSelectLastDay}
                className={clsx(
                  'p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-95',
                  paydayOption === 'LAST_DAY'
                    ? 'border-[#7e7ef1] bg-[#7e7ef1]/10 ring-2 ring-[#a0dafd]/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">🗓️</span>
                  {paydayOption === 'LAST_DAY' && (
                    <span className="w-2 h-2 rounded-full bg-[#7e7ef1]" />
                  )}
                </div>
                <span className="text-xs font-bold text-slate-900 leading-tight">Akhir Bulan</span>
                <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  Tgl 28-31
                </span>
              </button>

              {/* Opsi 2: Tanggal 25 */}
              <button
                type="button"
                onClick={handleSelectDay25}
                className={clsx(
                  'p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-95',
                  paydayOption === 'DAY_25'
                    ? 'border-[#7e7ef1] bg-[#7e7ef1]/10 ring-2 ring-[#a0dafd]/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">💼</span>
                  {paydayOption === 'DAY_25' && (
                    <span className="w-2 h-2 rounded-full bg-[#7e7ef1]" />
                  )}
                </div>
                <span className="text-xs font-bold text-slate-900 leading-tight">Tanggal 25</span>
                <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  Payroll ID
                </span>
              </button>

              {/* Opsi 3: Pilih Tanggal */}
              <button
                type="button"
                onClick={() => handleSelectCustom()}
                className={clsx(
                  'p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-95',
                  paydayOption === 'CUSTOM'
                    ? 'border-[#7e7ef1] bg-[#7e7ef1]/10 ring-2 ring-[#a0dafd]/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">✨</span>
                  {paydayOption === 'CUSTOM' && (
                    <span className="w-2 h-2 rounded-full bg-[#7e7ef1]" />
                  )}
                </div>
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {paydayOption === 'CUSTOM' ? `Tgl ${paydayDate}` : 'Pilih Tgl'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  Tgl 1 - 30
                </span>
              </button>
            </div>

            {/* Date Grid bila pilih custom tanggal */}
            {paydayOption === 'CUSTOM' && (
              <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700">Pilih Tanggal Penggajian (1 - 30):</span>
                  <span className="text-[11px] font-extrabold text-[#7e7ef1] bg-white px-2 py-0.5 rounded-md border border-[#a0dafd]/40">
                    Tgl {paydayDate}
                  </span>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5 text-center">
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
                    const isSelected = paydayDate === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleSelectCustom(d)}
                        className={clsx(
                          'h-7 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center',
                          isSelected
                            ? 'bg-[#7e7ef1] text-white shadow-xs ring-2 ring-[#a0dafd]/60 scale-105'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                        )}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Real-time Payday Cycle Preview */}
            <div className="mt-2.5 p-3 rounded-2xl bg-[#7e7ef1]/8 border border-[#a0dafd]/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <CalendarCheck className="w-4 h-4 text-[#7e7ef1] shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-500 font-medium">Siklus Gajian Berikutnya:</p>
                  <p className="font-extrabold text-slate-900 truncate">
                    {paydayOption === 'LAST_DAY' ? 'Akhir Bulan' : `Tanggal ${paydayDate}`} ({formattedNextDate})
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-white text-[#7e7ef1] border border-[#a0dafd]/40 shadow-xs shrink-0 ml-2">
                {cycleInfo.daysRemaining} hari lagi
              </span>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 rounded-2xl bg-[#7e7ef1] hover:bg-[#6c6ce8] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#7e7ef1]/25 ring-1 ring-[#a0dafd]/30 active:scale-98 transition"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition text-center"
              >
                Keluar dari Akun (Logout)
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
