import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50 text-slate-800 text-center">
      <div className="w-16 h-16 rounded-full bg-[#7e7ef1]/10 border border-[#a0dafd]/40 flex items-center justify-center text-2xl mb-4">
        🔍
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">404 - Halaman Tidak Ditemukan</h2>
      <p className="text-xs text-slate-500 mb-6 max-w-xs">
        Halaman yang lu tuju gak ada atau mungkin udah dipindahin bro.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-2xl bg-[#7e7ef1] hover:bg-[#6c6ce8] text-white text-xs font-bold shadow-md shadow-[#7e7ef1]/25 ring-1 ring-[#a0dafd]/40 active:scale-95 transition"
      >
        Balik ke Beranda
      </Link>
    </div>
  );
}
