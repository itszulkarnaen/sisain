'use client';

import React from 'react';
import { Home, Wallet, Plus, Repeat, BarChart3 } from 'lucide-react';
import { clsx } from 'clsx';

export type NavTab = 'home' | 'budget' | 'automation' | 'reports';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenAddModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
}) => {
  return (
    <div className="fixed bottom-[calc(0.25rem+env(safe-area-inset-bottom,8px))] left-0 right-0 max-w-md mx-auto px-4 pointer-events-none z-40">
      <div className="relative bg-white/95 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 flex items-center justify-between px-3 py-2 pointer-events-auto">
        {/* Home */}
        <button
          onClick={() => onTabChange('home')}
          className={clsx(
            'flex flex-col items-center justify-center flex-1 py-1 transition-colors',
            activeTab === 'home' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
          )}
        >
          <Home className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-0.5">Home</span>
        </button>

        {/* Budget */}
        <button
          onClick={() => onTabChange('budget')}
          className={clsx(
            'flex flex-col items-center justify-center flex-1 py-1 transition-colors',
            activeTab === 'budget' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
          )}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-0.5">Budget</span>
        </button>

        {/* Center Floating Action Button (Add) */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={onOpenAddModal}
            aria-label="Tambah Transaksi"
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#7e7ef1] to-[#6464e0] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(126,126,241,0.4)] hover:shadow-[0_8px_25px_rgba(126,126,241,0.55)] ring-4 ring-[#a0dafd]/40 active:scale-95 transition-all"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Otomasi */}
        <button
          onClick={() => onTabChange('automation')}
          className={clsx(
            'flex flex-col items-center justify-center flex-1 py-1 transition-colors',
            activeTab === 'automation' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
          )}
        >
          <Repeat className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-0.5">Otomasi</span>
        </button>

        {/* Laporan */}
        <button
          onClick={() => onTabChange('reports')}
          className={clsx(
            'flex flex-col items-center justify-center flex-1 py-1 transition-colors',
            activeTab === 'reports' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
          )}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-0.5">Laporan</span>
        </button>
      </div>
    </div>
  );
};

