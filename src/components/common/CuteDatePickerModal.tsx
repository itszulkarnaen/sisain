'use client';

import React, { useState, useEffect } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X, Calendar } from 'lucide-react';
import { clsx } from 'clsx';

interface CuteDatePickerModalProps {
  isOpen: boolean;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  onClose: () => void;
}

export const CuteDatePickerModal: React.FC<CuteDatePickerModalProps> = ({
  isOpen,
  selectedDate,
  onSelectDate,
  onClose,
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    try {
      return selectedDate ? parseISO(selectedDate) : new Date();
    } catch {
      return new Date();
    }
  });

  useEffect(() => {
    if (isOpen) {
      try {
        const parsed = selectedDate ? parseISO(selectedDate) : new Date();
        setCurrentMonth(parsed);
      } catch {
        setCurrentMonth(new Date());
      }
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  let activeDate: Date;
  try {
    activeDate = selectedDate ? parseISO(selectedDate) : new Date();
  } catch {
    activeDate = new Date();
  }

  // Month interval days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Senin start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  const handlePickDate = (d: Date) => {
    onSelectDate(format(d, 'yyyy-MM-dd'));
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
              <h3 className="text-xs font-extrabold text-slate-900 leading-tight">Pilih Tanggal</h3>
              <p className="text-[10px] text-slate-400 font-medium">Klik tanggal transaksi</p>
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

        {/* Month Navigator */}
        <div className="flex items-center justify-between mb-3 px-1">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-[#a0dafd]/30 text-slate-700 flex items-center justify-center transition active:scale-95"
            title="Bulan sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-extrabold text-slate-900 capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: id })}
          </span>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-[#a0dafd]/30 text-slate-700 flex items-center justify-center transition active:scale-95"
            title="Bulan berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day Header Row */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {weekDayLabels.map((lbl, idx) => (
            <span
              key={lbl}
              className={clsx(
                'text-[10px] font-bold py-1',
                idx >= 5 ? 'text-rose-400' : 'text-slate-400'
              )}
            >
              {lbl}
            </span>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {calendarDays.map((d) => {
            const isSelected = isSameDay(d, activeDate);
            const isCurrentM = isSameMonth(d, currentMonth);
            const isTod = isToday(d);

            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => handlePickDate(d)}
                className={clsx(
                  'h-8 rounded-xl text-xs font-bold transition-all relative flex flex-col items-center justify-center active:scale-90',
                  isSelected
                    ? 'bg-[#7e7ef1] text-white shadow-xs ring-2 ring-[#a0dafd] scale-105 z-10'
                    : isTod
                    ? 'bg-[#a0dafd]/25 text-[#7e7ef1] border border-[#a0dafd]/60 font-extrabold hover:bg-[#a0dafd]/40'
                    : isCurrentM
                    ? 'text-slate-800 hover:bg-[#a0dafd]/20 hover:text-slate-900'
                    : 'text-slate-300 hover:bg-slate-50'
                )}
              >
                <span>{format(d, 'd')}</span>
                {isTod && !isSelected && (
                  <span className="w-1 h-1 rounded-full bg-[#7e7ef1] absolute bottom-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
