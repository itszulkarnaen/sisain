'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Lock, Mail, ArrowRight, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check if already logged in or guest
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isGuest = localStorage.getItem('ninetopay_guest');
      if (isGuest === 'true') {
        router.replace('/');
        return;
      }
    }

    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace('/');
        }
      });
    }
  }, [router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    if (!isSupabaseConfigured || !supabase) {
      // Supabase credentials fallback
      setErrorMessage('Supabase belum terkonfigurasi. Silakan masuk via Mode Tamu.');
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || 'Usep',
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          // Direct login
          localStorage.removeItem('ninetopay_guest');
          router.replace('/');
        } else {
          setSuccessMessage('Pendaftaran berhasil! Cek email lu untuk verifikasi link aktivasi.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        localStorage.removeItem('ninetopay_guest');
        router.replace('/');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage('Supabase belum terkonfigurasi.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ninetopay_guest', 'true');
    }
    router.replace('/');
  };

  return (
    <main className="min-h-screen bg-slate-100 flex justify-center py-0 sm:py-6 selection:bg-indigo-100">
      <div className="w-full max-w-md bg-[#FAFBFD] min-h-screen sm:min-h-[844px] sm:rounded-3xl sm:shadow-2xl sm:border sm:border-slate-200/80 flex flex-col justify-between p-6 relative overflow-hidden">
        
        {/* Background Gradients */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -left-20 w-44 h-44 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header & Branding */}
        <div className="relative z-10 pt-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 mb-4">
            <span className="text-2xl font-black tracking-tight">9</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[11px] font-bold text-indigo-700 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Smart Daily Expense Tracker</span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            NineToPay
          </h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Atur gaji hasil 9-to-5 lu biar aman sampai tanggal gajian berikutnya tanpa defisit.
          </p>
        </div>

        {/* Middle Auth Card */}
        <div className="relative z-10 my-4 bg-white rounded-3xl p-5 border border-slate-100 shadow-xl shadow-slate-200/50">
          
          {/* Switch Tab */}
          <div className="flex p-1 bg-slate-100 rounded-2xl mb-4">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={clsx(
                'flex-1 py-2 text-xs font-bold rounded-xl transition-all',
                !isRegister ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={clsx(
                'flex-1 py-2 text-xs font-bold rounded-xl transition-all',
                isRegister ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              Daftar Baru
            </button>
          </div>

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

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {isRegister && (
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Nama Panggilan</label>
                <input
                  type="text"
                  placeholder="Usep"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden text-xs font-medium"
                  required
                />
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Email</label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 focus-within:border-indigo-500 bg-white">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="email"
                  placeholder="usep@kantor.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-hidden text-xs font-medium text-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Password</label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 focus-within:border-indigo-500 bg-white">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-hidden text-xs font-medium text-slate-900"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-98 transition disabled:opacity-60"
            >
              <span>{loading ? 'Memproses...' : isRegister ? 'Buat Akun Gratis' : 'Masuk ke NineToPay'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <span className="relative bg-white px-3 text-[10px] uppercase font-bold text-slate-400">
              atau
            </span>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-2.5 text-xs font-bold text-slate-700 shadow-2xs active:scale-98 transition"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Lanjutkan dengan Google</span>
          </button>
        </div>

        {/* Footer: Guest Mode */}
        <div className="relative z-10 text-center pb-2">
          <button
            type="button"
            onClick={handleGuestLogin}
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition underline underline-offset-4"
          >
            Coba Mode Offline / Tamu (Tanpa Akun)
          </button>
          <p className="text-[10px] text-slate-400 mt-2">
            Data tersimpan lokal di browser via IndexedDB dan siap disinkronkan kapan saja.
          </p>
        </div>

      </div>
    </main>
  );
}
