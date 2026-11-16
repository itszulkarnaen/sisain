'use client';

import React from 'react';
import Image from 'next/image';
import { Cloud, WifiOff, RefreshCw } from 'lucide-react';
import { SyncStatus } from '@/lib/db/sync';

interface TopHeaderProps {
  userName?: string;
  avatarUrl?: string;
  dateText?: string;
  syncStatus?: SyncStatus;
  onAvatarClick?: () => void;
  onSyncClick?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  userName = 'Pengguna',
  avatarUrl,
  dateText,
  syncStatus = 'SYNCED',
  onAvatarClick,
  onSyncClick,
}) => {
  // Generate current date if not provided (e.g. "Jumat, 7 Nov")
  const displayDate = dateText || new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  return (
    <header className="flex items-center justify-between px-4 pt-4 pb-3">
      {/* User Info */}
      <div
        className="flex items-center gap-3 cursor-pointer hover:opacity-90 active:scale-98 transition group select-none"
        onClick={onAvatarClick}
      >
        <div className="relative w-11 h-11 rounded-full overflow-hidden bg-gradient-to-tr from-[#7e7ef1]/20 to-[#a0dafd]/30 border border-[#7e7ef1]/30 shadow-sm flex items-center justify-center text-lg select-none group-hover:border-[#7e7ef1] transition">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={userName}
              width={44}
              height={44}
              unoptimized
              className="w-full h-full object-cover"
            />
          ) : (
            <span>🧑‍💼</span>
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">{displayDate}</p>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Halo, {userName}</h1>
        </div>
      </div>

      {/* Cloud Sync Status Pill */}
      <button
        onClick={onSyncClick}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-xs hover:bg-slate-50 transition active:scale-95 text-xs font-medium text-slate-700"
      >
        {syncStatus === 'SYNCED' && (
          <>
            <Cloud className="w-4 h-4 text-indigo-500" />
            <span>Cloud Synced</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </>
        )}
        {syncStatus === 'PENDING' && (
          <>
            <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
            <span>Pending Sync</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </>
        )}
        {syncStatus === 'OFFLINE' && (
          <>
            <WifiOff className="w-4 h-4 text-slate-400" />
            <span>Offline</span>
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          </>
        )}
        {syncStatus === 'ERROR' && (
          <>
            <Cloud className="w-4 h-4 text-rose-500" />
            <span>Sync Error</span>
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          </>
        )}
      </button>
    </header>
  );
};

