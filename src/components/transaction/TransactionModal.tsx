'use client';

import React, { useState, useEffect } from 'react';
import { X, Pencil, Calendar, Check, Trash2 } from 'lucide-react';
import { Category, Transaction, TransactionType } from '@/types';
import { formatNumberOnly, formatRupiah } from '@/lib/utils/currency';
import { clsx } from 'clsx';
import { format, isToday, isSameDay, subDays, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { CuteDatePickerModal } from '@/components/common/CuteDatePickerModal';
import { ConfirmModal } from '@/components/common/ConfirmModal';

interface TransactionModalProps {
  isOpen: boolean;
  categories: Category[];
  editingTransaction?: Transaction | null;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    amount: number;
    type: TransactionType;
    categoryId: string;
    notes: string;
    transactionDate: string;
  }) => Promise<void>;
  onDelete?: (transactionId: string) => Promise<void>;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  categories,
  editingTransaction,
  onClose,
  onSave,
  onDelete,
}) => {
  const [amountStr, setAmountStr] = useState('0');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsConfirmDeleteOpen(false);
      if (editingTransaction) {
        setAmountStr(String(editingTransaction.amount));
        setType(editingTransaction.type);
        setSelectedCategoryId(editingTransaction.category_id);
        setNotes(editingTransaction.notes || '');
        setTransactionDate(editingTransaction.transaction_date);
      } else {
        setAmountStr('0');
        setType('EXPENSE');
        setNotes('');
        setTransactionDate(format(new Date(), 'yyyy-MM-dd'));
        const defaultCat = categories.find((c) => c.type === 'EXPENSE') || categories[0];
        if (defaultCat) setSelectedCategoryId(defaultCat.id);
      }
    }
  }, [isOpen, editingTransaction, categories]);

  if (!isOpen) return null;

  const numericAmount = parseInt(amountStr, 10) || 0;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) return;
    if (!selectedCategoryId) return;

    setIsSaving(true);
    try {
      await onSave({
        id: editingTransaction?.id,
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

  const handleConfirmDelete = async () => {
    if (!editingTransaction || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(editingTransaction.id);
      setIsConfirmDeleteOpen(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  let displayDateText = '';
  try {
    const parsed = parseISO(transactionDate);
    if (isToday(parsed)) {
      displayDateText = 'Hari Ini';
    } else if (isSameDay(parsed, subDays(new Date(), 1))) {
      displayDateText = 'Kemarin';
    } else {
      displayDateText = format(parsed, 'd MMM', { locale: id });
    }
  } catch {
    displayDateText = transactionDate;
  }

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
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
            </h2>
            {editingTransaction && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#7e7ef1]/10 text-[#7e7ef1] border border-[#a0dafd]/40">
                Mode Edit
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {editingTransaction && onDelete && (
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                disabled={isDeleting || isSaving}
                className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-600 transition"
                title="Hapus Transaksi"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Big Amount Display with Native Device Keyboard */}
        <div className="flex items-center justify-center py-2.5 px-4 rounded-2xl bg-[#a0dafd]/15 border border-[#a0dafd]/30 my-1 focus-within:border-[#7e7ef1] focus-within:ring-2 focus-within:ring-[#7e7ef1]/20 transition-all">
          <span className="text-2xl font-black text-[#7e7ef1] mr-1.5 select-none">Rp</span>
          <input
            type="text"
            inputMode="numeric"
            value={numericAmount > 0 ? formatNumberOnly(numericAmount) : ''}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '');
              const cleanDigits = digits.replace(/^0+/, '') || '0';
              if (cleanDigits.length <= 11) {
                setAmountStr(cleanDigits);
              }
            }}
            placeholder="0"
            className="w-full text-center text-3xl font-extrabold text-slate-900 tracking-tight bg-transparent outline-hidden selection:bg-[#7e7ef1]/30 placeholder:text-slate-400"
            autoFocus
          />
        </div>

        {/* Type Toggle: [ Pengeluaran ] [ Pemasukan ] */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex p-1 rounded-full bg-slate-100 border border-slate-200/60">
            <button
              type="button"
              onClick={() => {
                setType('EXPENSE');
                const defaultCat = categories.find((c) => c.type === 'EXPENSE');
                if (defaultCat) setSelectedCategoryId(defaultCat.id);
              }}
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
              onClick={() => {
                setType('INCOME');
                const defaultCat = categories.find((c) => c.type === 'INCOME');
                if (defaultCat) setSelectedCategoryId(defaultCat.id);
              }}
              className={clsx(
                'px-4 py-1.5 rounded-full text-xs font-bold transition-all',
                type === 'INCOME'
                  ? 'bg-[#a0dafd] text-slate-900 shadow-xs'
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
          <button
            type="button"
            onClick={() => setIsDatePickerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#a0dafd]/15 hover:bg-[#a0dafd]/25 border border-[#a0dafd]/50 text-xs text-slate-800 font-semibold cursor-pointer active:scale-95 transition shrink-0 shadow-2xs"
            title="Pilih tanggal transaksi"
          >
            <Calendar className="w-3.5 h-3.5 text-[#7e7ef1]" />
            <span>{displayDateText}</span>
          </button>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-3 gap-2 mb-3.5">
          {filteredCategories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={clsx(
                  'flex flex-col items-center justify-center py-2 px-1.5 rounded-2xl border transition-all active:scale-95',
                  isSelected
                    ? 'border-[#7e7ef1] bg-[#7e7ef1]/10 ring-2 ring-[#a0dafd]/60 shadow-xs'
                    : 'border-slate-100 bg-white hover:bg-slate-50'
                )}
              >
                <div className="w-10 h-10 flex items-center justify-center shrink-0 mb-1">
                  <CategoryIcon icon={cat.icon} name={cat.name} size={40} className="w-10 h-10 object-contain" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 truncate w-full text-center">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Buttons: Delete & Submit */}
        <div className="flex gap-2">
          {editingTransaction && onDelete && (
            <button
              type="button"
              disabled={isDeleting || isSaving}
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="py-3.5 px-4 rounded-2xl font-bold text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus</span>
            </button>
          )}
          <button
            type="button"
            disabled={numericAmount <= 0 || isSaving || isDeleting}
            onClick={handleFormSubmit}
            className={clsx(
              'flex-1 py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98',
              numericAmount > 0
                ? 'bg-gradient-to-r from-[#7e7ef1] to-[#6060e8] hover:from-[#6c6ce8] hover:to-[#5050dc] shadow-[#7e7ef1]/25 ring-1 ring-[#a0dafd]/30'
                : 'bg-slate-300 cursor-not-allowed shadow-none'
            )}
          >
            <span>
              {isSaving
                ? 'Menyimpan...'
                : editingTransaction
                ? 'Simpan Perubahan'
                : 'Simpan Transaksi'}
            </span>
            <Check className="w-4 h-4" />
          </button>
        </div>

        {/* Cute Date Picker Modal */}
        <CuteDatePickerModal
          isOpen={isDatePickerOpen}
          selectedDate={transactionDate}
          onSelectDate={(newDate) => setTransactionDate(newDate)}
          onClose={() => setIsDatePickerOpen(false)}
        />

        {/* Custom Confirmation Alert Modal */}
        <ConfirmModal
          isOpen={isConfirmDeleteOpen}
          title="Hapus Transaksi?"
          message={
            <span>
              Yakin ingin menghapus transaksi{' '}
              <strong className="text-slate-800 font-semibold">
                {editingTransaction?.notes ? `"${editingTransaction.notes}"` : (categories.find(c => c.id === editingTransaction?.category_id)?.name || 'ini')}
              </strong>
              {editingTransaction ? (
                <> sebesar <strong className="text-rose-600 font-semibold">{formatRupiah(editingTransaction.amount)}</strong>?</>
              ) : (
                ' ini?'
              )}
              <br />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Catatan ini akan dihapus secara permanen dari riwayat keuangan kamu.
              </span>
            </span>
          }
          confirmText="Ya, Hapus"
          cancelText="Batal"
          variant="danger"
          isLoading={isDeleting}
          onConfirm={handleConfirmDelete}
          onClose={() => setIsConfirmDeleteOpen(false)}
        />
      </div>
    </div>
  );
};
