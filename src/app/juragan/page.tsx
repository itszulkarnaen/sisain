'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  KeyRound,
  Users,
  Crown,
  Zap,
  Lock,
  Search,
  RefreshCw,
  LogOut,
  CheckCircle2,
  RotateCcw,
  ArrowLeft,
  X,
  AlertCircle,
} from 'lucide-react';
import { Profile } from '@/types';
import { formatRupiah } from '@/lib/utils/currency';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface SubscribersResponse {
  success: boolean;
  profiles: Profile[];
  stats: {
    total: number;
    sultan: number;
    trial: number;
    expired: number;
  };
  isServiceRoleConfigured?: boolean;
  error?: string;
}

export default function JuraganPage() {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState({ total: 0, sultan: 0, trial: 0, expired: 0 });
  const [isServiceRoleConfigured, setIsServiceRoleConfigured] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'TRIAL' | 'EXPIRED'>('ALL');

  // Action Modal State
  const [targetUser, setTargetUser] = useState<Profile | null>(null);
  const [actionType, setActionType] = useState<'UPGRADE' | 'DEMOTE' | 'RESET' | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(1); // months, 999 = permanent
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const fetchSubscribers = useCallback(async (activePin: string) => {
    setIsLoadingData(true);
    setDataError('');
    try {
      const res = await fetch('/api/juragan', {
        headers: {
          'x-juragan-pin': activePin,
        },
      });
      const data: SubscribersResponse = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memuat data subscriber');
      }
      setProfiles(data.profiles || []);
      setStats(data.stats || { total: 0, sultan: 0, trial: 0, expired: 0 });
      setIsServiceRoleConfigured(data.isServiceRoleConfigured !== false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setDataError(msg);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Check saved session on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedPin = sessionStorage.getItem('juragan_active_pin');
    if (savedPin) {
      setPin(savedPin);
      setIsAuthenticated(true);
      fetchSubscribers(savedPin);
    }
  }, [fetchSubscribers]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/juragan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-pin', pin: pin.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'PIN Juragan salah!');
      }

      sessionStorage.setItem('juragan_active_pin', pin.trim());
      setIsAuthenticated(true);
      await fetchSubscribers(pin.trim());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLoginError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('juragan_active_pin');
    setIsAuthenticated(false);
    setPin('');
    setProfiles([]);
  };

  const handleExecuteAction = async () => {
    if (!targetUser || !actionType) return;
    setIsSubmittingAction(true);
    setActionSuccessMsg('');

    let targetStatus: 'ACTIVE' | 'EXPIRED' | 'TRIAL' = 'ACTIVE';
    if (actionType === 'UPGRADE') targetStatus = 'ACTIVE';
    else if (actionType === 'DEMOTE') targetStatus = 'EXPIRED';
    else if (actionType === 'RESET') targetStatus = 'TRIAL';

    try {
      const res = await fetch('/api/juragan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-juragan-pin': pin,
        },
        body: JSON.stringify({
          action: 'update-subscription',
          userId: targetUser.id,
          targetStatus,
          durationMonths: actionType === 'UPGRADE' ? selectedDuration : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengubah status subscriber');
      }

      // Update state lokal
      setProfiles((prev) =>
        prev.map((p) => (p.id === targetUser.id ? { ...p, ...data.profile } : p))
      );
      setActionSuccessMsg(`Status ${targetUser.full_name || targetUser.email} berhasil diperbarui!`);

      // Refresh list
      await fetchSubscribers(pin);

      setTimeout(() => {
        setActionType(null);
        setTargetUser(null);
        setActionSuccessMsg('');
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Terjadi kesalahan: ${msg}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Filtered subscribers list
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const query = searchQuery.trim().toLowerCase();
      const matchQuery =
        !query ||
        (p.full_name && p.full_name.toLowerCase().includes(query)) ||
        (p.email && p.email.toLowerCase().includes(query)) ||
        p.id.toLowerCase().includes(query);

      const matchStatus =
        statusFilter === 'ALL' || p.subscription_status === statusFilter;

      return matchQuery && matchStatus;
    });
  }, [profiles, searchQuery, statusFilter]);

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-800 border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-white">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7e7ef1] to-[#6060e8] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#7e7ef1]/30">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>

          <h1 className="text-xl font-black text-center tracking-tight">Portal Juragan</h1>
          <p className="text-xs text-slate-400 text-center mt-1 mb-6 leading-relaxed">
            Backoffice manajemen subscriber &amp; aktivasi paket Sultan sisa.in.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                PIN Juragan
              </label>
              <div className="relative">
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Masukkan PIN"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 focus:border-[#7e7ef1] rounded-2xl outline-hidden text-sm font-bold tracking-widest text-center text-white placeholder:text-slate-500 placeholder:tracking-normal transition"
                  autoFocus
                  required
                />
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#7e7ef1] to-[#6060e8] hover:from-[#6c6ce8] hover:to-[#5050dc] font-bold text-xs tracking-wide shadow-md active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isLoggingIn ? 'Memverifikasi...' : 'Masuk Portal Juragan'}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-700/60 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Aplikasi Utama</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // AUTHENTICATED DASHBOARD
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-[#7e7ef1]/30">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
            title="Kembali ke App Utama"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-tight">Portal Juragan</h1>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#7e7ef1]/20 text-[#a0dafd] border border-[#7e7ef1]/30">
                Backoffice
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Kelola status member Sultan &amp; Free Trial pengguna sisa.in
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchSubscribers(pin)}
            disabled={isLoadingData}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
            title="Segarkan Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold transition flex items-center gap-1.5"
            title="Keluar"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Service Role Missing Warning */}
        {!isServiceRoleConfigured && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2 font-black text-amber-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>SUPABASE_SERVICE_ROLE_KEY Belum Terpasang di .env.local</span>
            </div>
            <p className="text-[11px] text-amber-300/90 leading-relaxed pl-6">
              Karena Supabase menerapkan RLS (Row Level Security) pada tabel <code className="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-white">profiles</code>, panggilan anonim dibatasi menjadi 0 baris. Salin <strong className="text-white">service_role secret key</strong> dari Supabase Dashboard &gt; Project Settings &gt; API, lalu tambahkan <code className="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-white">SUPABASE_SERVICE_ROLE_KEY=eyJh...</code> ke file <code className="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-white">.env.local</code> agar data subscriber bisa ditarik tanpa terhalang RLS.
            </p>
          </div>
        )}

        {/* Error Notification */}
        {dataError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{dataError}</span>
            </div>
            <button
              onClick={() => fetchSubscribers(pin)}
              className="text-xs font-bold underline hover:text-rose-300"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* 4 Stats Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Pengguna */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">Total Pengguna</span>
              <span className="text-2xl font-black text-white mt-1 block">
                {isLoadingData ? '...' : stats.total}
              </span>
              <span className="text-[10px] text-slate-500">Terdaftar di database</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Sultan Aktif */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">Member Sultan</span>
              <span className="text-2xl font-black text-amber-400 mt-1 block">
                {isLoadingData ? '...' : stats.sultan}
              </span>
              <span className="text-[10px] text-slate-500">Paket Sultan Aktif</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
          </div>

          {/* Masa Trial */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">Free Trial</span>
              <span className="text-2xl font-black text-indigo-400 mt-1 block">
                {isLoadingData ? '...' : stats.trial}
              </span>
              <span className="text-[10px] text-slate-500">Masa Coba 30 Hari</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
          </div>

          {/* Expired / Free */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">Expired / Terkunci</span>
              <span className="text-2xl font-black text-rose-400 mt-1 block">
                {isLoadingData ? '...' : stats.expired}
              </span>
              <span className="text-[10px] text-slate-500">Trial Habis</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/80">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama, email, atau ID user..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 focus:border-[#7e7ef1] rounded-xl outline-hidden text-xs text-white placeholder:text-slate-500 transition"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-[#7e7ef1] text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              Semua ({stats.total})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'ACTIVE'
                  ? 'bg-amber-500 text-slate-900 shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Sultan ({stats.sultan})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('TRIAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'TRIAL'
                  ? 'bg-indigo-500 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Trial ({stats.trial})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('EXPIRED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'EXPIRED'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Expired ({stats.expired})</span>
            </button>
          </div>
        </div>

        {/* Table of Subscribers */}
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-700 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-bold">Pengguna</th>
                  <th className="py-3 px-4 font-bold">Status Member</th>
                  <th className="py-3 px-4 font-bold">Masa Aktif</th>
                  <th className="py-3 px-4 font-bold">Gaji &amp; Siklus</th>
                  <th className="py-3 px-4 font-bold text-right">Aksi Juragan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {isLoadingData ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#7e7ef1]" />
                      <p className="font-semibold text-xs">Mengambil data subscriber...</p>
                    </td>
                  </tr>
                ) : filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="font-bold text-xs text-slate-300">Tidak ada pengguna ditemukan.</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {searchQuery ? 'Coba gunakan kata kunci pencarian lain.' : 'Belum ada data subscriber.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map((user) => {
                    const status = user.subscription_status || 'TRIAL';
                    const trialDaysLeft = user.trial_ends_at
                      ? Math.max(0, differenceInCalendarDays(parseISO(user.trial_ends_at), new Date()))
                      : 0;

                    return (
                      <tr key={user.id} className="hover:bg-slate-700/30 transition">
                        {/* User Column */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-700 border border-slate-600 shrink-0">
                              {user.avatar_url ? (
                                <Image
                                  src={user.avatar_url}
                                  alt={user.full_name || 'User'}
                                  fill
                                  className="object-cover"
                                  sizes="36px"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-slate-300 text-xs">
                                  {(user.full_name || user.email || 'U')[0].toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate max-w-xs">
                                {user.full_name || 'Pengguna Baru'}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate max-w-xs font-mono">
                                {user.email || 'Tidak ada email'}
                              </p>
                              <p className="text-[9px] text-slate-500 truncate max-w-xs font-mono mt-0.5">
                                ID: {user.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Status Column */}
                        <td className="py-3.5 px-4">
                          {status === 'ACTIVE' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-[11px]">
                              <Crown className="w-3.5 h-3.5" />
                              <span>Sultan</span>
                            </span>
                          )}
                          {status === 'TRIAL' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-extrabold text-[11px]">
                              <Zap className="w-3.5 h-3.5" />
                              <span>Free Trial</span>
                            </span>
                          )}
                          {status === 'EXPIRED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-extrabold text-[11px]">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Expired</span>
                            </span>
                          )}
                        </td>

                        {/* Masa Aktif Column */}
                        <td className="py-3.5 px-4 text-slate-300">
                          {status === 'ACTIVE' ? (
                            <div>
                              <p className="font-bold text-slate-200">
                                {user.subscription_ends_at
                                  ? format(parseISO(user.subscription_ends_at), 'd MMM yyyy', {
                                      locale: id,
                                    })
                                  : 'Permanen / Selamanya'}
                              </p>
                              {user.subscription_ends_at && (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {differenceInCalendarDays(parseISO(user.subscription_ends_at), new Date()) > 0
                                    ? `${differenceInCalendarDays(parseISO(user.subscription_ends_at), new Date())} hari lagi`
                                    : 'Berakhir hari ini'}
                                </p>
                              )}
                            </div>
                          ) : status === 'TRIAL' ? (
                            <div>
                              <p className="font-bold text-indigo-300">
                                {trialDaysLeft} hari tersisa
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {user.trial_ends_at
                                  ? format(parseISO(user.trial_ends_at), 'd MMM yyyy', { locale: id })
                                  : '-'}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold text-rose-400">Terkunci</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">Perlu perpanjangan</p>
                            </div>
                          )}
                        </td>

                        {/* Gaji & Siklus Column */}
                        <td className="py-3.5 px-4 text-slate-300">
                          <div className="font-semibold text-slate-200">
                            {typeof (user.monthly_salary as unknown) === 'string' &&
                            (user.monthly_salary as unknown as string).startsWith('enc_v1:') ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium text-xs bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/40">
                                <Lock className="w-3 h-3" /> Terenkripsi (ALFE)
                              </span>
                            ) : Number(user.monthly_salary) > 0 ? (
                              formatRupiah(Number(user.monthly_salary))
                            ) : (
                              'Belum diatur'
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Gajian tiap tgl {user.payday_date || 25}
                          </p>
                        </td>

                        {/* Actions Column */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Upgrade ke Sultan */}
                            <button
                              type="button"
                              onClick={() => {
                                setTargetUser(user);
                                setActionType('UPGRADE');
                                setSelectedDuration(1);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1"
                              title="Upgrade ke Sultan"
                            >
                              <Crown className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">Sultan</span>
                            </button>

                            {/* Demote ke Free */}
                            {status === 'ACTIVE' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetUser(user);
                                  setActionType('DEMOTE');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1"
                                title="Demote ke Free"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Kunci</span>
                              </button>
                            )}

                            {/* Reset Trial */}
                            <button
                              type="button"
                              onClick={() => {
                                setTargetUser(user);
                                setActionType('RESET');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold transition flex items-center gap-1"
                              title="Reset / Beri 30 Hari Trial"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">+30 Hari</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ACTION MODAL DIALOG */}
      {actionType && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in">
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl text-white relative">
            <button
              onClick={() => {
                if (!isSubmittingAction) {
                  setActionType(null);
                  setTargetUser(null);
                }
              }}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* UPGRADE MODAL */}
            {actionType === 'UPGRADE' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Upgrade ke Sultan</h3>
                    <p className="text-xs text-slate-400">
                      User: <span className="font-bold text-slate-200">{targetUser.full_name || targetUser.email}</span>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-2 uppercase tracking-wider">
                    Pilih Durasi Sultan
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: '1 Bulan', months: 1, desc: 'Rp 10.000' },
                      { label: '3 Bulan', months: 3, desc: 'Rp 30.000' },
                      { label: '6 Bulan', months: 6, desc: 'Rp 60.000' },
                      { label: '1 Tahun', months: 12, desc: 'Rp 100.000' },
                      { label: 'Permanen', months: 999, desc: 'Selamanya' },
                    ].map((item) => (
                      <button
                        key={item.months}
                        type="button"
                        onClick={() => setSelectedDuration(item.months)}
                        className={`p-3 rounded-xl border text-left transition ${
                          selectedDuration === item.months
                            ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                        } ${item.months === 999 ? 'col-span-2' : ''}`}
                      >
                        <p className="font-extrabold text-xs">{item.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {actionSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{actionSuccessMsg}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActionType(null);
                      setTargetUser(null);
                    }}
                    disabled={isSubmittingAction}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold text-xs transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteAction}
                    disabled={isSubmittingAction}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Crown className="w-4 h-4" />
                    <span>{isSubmittingAction ? 'Menyimpan...' : 'Konfirmasi Sultan'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* DEMOTE MODAL */}
            {actionType === 'DEMOTE' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Demote ke Expired / Free</h3>
                    <p className="text-xs text-slate-400">
                      User: <span className="font-bold text-slate-200">{targetUser.full_name || targetUser.email}</span>
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-700">
                  Status langganan user ini akan diubah menjadi <strong className="text-rose-400">EXPIRED</strong>. Fitur ekspor Excel/PDF dan otomasi tagihan akan langsung terkunci di perangkat user.
                </p>

                {actionSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{actionSuccessMsg}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActionType(null);
                      setTargetUser(null);
                    }}
                    disabled={isSubmittingAction}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold text-xs transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteAction}
                    disabled={isSubmittingAction}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isSubmittingAction ? 'Menyimpan...' : 'Kunci Akun (Demote)'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* RESET TRIAL MODAL */}
            {actionType === 'RESET' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Reset Free Trial (+30 Hari)</h3>
                    <p className="text-xs text-slate-400">
                      User: <span className="font-bold text-slate-200">{targetUser.full_name || targetUser.email}</span>
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-700">
                  Status user ini akan diatur kembali ke <strong className="text-indigo-400">TRIAL</strong> dengan sisa masa coba gratis <strong className="text-white font-bold">30 hari</strong> terhitung mulai hari ini.
                </p>

                {actionSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{actionSuccessMsg}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActionType(null);
                      setTargetUser(null);
                    }}
                    disabled={isSubmittingAction}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold text-xs transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteAction}
                    disabled={isSubmittingAction}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{isSubmittingAction ? 'Menyimpan...' : 'Beri 30 Hari Trial'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
