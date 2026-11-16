'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Lock, CheckCircle2, MessageCircle, Crown, ZoomIn, Maximize2, Download } from 'lucide-react';
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

  const handleDownloadQr = async () => {
    try {
      const response = await fetch('/qr_pembayaran.jpg');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'QRIS_sisain_Rp10000.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      const link = document.createElement('a');
      link.href = '/qr_pembayaran.jpg';
      link.download = 'QRIS_sisain_Rp10000.jpg';
      link.target = '_blank';
      link.click();
    }
  };

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

        <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl z-10 px-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] flex flex-col max-h-[88dvh] sm:max-h-[85vh] overflow-y-auto overscroll-contain">
          {/* Handle */}
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2 shrink-0" />

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Icon & Title Based on Condition */}
          <div className="flex flex-col items-center text-center mt-1 mb-3 shrink-0">
            {status === 'ACTIVE' ? (
              <>
                <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-300 flex items-center justify-center text-amber-600 mb-1.5 shadow-xs">
                  <Crown className="w-5 h-5 fill-amber-500 text-amber-500" />
                </div>
                <h2 className="text-xs font-semibold text-amber-700">
                  Kamu Adalah Sultan! 👑
                </h2>
                <h1 className="text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Paket Sultan sisa.in Aktif
                </h1>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs">
                  Masa aktif berlaku hingga{' '}
                  <span className="font-bold text-slate-800">
                    {subscriptionEndsAt
                      ? format(parseISO(subscriptionEndsAt), 'd MMMM yyyy', { locale: id })
                      : 'Permanen'}
                  </span>
                  . Ingin tambah durasi? Silakan transfer dan konfirmasi di bawah.
                </p>
              </>
            ) : status === 'EXPIRED' ? (
              <>
                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 mb-1.5 shadow-xs">
                  <Lock className="w-5 h-5 stroke-[2.2]" />
                </div>
                <h2 className="text-xs font-semibold text-rose-600">
                  Masa Free Trial Selesai ⏳
                </h2>
                <h1 className="text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Aktifkan Paket Sultan
                </h1>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs">
                  Masa percobaan gratis 30 hari kamu sudah selesai. Yuk aktifkan paket Sultan seharga Rp10.000 untuk buka kembali semua fitur!
                </p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-[#7e7ef1]/10 border border-[#a0dafd]/50 flex items-center justify-center text-[#7e7ef1] mb-1.5 shadow-xs">
                  <Crown className="w-5 h-5 fill-yellow-300 text-yellow-400" />
                </div>
                <h2 className="text-xs font-semibold text-[#7e7ef1]">
                  Keuntungan Paket Sultan
                </h2>
                <h1 className="text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Upgrade ke sisa.in Sultan
                </h1>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs">
                  Kamu sedang menikmati Free Trial ({trialDaysLeft} hari lagi). Mau lanjut tanpa jeda? Kamu bisa aktivasi kapan saja!
                </p>
              </>
            )}
          </div>

          {/* Benefit Card */}
          <div className="rounded-2xl border border-[#a0dafd]/40 bg-[#7e7ef1]/5 overflow-hidden mb-3 shadow-xs shrink-0">
            <div className="bg-gradient-to-r from-[#7e7ef1] to-[#6060e8] px-3 py-2 text-white text-xs font-bold text-center border-b border-[#a0dafd]/30">
              Langganan Sultan — Hanya Rp10.000 / bulan
            </div>
            <div className="p-3 space-y-1.5">
              <p className="text-[11px] font-bold text-slate-900">Kelebihan Sultan</p>
              <div className="flex items-start gap-2 text-[11px] text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Otomasi Tagihan Bulanan & Recurring Eksekusi Otomatis</span>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Smart Budgeting per Kategori Tanpa Batas</span>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Ekspor Pembukuan ke File Excel (.xlsx) & PDF Lengkap</span>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Akses Paling Cepat & Dukungan Prioritas WhatsApp</span>
              </div>
            </div>
          </div>

          {/* Payment QRIS & Rekening Box */}
          <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-2 mb-3 shadow-2xs shrink-0">
            <div className="flex flex-col items-center text-center">
              {/* Clickable QR Code Preview */}
              <div
                onClick={() => setIsZoomOpen(true)}
                className="relative w-36 h-36 bg-white rounded-2xl p-2 border border-slate-200/90 shadow-sm cursor-pointer group hover:border-[#7e7ef1] hover:shadow-md transition active:scale-98 flex items-center justify-center"
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
                  <Maximize2 className="w-5 h-5 stroke-[2.2]" />
                  <span className="text-[9px] font-bold">Layar Penuh</span>
                </div>

                <div className="absolute -bottom-2 bg-white border border-slate-200 rounded-full px-2 py-0.5 shadow-xs flex items-center gap-1 text-[8px] font-bold text-[#7e7ef1]">
                  <ZoomIn className="w-2.5 h-2.5" />
                  <span>Klik Perbesar</span>
                </div>
              </div>

              <p className="text-[11px] font-bold text-slate-800 mt-2.5">
                Scan QRIS di atas (Semua Bank & E-Wallet)
              </p>
              <p className="text-[10px] text-slate-400">
                Screenshot atau scan langsung nominal <span className="font-bold text-slate-700">Rp10.000</span>.
              </p>

              {/* Download QRIS button */}
              <button
                type="button"
                onClick={handleDownloadQr}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 active:scale-95 text-[11px] font-semibold text-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5 text-[#7e7ef1]" />
                <span>Unduh Gambar QRIS</span>
              </button>
            </div>
          </div>

          {/* WhatsApp Button */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition mb-1 shrink-0"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Konfirmasi ke WhatsApp</span>
          </a>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition text-center shrink-0"
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

              <button
                type="button"
                onClick={handleDownloadQr}
                className="w-full mt-3 py-2.5 rounded-xl bg-[#7e7ef1] hover:bg-[#6b6be6] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#7e7ef1]/25 active:scale-98 transition"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Gambar QRIS</span>
              </button>
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
