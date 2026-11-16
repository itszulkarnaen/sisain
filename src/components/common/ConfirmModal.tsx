'use client';

import React from 'react';
import { Trash2, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  loadingText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'Hapus Transaksi?',
  message = 'Transaksi ini akan dihapus secara permanen dari catatan keuangan kamu.',
  confirmText = 'Ya, Hapus',
  cancelText = 'Batal',
  loadingText,
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const resolvedLoadingText = loadingText || (variant === 'danger' ? 'Menghapus...' : 'Memproses...');

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Click outside to cancel */}
      <div className="fixed inset-0" onClick={isLoading ? undefined : onClose} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-10 text-center animate-in zoom-in-95 duration-150">
        {/* Animated Icon Container */}
        <div className="mb-3.5 flex justify-center">
          {variant === 'danger' && (
            <div className="w-14 h-14 rounded-full bg-rose-50 border-4 border-rose-100 flex items-center justify-center text-rose-500 shadow-xs">
              <Trash2 className="w-6 h-6 animate-in zoom-in-50 duration-200" />
            </div>
          )}
          {variant === 'warning' && (
            <div className="w-14 h-14 rounded-full bg-amber-50 border-4 border-amber-100 flex items-center justify-center text-amber-500 shadow-xs">
              <AlertTriangle className="w-6 h-6 animate-in zoom-in-50 duration-200" />
            </div>
          )}
          {variant === 'primary' && (
            <div className="w-14 h-14 rounded-full bg-[#a0dafd]/30 border-4 border-[#a0dafd]/50 flex items-center justify-center text-[#7e7ef1] shadow-xs">
              <HelpCircle className="w-6 h-6 animate-in zoom-in-50 duration-200" />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-extrabold text-slate-900 mb-1.5">{title}</h3>

        {/* Message */}
        <div className="text-xs text-slate-500 leading-relaxed mb-5">{message}</div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs active:scale-95 transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={clsx(
              'py-2.5 px-3 rounded-2xl font-bold text-xs text-white shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 disabled:opacity-50',
              variant === 'danger'
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25'
                : variant === 'warning'
                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
                : 'bg-[#7e7ef1] hover:bg-[#6c6ce8] shadow-[#7e7ef1]/25 ring-1 ring-[#a0dafd]/30'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{resolvedLoadingText}</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
