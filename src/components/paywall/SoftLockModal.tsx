'use client';

import React from 'react';
import { X, Lock, CheckCircle2, MessageCircle } from 'lucide-react';

interface SoftLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  adminWaNumber?: string;
  bcaNumber?: string;
  bcaName?: string;
  ewalletNumber?: string;
}

export const SoftLockModal: React.FC<SoftLockModalProps> = ({
  isOpen,
  onClose,
  userEmail = 'usep@kantor.com',
  adminWaNumber = '6281234567890',
  bcaNumber = '1234567890',
  bcaName = 'Zul',
  ewalletNumber = '08123456789',
}) => {
  if (!isOpen) return null;

  // WhatsApp deep link message
  const waMessage = encodeURIComponent(
    `Halo admin sisa.in, saya sudah transfer Rp10.000 untuk perpanjang sisa.in Pro.\nEmail Akun: ${userEmail}\nBukti transfer terlampir ya!`
  );
  const waUrl = `https://wa.me/${adminWaNumber}?text=${waMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl z-10 px-5 pt-3 pb-6 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Handle */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Lock Icon & Title */}
        <div className="flex flex-col items-center text-center mt-2 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#7e7ef1]/10 border border-[#a0dafd]/50 flex items-center justify-center text-[#7e7ef1] mb-2 shadow-xs">
            <Lock className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h2 className="text-sm font-semibold text-slate-600">
            Masa Free Trial 30 Hari Selesai 🔐
          </h2>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Upgrade ke sisa.in Pro
          </h1>
        </div>

        {/* Benefit Card */}
        <div className="rounded-2xl border border-[#a0dafd]/40 bg-[#7e7ef1]/5 overflow-hidden mb-4 shadow-xs">
          <div className="bg-gradient-to-r from-[#7e7ef1] to-[#6060e8] px-4 py-2 text-white text-xs font-bold text-center border-b border-[#a0dafd]/30">
            Langganan Pro — Hanya Rp10.000 / bulan
          </div>
          <div className="p-4 space-y-2.5">
            <p className="text-xs font-bold text-slate-900">Benefit Pro</p>
            <div className="flex items-start gap-2 text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Otomasi Tagihan Bulanan Tanpa Batas</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Smart Budgeting & Safe-to-Spend Real-time</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Export Laporan ke Excel & PDF</span>
            </div>
          </div>
        </div>

        {/* Payment Transfer Box */}
        <p className="text-xs font-medium text-slate-600 mb-2">
          Transfer manual & kirim bukti untuk aktivasi instant:
        </p>

        <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center gap-3.5 mb-2">
          {/* QRIS SVG / Mock Icon */}
          <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 p-1.5 flex flex-col items-center justify-between shadow-xs shrink-0">
            <span className="text-[10px] font-black tracking-tight text-slate-800">QRIS</span>
            {/* Simple SVG QR Code representation */}
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-slate-900" fill="currentColor">
              <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h-4v2h2v2h-2v2h4v-2h2v-4h-2zm-4-2h2v2h-2v-2zm4-2h2v2h-2v-2zm2 2h2v2h-2v-2z" />
            </svg>
          </div>

          <div className="text-xs text-slate-700 leading-relaxed overflow-hidden">
            <p className="font-bold text-slate-900">BCA {bcaNumber}</p>
            <p className="text-slate-500 text-[11px] mb-1">a/n {bcaName}</p>
            <p className="text-[11px] text-slate-500">
              atau <span className="font-semibold text-slate-700">GoPay / OVO / Dana:</span>
            </p>
            <p className="font-bold text-slate-800">{ewalletNumber}</p>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 text-center mb-4">
          Silakan screenshot & scan QRIS di atas, atau transfer ke rekening.
        </p>

        {/* WhatsApp Button */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-98 transition mb-2"
        >
          <MessageCircle className="w-5 h-5 fill-white" />
          <span>Konfirmasi Pembayaran (WA)</span>
        </a>

        <p className="text-[10px] text-slate-400 text-center">
          Akses manual akan diberikan oleh admin setelah verifikasi chat.
        </p>
      </div>
    </div>
  );
};

