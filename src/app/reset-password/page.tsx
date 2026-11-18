'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!supabase) return;

    // Supabase will automatically pick up recovery hash or PKCE exchange
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      // Session exchange handled automatically by Supabase client
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (newPassword.length < 6) {
      setErrorMessage('Password baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok.');
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage('Layanan Supabase belum terkonfigurasi.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccessMessage('Password kamu berhasil diperbarui! Mengalihkan ke aplikasi...');
      setTimeout(() => {
        router.replace('/');
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex justify-center py-0 sm:py-6 selection:bg-indigo-100">
      <div className="w-full max-w-md bg-[#FAFBFD] min-h-screen sm:min-h-[844px] sm:rounded-3xl sm:shadow-2xl sm:border sm:border-slate-200/80 flex flex-col justify-between p-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#7e7ef1]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -left-20 w-44 h-44 bg-[#a0dafd]/25 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 pt-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-[#7e7ef1]/20 mb-4 border border-[#a0dafd]/40 bg-white">
            <Image
              src="/sisain.png"
              alt="sisa.in logo"
              width={64}
              height={64}
              priority
              className="w-full h-full object-cover"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7e7ef1]/10 border border-[#a0dafd]/40 text-[11px] font-bold text-[#5555dc] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#7e7ef1]" />
            <span>Reset Password Akun</span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Atur Password Baru
          </h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Buat password baru yang kuat untuk melindungi akun sisa.in kamu.
          </p>
        </div>

        {/* Form Card */}
        <div className="relative z-10 my-4 bg-white rounded-3xl p-5 border border-slate-100 shadow-xl shadow-slate-200/50">
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

          <form onSubmit={handleResetPassword} className="space-y-3.5">
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

            <button
              type="submit"
              disabled={loading || Boolean(successMessage)}
              className="w-full py-3 rounded-xl bg-[#7e7ef1] hover:bg-[#6c6ce8] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#7e7ef1]/25 active:scale-98 transition disabled:opacity-60 cursor-pointer"
            >
              <span>{loading ? 'Menyimpan...' : 'Simpan Password Baru'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => router.replace('/login')}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 transition cursor-pointer"
            >
              Kembali ke Halaman Masuk
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-center pb-2">
          <p className="text-[10px] text-slate-400">
            &copy; 2026 sisa.in &bull; Dibuat untuk pekerja 9-to-5 mengelola keuangan dengan bijak.
          </p>
        </div>
      </div>
    </main>
  );
}
