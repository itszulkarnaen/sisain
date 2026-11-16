'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  Share,
  SquarePlus,
  Sparkles,
  Smartphone,
  Download,
  CheckCircle2,
  MoreVertical,
  Compass,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: BeforeInstallPromptEvent | null;
  onInstallSuccess?: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallSuccess,
}) => {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('ios');
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>('ios');
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || navigator.vendor || '';
    const isIos =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);

    if (isIos) {
      setPlatform('ios');
      setActiveTab('ios');
    } else if (isAndroid) {
      setPlatform('android');
      setActiveTab('android');
    } else {
      setPlatform('other');
      setActiveTab('android');
    }
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        if (onInstallSuccess) onInstallSuccess();
        onClose();
      }
    } catch (err) {
      console.warn('PWA install error:', err);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleClose = () => {
    try {
      localStorage.setItem('sisain_pwa_prompt_dismissed', 'true');
    } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="fixed inset-0" onClick={handleClose} />

      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl z-10 px-5 pt-3 pb-6 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Handle bar */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Preview */}
        <div className="flex items-center gap-3.5 mb-4 pr-6">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-slate-200/80 shadow-md shrink-0 bg-white">
            <Image
              src="/icon-192.png"
              alt="sisa.in Icon"
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Pasang sisa.in
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7e7ef1]/10 text-[#5a5ae0]">
                PWA Web App
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">
              Bisa dipasang langsung ke layar HP tanpa download dari Play Store / App Store!
            </p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <Smartphone className="w-4 h-4 text-[#7e7ef1] mx-auto mb-1" />
            <p className="text-[10px] font-bold text-slate-800">Layar Penuh</p>
            <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">Tanpa address bar</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <Sparkles className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-[10px] font-bold text-slate-800">Ringan & Cepat</p>
            <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">Hemat memori HP</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
            <p className="text-[10px] font-bold text-slate-800">Offline Ready</p>
            <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">Data tetap aman</p>
          </div>
        </div>

        {/* OS Platform Switcher Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'ios'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>🍎</span>
            <span>iPhone (Safari)</span>
            {platform === 'ios' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#7e7ef1]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'android'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>🤖</span>
            <span>Android (Chrome)</span>
            {platform === 'android' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#7e7ef1]" />
            )}
          </button>
        </div>

        {/* Tab Content: iOS Safari */}
        {activeTab === 'ios' && (
          <div className="space-y-2.5 mb-4">
            <div className="p-3 rounded-2xl bg-[#7e7ef1]/5 border border-[#a0dafd]/30 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#7e7ef1] text-white flex items-center justify-center text-xs font-black shrink-0">
                  1
                </div>
                <div className="text-xs text-slate-700">
                  <p className="font-bold text-slate-900">Buka via Browser Safari</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pastikan dibuka di <span className="font-semibold text-slate-800">Safari</span> (bukan browser bawaan IG/TikTok/WA).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#7e7ef1] text-white flex items-center justify-center text-xs font-black shrink-0">
                  2
                </div>
                <div className="text-xs text-slate-700">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Ketuk Tombol Bagikan</span>
                    <span className="inline-flex p-1 rounded-md bg-white border border-slate-200 text-[#7e7ef1]">
                      <Share className="w-3.5 h-3.5" />
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ikon kotak berpanah ke atas di bilah menu bawah Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#7e7ef1] text-white flex items-center justify-center text-xs font-black shrink-0">
                  3
                </div>
                <div className="text-xs text-slate-700">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Pilih &quot;Tambah ke Layar Utama&quot;</span>
                    <span className="inline-flex p-1 rounded-md bg-white border border-slate-200 text-[#7e7ef1]">
                      <SquarePlus className="w-3.5 h-3.5" />
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Gulir sedikit ke bawah di menu opsi, lalu ketuk opsi tersebut.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#7e7ef1] text-white flex items-center justify-center text-xs font-black shrink-0">
                  4
                </div>
                <div className="text-xs text-slate-700">
                  <p className="font-bold text-slate-900">Ketuk &quot;Tambah&quot; di Pojok Kanan Atas</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Selesai! Ikon <span className="font-bold text-slate-800">sisa.in</span> langsung muncul di layar utama iPhone kamu.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Android */}
        {activeTab === 'android' && (
          <div className="space-y-3 mb-4">
            {deferredPrompt ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-[#a0dafd]/15 to-white border border-emerald-500/30 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-xs">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">Perangkat Kamu Mendukung 1-Klik Install!</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ketuk tombol di bawah untuk memasang sisa.in langsung ke perangkatmu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isInstalling ? 'Memasang...' : 'Pasang Aplikasi Sekarang'}</span>
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-[#7e7ef1]/5 border border-[#a0dafd]/30 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#7e7ef1] text-white flex items-center justify-center text-xs font-black shrink-0">
                    1
                  </div>
                  <div className="text-xs text-slate-700">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Buka di Google Chrome</span>
                      <Compass className="w-3.5 h-3.5 text-[#7e7ef1]" />
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Gunakan Google Chrome atau browser modern Android lainnya.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#7e7ef1] text-white flex items-center justify-center text-xs font-black shrink-0">
                    2
                  </div>
                  <div className="text-xs text-slate-700">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Ketuk Ikon Titik Tiga</span>
                      <span className="inline-flex p-1 rounded-md bg-white border border-slate-200 text-[#7e7ef1]">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Terletak di pojok kanan atas browser Google Chrome.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#7e7ef1] text-white flex items-center justify-center text-xs font-black shrink-0">
                    3
                  </div>
                  <div className="text-xs text-slate-700">
                    <p className="font-bold text-slate-900">
                      Pilih &quot;Install aplikasi&quot; / &quot;Tambahkan ke Layar Utama&quot;
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Konfirmasi instalasi, dan aplikasi akan terpasang di HP kamu!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleClose}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-98"
        >
          Saya Mengerti
        </button>
      </div>
    </div>
  );
};
