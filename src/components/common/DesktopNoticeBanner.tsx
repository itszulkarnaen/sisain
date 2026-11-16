'use client';

import React, { useState } from 'react';
import { Smartphone, X } from 'lucide-react';

export const DesktopNoticeBanner: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <aside
      aria-label="Notifikasi Pengalaman Mobile"
      className="hidden sm:flex items-center justify-between gap-3 max-w-md w-full mb-3 px-4 py-2.5 bg-gradient-to-r from-[#7e7ef1]/15 via-[#a0dafd]/20 to-[#7e7ef1]/10 border border-[#a0dafd]/50 rounded-2xl shadow-xs text-slate-800 transition-all animate-in fade-in slide-in-from-top-2"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#7e7ef1] text-white flex items-center justify-center shrink-0 shadow-2xs">
          <Smartphone className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-slate-900">Lebih Enak Dibuka di HP!</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#7e7ef1] text-white">
              PWA
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
            sisa.in didesain khusus mobile-first. Buka di browser smartphone kamu untuk pengalaman terbaik!
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setIsDismissed(true)}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition shrink-0"
        title="Tutup notifikasi"
      >
        <X className="w-4 h-4" />
      </button>
    </aside>
  );
};
