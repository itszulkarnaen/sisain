'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  User,
  Calendar,
  CreditCard,
  Save,
  CalendarCheck,
  HourglassCog,
  BriefcaseBusiness,
  CalendarCog,
  Camera,
} from 'lucide-react';
import { Profile } from '@/types';
import { formatRupiahInput, parseRupiahInput } from '@/lib/utils/currency';
import { getPaydayCycle } from '@/lib/utils/payday';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { clsx } from 'clsx';

type PaydayOption = 'LAST_DAY' | 'DAY_25' | 'CUSTOM';

const PRESET_AVATARS = [
  { id: 'boy', label: 'Cowok', path: '/pics/boy.png' },
  { id: 'girl', label: 'Cewek', path: '/pics/girl.png' },
  { id: 'woman', label: 'Wanita', path: '/pics/woman.png' },
  { id: 'hijab-girl', label: 'Hijab', path: '/pics/hijab-girl.png' },
  { id: 'young-boy', label: 'Remaja', path: '/pics/young-boy.png' },
  { id: 'student', label: 'Pelajar', path: '/pics/student.png' },
  { id: 'business-woman', label: 'Karier', path: '/pics/business-woman.png' },
  { id: 'nerd', label: 'Kacamata', path: '/pics/nerd.png' },
  { id: 'bald', label: 'Botak', path: '/pics/bald.png' },
];

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  googleAvatarUrl?: string | null;
  onSaveProfile: (data: {
    fullName: string;
    monthlySalary: number;
    paydayDate: number;
    avatarUrl?: string | null;
  }) => Promise<void>;
  onOpenPaywall?: () => void;
  onLogout?: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  googleAvatarUrl,
  onSaveProfile,
}) => {
  const resolvedGoogleAvatar =
    googleAvatarUrl ||
    (profile?.avatar_url?.includes('googleusercontent.com') ? profile.avatar_url : null);

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(
    profile?.avatar_url || resolvedGoogleAvatar || '/pics/boy.png'
  );
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
      setAvatarUrl(profile?.avatar_url || resolvedGoogleAvatar || '/pics/boy.png');
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
  }, [
    isOpen,
    profile?.id,
    profile?.full_name,
    profile?.avatar_url,
    resolvedGoogleAvatar,
    profile?.monthly_salary,
    profile?.payday_date,
  ]);

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
        avatarUrl,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const cycleInfo = getPaydayCycle(paydayDate);
  const formattedNextDate = format(cycleInfo.nextPaydayDate, 'd MMMM yyyy', { locale: id });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl z-10 px-5 pt-3 pb-6 flex flex-col max-h-[92vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3" />

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900">Ubah Profil & Data Gaji</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Settings */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Picker Section */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#7e7ef1]" />
                <span>Avatar</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Klik untuk memilih</span>
            </div>

            {/* 5 Columns x 2 Rows Grid (No Scroll) */}
            <div className="grid grid-cols-5 gap-2">
              {/* Opsi Foto Akun Google (Hanya jika user punya foto Google) */}
              {resolvedGoogleAvatar && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl(resolvedGoogleAvatar)}
                  className={clsx(
                    'relative aspect-square rounded-2xl overflow-hidden border-2 transition active:scale-90 flex items-center justify-center group bg-white shadow-2xs',
                    avatarUrl === resolvedGoogleAvatar
                      ? 'border-[#7e7ef1] ring-2 ring-[#a0dafd] scale-105 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100'
                  )}
                  title="Gunakan Foto Akun Google Kamu"
                >
                  <Image
                    src={resolvedGoogleAvatar}
                    alt="Foto Google"
                    width={48}
                    height={48}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-blue-600/90 text-white text-[7px] font-bold text-center leading-tight py-0.2">
                    Google
                  </span>
                  {avatarUrl === resolvedGoogleAvatar && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#7e7ef1] text-white rounded-full flex items-center justify-center text-[8px] font-extrabold shadow-xs">
                      ✓
                    </span>
                  )}
                </button>
              )}

              {/* 9 Preset Pics Avatars */}
              {PRESET_AVATARS.map((item) => {
                const isSelected = avatarUrl === item.path;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAvatarUrl(item.path)}
                    className={clsx(
                      'relative aspect-square rounded-2xl overflow-hidden border-2 transition active:scale-90 flex items-center justify-center p-1 bg-white shadow-2xs',
                      isSelected
                        ? 'border-[#7e7ef1] ring-2 ring-[#a0dafd] scale-105 shadow-xs bg-[#7e7ef1]/10'
                        : 'border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100'
                    )}
                    title={item.label}
                  >
                    <Image
                      src={item.path}
                      alt={item.label}
                      width={44}
                      height={44}
                      unoptimized
                      className="w-full h-full object-contain"
                    />
                    {isSelected && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#7e7ef1] text-white rounded-full flex items-center justify-center text-[8px] font-extrabold shadow-xs">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nama Panggilan */}
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
                placeholder="Ketik nama panggilan kamu..."
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
          </div>

          {/* Nominal Gaji / Alokasi Bulanan */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#7e7ef1]" />
                <span>Gaji / Alokasi Bujet Bulanan</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Bisa gaji atau porsi jajan</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={salaryStr}
              onChange={(e) => setSalaryStr(formatRupiahInput(e.target.value))}
              placeholder="Contoh: 8.000.000"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-[#7e7ef1] focus:ring-2 focus:ring-[#a0dafd]/40 outline-hidden font-bold text-slate-900 transition bg-white"
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Kamu bebas memasukkan nominal gaji bersih asli atau sekadar alokasi budget bulanan yang ingin dikontrol.
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
                  <HourglassCog className="w-5 h-5 text-[#7e7ef1]" />
                  {paydayOption === 'LAST_DAY' && (
                    <span className="w-2 h-2 rounded-full bg-[#7e7ef1]" />
                  )}
                </div>
                <span className="text-xs font-bold text-slate-900 leading-tight">Akhir Bulan</span>
                <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">Tgl 28-31</span>
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
                  <BriefcaseBusiness className="w-5 h-5 text-[#7e7ef1]" />
                  {paydayOption === 'DAY_25' && (
                    <span className="w-2 h-2 rounded-full bg-[#7e7ef1]" />
                  )}
                </div>
                <span className="text-xs font-bold text-slate-900 leading-tight">Tanggal 25</span>
                <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">Payroll ID</span>
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
                  <CalendarCog className="w-5 h-5 text-[#7e7ef1]" />
                  {paydayOption === 'CUSTOM' && (
                    <span className="w-2 h-2 rounded-full bg-[#7e7ef1]" />
                  )}
                </div>
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {paydayOption === 'CUSTOM' ? `Tgl ${paydayDate}` : 'Pilih Tgl'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">Tgl 1 - 30</span>
              </button>
            </div>

            {/* Date Grid bila pilih custom tanggal */}
            {paydayOption === 'CUSTOM' && (
              <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">Pilih Tanggal Gajian:</span>
                  <span className="text-xs font-extrabold text-[#7e7ef1] bg-[#7e7ef1]/10 px-2 py-0.5 rounded-full">
                    Tanggal {paydayDate}
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setPaydayDate(day)}
                      className={clsx(
                        'h-8 rounded-xl text-xs font-bold transition-all active:scale-90',
                        paydayDate === day
                          ? 'bg-[#7e7ef1] text-white shadow-xs ring-2 ring-[#a0dafd]'
                          : 'bg-white hover:bg-[#a0dafd]/20 text-slate-700 border border-slate-200/60'
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Informasi Siklus Aktif */}
            <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-[#7e7ef1] shrink-0" />
                <span className="text-[11px] font-semibold text-slate-600">Gajian Berikutnya:</span>
              </div>
              <span className="text-xs font-extrabold text-[#7e7ef1]">{formattedNextDate}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition active:scale-98"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 px-4 rounded-xl bg-[#7e7ef1] hover:bg-[#6c6ce8] text-white text-xs font-bold shadow-xs active:scale-98 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
