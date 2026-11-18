'use client';

import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Lock, Eye, EyeOff, X, KeyRound, CheckCircle, AlertCircle, Save } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  userEmail,
}: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleResetForm = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (newPassword.length < 6) {
      setErrorMessage('Password minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok.');
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage('Koneksi autentikasi belum siap.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccessMessage('Password akun kamu berhasil diubah!');
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="w-12 h-12 rounded-2xl bg-[#7e7ef1]/10 text-[#7e7ef1] flex items-center justify-center mb-4">
          <KeyRound className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
          Ganti Password Akun
        </h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed mb-4">
          {userEmail
            ? `Atur password baru untuk akun ${userEmail}`
            : 'Perbarui password akun kamu untuk login berikutnya.'}
        </p>

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2 text-xs text-emerald-700">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
        )}

        {!successMessage && (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Password Baru
              </label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 focus-within:border-indigo-500 bg-white">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-transparent outline-hidden text-xs font-medium text-slate-900"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="text-slate-400 hover:text-slate-600 transition p-0.5 shrink-0 cursor-pointer focus:outline-hidden"
                  tabIndex={-1}
                  aria-label={showNewPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Konfirmasi Password Baru
              </label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 focus-within:border-indigo-500 bg-white">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-transparent outline-hidden text-xs font-medium text-slate-900"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-slate-400 hover:text-slate-600 transition p-0.5 shrink-0 cursor-pointer focus:outline-hidden"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-[#7e7ef1] hover:bg-[#6c6ce8] text-white text-xs font-bold shadow-md shadow-[#7e7ef1]/25 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{loading ? 'Menyimpan...' : 'Simpan'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
