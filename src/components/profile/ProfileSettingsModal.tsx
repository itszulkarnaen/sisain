'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Calendar, CreditCard, Sparkles, Save } from 'lucide-react';
import { Profile } from '@/types';
import { formatRupiah, formatRupiahInput, parseRupiahInput } from '@/lib/utils/currency';

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
  const [fullName, setFullName] = useState(profile?.full_name || 'Pengguna');
  const [salaryStr, setSalaryStr] = useState(
    profile?.monthly_salary && profile.monthly_salary > 0
      ? formatRupiahInput(profile.monthly_salary)
      : ''
  );
  const [paydayDate, setPaydayDate] = useState(profile?.payday_date || 25);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || 'Pengguna');
      setSalaryStr(
        profile.monthly_salary && profile.monthly_salary > 0
          ? formatRupiahInput(profile.monthly_salary)
          : ''
      );
      setPaydayDate(profile.payday_date || 25);
    }
  }, [profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const salary = parseRupiahInput(salaryStr);
    if (salary < 0) return;

    setIsSaving(true);
    try {
      await onSaveProfile({
        fullName: fullName.trim() || 'Pengguna',
        monthlySalary: salary,
        paydayDate,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const status = profile?.subscription_status || 'TRIAL';

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
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Nama Lengkap */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Nama Panggilan</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Usep"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden font-medium"
              required
            />
          </div>

          {/* Nominal Gaji Bulanan */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              <span>Gaji Pokok Bulanan</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={salaryStr}
              onChange={(e) => setSalaryStr(formatRupiahInput(e.target.value))}
              placeholder="Contoh: Rp 8.000.000"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden font-bold text-slate-900"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Dipakai untuk menghitung batas belanja harian (*Safe-to-Spend*): {formatRupiah(parseRupiahInput(salaryStr))}
            </p>
          </div>

          {/* Tanggal Gajian */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Tanggal Gajian Bulanan</span>
            </label>
            <select
              value={paydayDate}
              onChange={(e) => setPaydayDate(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden bg-white font-bold text-slate-800"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Tanggal {d} setiap bulan {d === 25 ? '(Default Payroll)' : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Siklus anggaran bulanan lu akan otomatis dihitung dari tanggal {paydayDate}.
            </p>
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
