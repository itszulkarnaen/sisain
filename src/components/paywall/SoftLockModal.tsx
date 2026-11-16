'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Lock, CheckCircle2, MessageCircle, Crown, ZoomIn, Maximize2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface SoftLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  status?: 'TRIAL' | 'ACTIVE' | 'EXPIRED';
  trialDaysLeft?: number;
  subscriptionEndsAt?: string | null;
  userEmail?: string;
  adminWaNumber?: string;
  bcaNumber?: string;
  bcaName?: string;
  ewalletNumber?: string;
}

export const SoftLockModal: React.FC<SoftLockModalProps> = ({
  isOpen,
  onClose,
  status = 'TRIAL',
  trialDaysLeft = 30,
  subscriptionEndsAt,
  userEmail = 'user@sisa.in',
  adminWaNumber = '6281234567890',
}) => {
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  if (!isOpen) return null;

  // WhatsApp deep link message
  const waSubject =
    status === 'EXPIRED'
      ? 'mengaktifkan kembali paket Sultan (trial berakhir)'
      : status === 'ACTIVE'
      ? 'perpanjang paket Sultan'
      : 'berlangganan paket Sultan (masih masa trial)';

  const waMessage = encodeURIComponent(
    `Halo admin sisa.in, saya mau ${waSubject} seharga Rp10.000.\nEmail Akun: ${userEmail}\nBukti transfer terlampir ya!`
  );
  const waUrl = `https://wa.me/${adminWaNumber}?text=${waMessage}`;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in">
        <div className="fixed inset-0" onClick={onClose} />

        <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl z-10 px-5 pt-3 pb-6 flex flex-col max-h-[99vh] overflow-y-auto">
          {/* Handle */}
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3" />

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Icon & Title Based on Condition */}
          <div className="flex flex-col items-center text-center mt-2 mb-4">
            {status === 'ACTIVE' ? (
              <>
                <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-300 flex items-center justify-center text-amber-600 mb-2 shadow-xs">
                  <Crown className="w-6 h-6 fill-amber-500 text-amber-500" />
                </div>
                <h2 className="text-sm font-semibold text-amber-700">
                  Kamu Adalah Sultan! 👑
                </h2>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Paket Sultan sisa.in Aktif
                </h1>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Masa aktif berlaku hingga{' '}
                  <span className="font-bold text-slate-800">
                    {subscriptionEndsAt
                      ? format(parseISO(subscriptionEndsAt), 'd MMMM yyyy', { locale: id })
                      : 'Permanen'}
                  </span>
                  . Ingin tambah durasi langganan? Silakan transfer dan konfirmasi di bawah.
                </p>
              </>
            ) : status === 'EXPIRED' ? (
              <>
                <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 mb-2 shadow-xs">
                  <Lock className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h2 className="text-sm font-semibold text-rose-600">
                  Masa Free Trial Selesai ⏳
                </h2>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Aktifkan Paket Sultan
                </h1>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Masa percobaan gratis 30 hari kamu sudah selesai. Yuk aktifkan paket Sultan seharga Rp10.000 untuk buka kembali semua fitur!
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-[#7e7ef1]/10 border border-[#a0dafd]/50 flex items-center justify-center text-[#7e7ef1] mb-2 shadow-xs">
                  <Crown className="w-6 h-6 fill-yellow-300 text-yellow-400" />
                </div>
                <h2 className="text-sm font-semibold text-[#7e7ef1]">
                  Keuntungan Paket Sultan
                </h2>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Upgrade ke sisa.in Sultan
                </h1>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Kamu saat ini sedang menikmati Free Trial ({trialDaysLeft} hari lagi). Mau lanjut tanpa jeda? Kamu bisa aktivasi kapan saja!
                </p>
              </>
            )}
          </div>

          {/* Benefit Card */}
          <div className="rounded-2xl border border-[#a0dafd]/40 bg-[#7e7ef1]/5 overflow-hidden mb-4 shadow-xs">
            <div className="bg-gradient-to-r from-[#7e7ef1] to-[#6060e8] px-4 py-6 text-white text-xs font-bold text-center border-b border-[#a0dafd]/30">
              Langganan Sultan — Hanya Rp10.000 / bulan
            </div>
            <div className="p-4 space-y-2.5">
              <p className="text-xs font-bold text-slate-900">Kelebihan Sultan</p>
              <div className="flex items-start gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Otomasi Tagihan Bulanan & Recurring Eksekusi Otomatis</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Smart Budgeting per Kategori Tanpa Batas</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Ekspor Pembukuan ke File Excel (.xlsx) & PDF Lengkap</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Akses Paling Cepat & Dukungan Prioritas WhatsApp</span>
              </div>
            </div>
          </div>

          {/* Payment QRIS & Rekening Box */}
          <div className="p-4 rounded-3xl border border-slate-200 bg-slate-50/80 space-y-3.5 mb-3 shadow-2xs">
            <div className="flex flex-col items-center text-center">
              {/* Clickable QR Code Preview */}
              <div
                onClick={() => setIsZoomOpen(true)}
                className="relative w-48 h-48 bg-white rounded-2xl p-2.5 border border-slate-200/90 shadow-sm cursor-pointer group hover:border-[#7e7ef1] hover:shadow-md transition active:scale-98 flex items-center justify-center"
                title="Klik untuk memperbesar QR Code"
              >
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  <Image
                    src="/qr_pembayaran.jpg"
                    alt="QRIS Pembayaran sisa.in"
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>

                {/* Hover/Tap Zoom Overlay */}
                <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition rounded-2xl flex flex-col items-center justify-center text-white gap-1">
                  <Maximize2 className="w-6 h-6 stroke-[2.2]" />
                  <span className="text-[10px] font-bold">Buka Layar Penuh</span>
                </div>

                <div className="absolute -bottom-2 bg-white border border-slate-200 rounded-full px-2.5 py-0.5 shadow-xs flex items-center gap-1 text-[9px] font-bold text-[#7e7ef1]">
                  <ZoomIn className="w-3 h-3" />
                  <span>Klik Perbesar</span>
                </div>
              </div>

              <p className="text-[11px] font-bold text-slate-800 mt-4">
                Scan QRIS di atas (Semua Bank & E-Wallet)
              </p>
              <p className="text-[10px] text-slate-400">
                Screenshot atau scan langsung nominal <span className="font-bold text-slate-700">Rp10.000</span>.
              </p>
            </div>
          </div>

          {/* WhatsApp Button */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-98 transition mb-2"
          >
            <MessageCircle className="w-5 h-5 fill-white" />
            <span>Konfirmasi ke WhatsApp</span>
          </a>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition text-center"
          >
            Nanti Saja
          </button>
        </div>
      </div>

      {/* FULLSCREEN QRIS LIGHTBOX MODAL */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-70 flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="relative max-w-sm w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between text-white mb-3 px-1">
              <span className="text-sm font-extrabold">QRIS Pembayaran sisa.in</span>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full bg-white rounded-3xl p-4 shadow-2xl flex flex-col items-center">
              <div className="relative w-full aspect-square max-w-[300px] rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center">
                <Image
                  src="/qr_pembayaran.jpg"
                  alt="QRIS Pembayaran sisa.in Layar Penuh"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>

              <p className="text-xs font-extrabold text-slate-900 mt-3 text-center">
                Scan atau Screenshot QRIS Ini
              </p>
              <p className="text-[11px] text-slate-500 text-center mt-0.5">
                Mendukung BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay, dsb.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="mt-4 px-6 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition"
            >
              Tutup Tampilan Penuh
            </button>
          </div>
        </div>
      )}
    </>
  );
};
