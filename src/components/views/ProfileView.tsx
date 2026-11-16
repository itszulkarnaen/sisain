'use client';

import React from 'react';
import Image from 'next/image';
import {
  ArrowLeft,
  Pencil,
  Crown,
  Sparkles,
  Lock,
  CreditCard,
  Hourglass,
  PartyPopper,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';
import { Profile } from '@/types';
import { formatRupiah } from '@/lib/utils/currency';
import { getPaydayCycle } from '@/lib/utils/payday';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface ProfileViewProps {
  profile: Profile | null;
  googleAvatarUrl?: string | null;
  onBack: () => void;
  onOpenEdit: () => void;
  onOpenSultanModal: () => void;
  onOpenPwaGuide?: () => void;
  onLogout?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  googleAvatarUrl,
  onBack,
  onOpenEdit,
  onOpenSultanModal,
  onOpenPwaGuide,
  onLogout,
}) => {
  const status = profile?.subscription_status || 'TRIAL';
  const paydayDate = profile?.payday_date || 25;
  const cycleInfo = getPaydayCycle(paydayDate);
  const now = new Date();

  // Hitung mundur hari gajian
  const daysUntilPayday = differenceInCalendarDays(cycleInfo.nextPaydayDate, now);

  // Hitung sisa hari free trial
  const trialDaysLeft = profile?.trial_ends_at
    ? Math.max(0, differenceInCalendarDays(parseISO(profile.trial_ends_at), now))
    : 0;

  const currentAvatar = profile?.avatar_url || googleAvatarUrl || '/pics/boy.png';
  const isUsingGoogleAvatar = Boolean(
    googleAvatarUrl && currentAvatar === googleAvatarUrl
  );

  return (
    <div className="space-y-4 pb-28 pt-1 animate-in fade-in duration-200">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-[#7e7ef1] hover:text-[#7e7ef1] shadow-xs transition active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <h2 className="text-sm font-extrabold text-slate-800">Detail Profil</h2>

        <button
          type="button"
          onClick={onOpenEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7e7ef1]/10 text-xs font-bold text-[#7e7ef1] hover:bg-[#7e7ef1]/20 transition active:scale-95"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>
      </div>

      {/* Main Identity & Avatar Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-[#7e7ef1]/15 to-transparent pointer-events-none" />

        {/* Avatar */}
        <div className="relative mt-2 mb-3">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-white border-4 border-white shadow-md flex items-center justify-center p-0.5 relative z-10 ring-2 ring-[#a0dafd]/60">
            <Image
              src={currentAvatar}
              alt={profile?.full_name || 'Pengguna'}
              width={80}
              height={80}
              unoptimized
              className="w-full h-full object-contain"
            />
          </div>
          {isUsingGoogleAvatar && (
            <span
              className="absolute bottom-0 right-0 z-20 px-1.5 py-0.2 rounded-full bg-white border border-slate-200 shadow-xs text-[8px] font-extrabold text-blue-600"
              title="Foto Akun Google Kamu"
            >
              Google
            </span>
          )}
        </div>

        {/* Name & Email */}
        <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
          {profile?.full_name || 'Pengguna'}
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          {profile?.email || 'Akun Lokal sisa.in'}
        </p>

        {/* Membership Badge Status */}
        <div className="mt-3">
          {status === 'ACTIVE' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-black shadow-2xs">
              <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>Sultan Aktif</span>
            </div>
          )}

          {status === 'TRIAL' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/70 text-[#7e7ef1] text-xs font-extrabold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Free Trial Sultan ({trialDaysLeft} Hari Lagi)</span>
            </div>
          )}

          {status === 'EXPIRED' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-extrabold shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-rose-500" />
              <span>Trial Sultan Selesai</span>
            </div>
          )}
        </div>
      </div>

      {/* Membership Sultan Banner / Card */}
      <div className="bg-gradient-to-br from-[#7e7ef1]/10 via-[#a0dafd]/15 to-white rounded-3xl p-4 border border-[#a0dafd]/50 shadow-xs space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7e7ef1] to-[#6060e8] text-white flex items-center justify-center shadow-xs shrink-0">
              <Crown className="w-5 h-5 fill-yellow-300 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black text-slate-900">Paket Sultan sisa.in</h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {status === 'ACTIVE'
                  ? `Aktif hingga ${
                      profile?.subscription_ends_at
                        ? format(parseISO(profile.subscription_ends_at), 'd MMMM yyyy', {
                            locale: id,
                          })
                        : 'Permanen'
                    }`
                  : status === 'TRIAL'
                  ? 'Nikmati semua fitur Sultan selama masa uji coba gratis.'
                  : 'Aktifkan kembali untuk membuka kunci semua fitur otomatisasi.'}
              </p>
            </div>
          </div>
        </div>

        {/* Sultan Key Benefits Quick Pills */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-700 font-medium">
          <div className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1.5 rounded-xl border border-slate-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Ekspor Excel & PDF</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1.5 rounded-xl border border-slate-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Otomasi Tagihan Rutin</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1.5 rounded-xl border border-slate-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Budget Kategori Bebas</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1.5 rounded-xl border border-slate-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Offline Mode</span>
          </div>
        </div>

        {/* Upgrade / Membership Action Button */}
        <button
          type="button"
          onClick={onOpenSultanModal}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#7e7ef1] to-[#6060e8] hover:from-[#6c6ce8] hover:to-[#5050dc] text-white text-xs font-bold shadow-md shadow-[#7e7ef1]/20 active:scale-98 transition flex items-center justify-center gap-1.5"
        >
          <span>
            {status === 'ACTIVE'
              ? 'Detail Langganan Sultan'
              : status === 'TRIAL'
              ? 'Lihat Keuntungan Sultan & Cara Bayar'
              : 'Perpanjang Paket Sultan (Rp10.000)'}
          </span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Salary & Payday Info Section */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-[#7e7ef1]" />
          <span>Informasi Finansial & Gajian</span>
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Gaji Bulanan */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">
              Gaji Bulanan
            </span>
            <span className="text-sm font-black text-slate-900 block">
              {formatRupiah(profile?.monthly_salary || 0)}
            </span>
          </div>

          {/* Tanggal Gajian */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">
              Jadwal Gajian
            </span>
            <span className="text-sm font-black text-slate-900 block">
              {paydayDate >= 31 ? 'Akhir Bulan' : `Tanggal ${paydayDate}`}
            </span>
          </div>
        </div>

        {/* Countdown Gajian Banner */}
        <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              {daysUntilPayday === 0 ? (
                <PartyPopper className="w-4 h-4" />
              ) : (
                <Hourglass className="w-4 h-4" />
              )}
            </div>
            <div>
              <span className="text-xs font-extrabold text-emerald-900 block leading-tight">
                {daysUntilPayday === 0
                  ? 'Hari Ini Gajian! 🎉'
                  : daysUntilPayday === 1
                  ? 'Besok Gajian! 🥳'
                  : `${daysUntilPayday} Hari Lagi Menuju Gajian`}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">
                Gajian berikutnya: {format(cycleInfo.nextPaydayDate, 'd MMMM yyyy', { locale: id })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons: Edit Profile & Logout */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={onOpenEdit}
          className="w-full py-3 px-4 rounded-2xl bg-white border border-slate-200 hover:border-[#7e7ef1] hover:text-[#7e7ef1] text-xs font-bold text-slate-700 shadow-xs active:scale-98 transition flex items-center justify-center gap-2"
        >
          <Pencil className="w-4 h-4 text-[#7e7ef1]" />
          <span>Ubah Profil, Gaji & Tanggal Gajian</span>
        </button>

        {onOpenPwaGuide && (
          <button
            type="button"
            onClick={onOpenPwaGuide}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#7e7ef1]/10 via-[#a0dafd]/15 to-[#7e7ef1]/10 hover:from-[#7e7ef1]/20 hover:to-[#a0dafd]/30 border border-[#a0dafd]/40 text-xs font-bold text-[#5050dc] shadow-xs active:scale-98 transition flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4 text-[#7e7ef1]" />
            <span>Panduan Pasang Aplikasi ke Layar HP</span>
          </button>
        )}

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-600 transition active:scale-98 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar dari Akun</span>
          </button>
        )}
      </div>
    </div>
  );
};
