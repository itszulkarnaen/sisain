'use client';

import React, { useState, useEffect } from 'react';
import { format, isSameMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X, Calendar } from 'lucide-react';
import { clsx } from 'clsx';

interface CuteMonthPickerModalProps {
  isOpen: boolean;
  selectedMonth: Date;
  title?: string;
  subtitle?: string;
  onSelectMonth: (date: Date) => void;
  onClose: () => void;
}

export const CuteMonthPickerModal: React.FC<CuteMonthPickerModalProps> = ({
  isOpen,
  selectedMonth,
  title = 'Pilih Bulan',
  subtitle = 'Pilih periode laporan keuangan',
  onSelectMonth,
  onClose,
}) => {
  const [currentYear, setCurrentYear] = useState(() => selectedMonth.getFullYear());

  useEffect(() => {
    if (isOpen) {
      setCurrentYear(selectedMonth.getFullYear());
    }
  }, [isOpen, selectedMonth]);

  if (!isOpen) return null;

  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const now = new Date();

  const handlePickMonth = (monthIndex: number) => {
    const newDate = new Date(currentYear, monthIndex, 1);
    onSelectMonth(newDate);
    onClose();
  };

  const handleSelectCurrentMonth = () => {
    onSelectMonth(new Date());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#a0dafd]/30 border border-[#a0dafd]/60 flex items-center justify-center text-[#7e7ef1]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 leading-tight">{title}</h3>
              <p className="text-[10px] text-slate-400 font-medium">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Year Navigator */}
        <div className="flex items-center justify-between mb-3 px-1">
          <button
            type="button"
            onClick={() => setCurrentYear((y) => y - 1)}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-[#a0dafd]/30 text-slate-700 flex items-center justify-center transition active:scale-95"
            title="Tahun sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-extrabold text-slate-900">{currentYear}</span>
          <button
            type="button"
            onClick={() => setCurrentYear((y) => y + 1)}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-[#a0dafd]/30 text-slate-700 flex items-center justify-center transition active:scale-95"
            title="Tahun berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 12 Months Grid */}
        <div className="grid grid-cols-3 gap-2">
          {months.map((mName, idx) => {
            const dateForMonth = new Date(currentYear, idx, 1);
            const isSelected = isSameMonth(dateForMonth, selectedMonth);
            const isThisMonth = isSameMonth(dateForMonth, now);

            return (
              <button
                key={mName}
                type="button"
                onClick={() => handlePickMonth(idx)}
                className={clsx(
                  'py-2.5 px-1 text-xs font-bold rounded-xl transition active:scale-95 flex flex-col items-center justify-center relative',
                  isSelected
                    ? 'bg-[#7e7ef1] text-white shadow-xs ring-2 ring-[#a0dafd] scale-102 z-10'
                    : isThisMonth
                    ? 'bg-[#a0dafd]/25 text-[#7e7ef1] border border-[#a0dafd]/60 font-extrabold hover:bg-[#a0dafd]/40'
                    : 'text-slate-700 hover:bg-[#a0dafd]/20 hover:text-slate-900 bg-slate-50'
                )}
              >
                <span>{mName}</span>
                {isThisMonth && !isSelected && (
                  <span className="w-1 h-1 rounded-full bg-[#7e7ef1] absolute bottom-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Jump to current month button */}
        {!isSameMonth(selectedMonth, now) && (
          <div className="mt-3 pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSelectCurrentMonth}
              className="w-full py-2 px-3 text-xs font-bold text-[#7e7ef1] bg-[#7e7ef1]/10 hover:bg-[#7e7ef1]/15 rounded-xl transition text-center"
            >
              Pilih Bulan Ini ({format(now, 'MMMM yyyy', { locale: id })})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
