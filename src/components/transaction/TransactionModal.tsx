'use client';

import React, { useState, useEffect } from 'react';
import { X, Pencil, Calendar, Check } from 'lucide-react';
import { Numpad } from './Numpad';
import { Category, TransactionType } from '@/types';
import { formatNumberOnly } from '@/lib/utils/currency';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface TransactionModalProps {
  isOpen: boolean;
  categories: Category[];
  onClose: () => void;
  onSave: (data: {
    amount: number;
    type: TransactionType;
    categoryId: string;
    notes: string;
    transactionDate: string;
  }) => Promise<void>;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  categories,
  onClose,
  onSave,
}) => {
  const [amountStr, setAmountStr] = useState('0');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [isSaving, setIsSaving] = useState(false);

  // Set default category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      const defaultCat = categories.find((c) => c.type === type) || categories[0];
      if (defaultCat) setSelectedCategoryId(defaultCat.id);
    }
  }, [categories, type, selectedCategoryId]);

  if (!isOpen) return null;

  const handleDigitPress = (digit: string) => {
    if (amountStr === '0') {
      if (digit === '000' || digit === '0') return;
      setAmountStr(digit);
    } else {
      if (amountStr.length >= 10) return; // Limit length
      setAmountStr((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    if (amountStr.length <= 1) {
      setAmountStr('0');
    } else {
      setAmountStr((prev) => prev.slice(0, -1));
    }
  };

  const numericAmount = parseInt(amountStr, 10) || 0;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) return;
    if (!selectedCategoryId) return;

    setIsSaving(true);
    try {
      await onSave({
        amount: numericAmount,
        type,
        categoryId: selectedCategoryId,
        notes: notes.trim(),
        transactionDate,
      });
      // Reset
      setAmountStr('0');
      setNotes('');
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);
  const displayDateText = format(new Date(transactionDate), 'd MMM', { locale: id });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Drawer Content */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl z-10 px-5 pt-3 pb-6 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3" />

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-slate-900">Tambah Transaksi</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Big Amount Display */}
        <div className="flex items-center justify-center py-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Rp{formatNumberOnly(numericAmount)}
          </span>
          <span className="w-0.5 h-8 bg-[#7e7ef1] ml-1 animate-pulse" />
        </div>

        {/* Type Toggle: [ Pengeluaran ] [ Pemasukan ] */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex p-1 rounded-full bg-slate-100 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={clsx(
                'px-4 py-1.5 rounded-full text-xs font-bold transition-all',
                type === 'EXPENSE'
                  ? 'bg-[#7e7ef1] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              [ Pengeluaran ]
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={clsx(
                'px-4 py-1.5 rounded-full text-xs font-bold transition-all',
                type === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              [ Pemasukan ]
            </button>
          </div>
        </div>

        {/* Chips: Notes input & Date picker */}
        <div className="flex items-center gap-2 mb-4">
          {/* Notes Pill */}
          <div className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <Pencil className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Catatan (misal: Makan siang ayam geprek)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-transparent text-slate-800 placeholder-slate-400 outline-hidden w-full text-xs"
            />
          </div>

          {/* Date Picker Pill */}
          <div className="relative">
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium cursor-pointer hover:bg-slate-100 transition shrink-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Hari ini ({displayDateText})</span>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
              />
            </label>
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-4 max-h-48 overflow-y-auto pr-0.5">
          {filteredCategories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={clsx(
                  'flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border transition-all active:scale-95',
                  isSelected
                    ? 'border-[#7e7ef1] bg-[#7e7ef1]/10 ring-2 ring-[#a0dafd]/60 shadow-xs'
                    : 'border-slate-100 bg-white hover:bg-slate-50'
                )}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-xs mb-1"
                  style={{ backgroundColor: cat.color || '#F1F5F9' }}
                >
                  <span>{cat.icon}</span>
                </div>
                <span className="text-[11px] font-bold text-slate-800 truncate w-full text-center">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Numpad */}
        <div className="mb-4">
          <Numpad onDigitPress={handleDigitPress} onBackspace={handleBackspace} />
        </div>

        {/* Submit Button */}
        <button
          type="button"
          disabled={numericAmount <= 0 || isSaving}
          onClick={handleFormSubmit}
          className={clsx(
            'w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98',
            numericAmount > 0
              ? 'bg-gradient-to-r from-[#7e7ef1] to-[#6060e8] hover:from-[#6c6ce8] hover:to-[#5050dc] shadow-[#7e7ef1]/25 ring-1 ring-[#a0dafd]/30'
              : 'bg-slate-300 cursor-not-allowed shadow-none'
          )}
        >
          <span>{isSaving ? 'Menyimpan...' : 'Simpan Transaksi'}</span>
          <Check className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
