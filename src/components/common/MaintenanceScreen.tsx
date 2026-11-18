'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ShieldCheck, RefreshCw, Lock, Database, Clock } from 'lucide-react';
import { MAINTENANCE_CONFIG } from '@/config/maintenance';

export function MaintenanceScreen() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleReload = () => {
    setIsRefreshing(true);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFD] text-slate-900 flex flex-col justify-between items-center px-4 py-8 relative overflow-hidden select-none">
      {/* Background Glow Accents */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#7e7ef1]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Branding */}
      <header className="w-full max-w-md flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center p-1.5">
            <Image
              src="/sisain.png"
              alt="sisa.in logo"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight text-slate-800 leading-none">
              sisa<span className="text-[#7e7ef1]">.in</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-600 mt-0.5 tracking-wide">
              Smart Daily Expense Tracker
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-700 text-[11px] font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          Maintenance
        </div>
      </header>

      {/* Main Content Card */}
      <main className="w-full max-w-md my-auto py-6 z-10">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center relative overflow-hidden">
          {/* Subtle top stripe */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7e7ef1] via-indigo-400 to-[#7e7ef1]" />

          {/* Central Hero Icon */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center shadow-inner mb-6 relative">
            <Database className="w-9 h-9 text-[#7e7ef1]" />
            <div className="absolute -bottom-1.5 -right-1.5 bg-[#7e7ef1] text-white p-1.5 rounded-xl shadow-md">
              <Lock className="w-4 h-4" />
            </div>
          </div>

          {/* Title & Subtitle */}
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2.5">
            {MAINTENANCE_CONFIG.title}
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-6 font-normal">
            {MAINTENANCE_CONFIG.subtitle}
          </p>

          {/* Highlight Points */}
          <div className="space-y-2.5 text-left mb-6">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100/80">
              <div className="p-1.5 bg-indigo-100/70 text-[#7e7ef1] rounded-xl shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Peningkatan Enkripsi Privasi</h4>
                <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
                  Proteksi data sensitif dengan enkripsi tingkat aplikasi sebelum disimpan ke cloud.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100/80">
              <div className="p-1.5 bg-emerald-100/70 text-emerald-600 rounded-xl shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Estimasi Selesai</h4>
                <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
                  {MAINTENANCE_CONFIG.estimatedTime} — Akses ditutup sementara agar sinkronisasi data tidak korup.
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleReload}
            disabled={isRefreshing}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#7e7ef1] hover:bg-[#6c6ce8] active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-[#7e7ef1]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Memuat Ulang...' : 'Cek Status & Muat Ulang'}</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md text-center z-10">
        <p className="text-xs text-slate-600 font-medium">
          Terima kasih atas kesabaranmu! Data keuanganmu tetap 100% aman tersimpan.
        </p>
        <p className="text-[10px] text-slate-500 mt-1">
          &copy; {new Date().getFullYear()} sisa.in — Dibuat untuk kenyamanan finansialmu.
        </p>
      </footer>
    </div>
  );
}
