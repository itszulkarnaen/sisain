'use client';

import React, { useState, useEffect } from 'react';
import { RecurringRule, Category } from '@/types';
import { formatRupiah, formatRupiahInput, parseRupiahInput } from '@/lib/utils/currency';
import { Repeat, Plus, Trash2, Power, ShieldAlert, Calendar, ChevronDown, X } from 'lucide-react';
import { clsx } from 'clsx';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { CuteDatePickerModal } from '@/components/common/CuteDatePickerModal';
import { format, parseISO } from 'date-fns';

interface AutomationViewProps {
  recurringRules: RecurringRule[];
  categories: Category[];
  isProOrTrial: boolean;
  onLockedFeatureClick: () => void;
  onToggleRule: (ruleId: string, currentActive: boolean) => Promise<void>;
  onAddRule: (data: {
    title: string;
    amount: number;
    categoryId: string;
    executionDay: number;
  }) => Promise<void>;
  onDeleteRule: (ruleId: string) => Promise<void>;
}

export const AutomationView: React.FC<AutomationViewProps> = ({
  recurringRules,
  categories,
  isProOrTrial,
  onLockedFeatureClick,
  onToggleRule,
  onAddRule,
  onDeleteRule,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const defaultCategory =
    categories.find((c) => c.name.toLowerCase().includes('tagihan')) ||
    categories.find((c) => c.type === 'EXPENSE') ||
    categories[0];
  const [categoryId, setCategoryId] = useState(defaultCategory?.id || '');
  const [executionDay, setExecutionDay] = useState(1);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<RecurringRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      const def =
        categories.find((c) => c.name.toLowerCase().includes('tagihan')) ||
        categories.find((c) => c.type === 'EXPENSE') ||
        categories[0];
      if (def) setCategoryId(def.id);
    }
  }, [categories, categoryId]);

  const handleConfirmDelete = async () => {
    if (!ruleToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteRule(ruleToDelete.id);
      setRuleToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isProOrTrial) {
    return (
      <div className="py-8 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Monthly Fee Automation Terkunci</h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto mb-5 leading-relaxed">
          Semua jadwal tagihan rutin di-pause karena masa trial berakhir. Aktifkan Pro Rp10.000/bulan untuk otomatisasi eksekusi server tanpa batas.
        </p>
        <button
          onClick={onLockedFeatureClick}
          className="px-6 py-3 rounded-full bg-indigo-600 text-white font-bold text-xs shadow-md hover:bg-indigo-700 transition"
        >
          Buka Kunci Fitur Pro (Rp10.000)
        </button>
      </div>
    );
  }

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseRupiahInput(amountStr);
    if (!title || amount <= 0 || !categoryId) return;

    await onAddRule({
      title,
      amount,
      categoryId,
      executionDay,
    });

    setTitle('');
    setAmountStr('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Tagihan Rutin Bulanan</h2>
          <p className="text-xs text-slate-500">
            Dipotong otomatis server tiap tanggal pilihan pukul 00:05 WIB.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#7e7ef1] text-white text-xs font-bold hover:bg-[#6c6ce8] ring-1 ring-[#a0dafd]/50 shadow-xs active:scale-95 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah</span>
        </button>
      </div>

      {/* Form Tambah Rule Baru */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-5 border border-[#a0dafd]/60 shadow-lg shadow-indigo-100/50 space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#7e7ef1]" />
              Daftarkan Tagihan Baru
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Nama Tagihan */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                Nama Tagihan
              </label>
              <input
                type="text"
                placeholder="Contoh: Sewa Kosan, Wi-Fi Indihome, Spotify"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 font-bold placeholder-slate-400 outline-hidden focus:border-[#7e7ef1] focus:ring-2 focus:ring-[#a0dafd]/40 transition"
                required
              />
            </div>

            {/* Nominal Tagihan */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                Nominal Bulanan
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Contoh: Rp 1.500.000"
                value={amountStr}
                onChange={(e) => setAmountStr(formatRupiahInput(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 font-extrabold placeholder-slate-400 outline-hidden focus:border-[#7e7ef1] focus:ring-2 focus:ring-[#a0dafd]/40 transition"
                required
              />
            </div>

            {/* Kategori Pos Anggaran Picker Button */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                Kategori Pos Anggaran
              </label>
              <button
                type="button"
                onClick={() => setIsCategoryPickerOpen(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition active:scale-[0.99] text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center shrink-0">
                    <CategoryIcon
                      icon={(categoryMap.get(categoryId) || defaultCategory)?.icon}
                      name={(categoryMap.get(categoryId) || defaultCategory)?.name}
                      size={28}
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-extrabold text-slate-900 block truncate">
                      {(categoryMap.get(categoryId) || defaultCategory)?.name || 'Pilih Kategori'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Ketuk untuk mengganti pos
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#7e7ef1] px-2.5 py-1 rounded-lg bg-[#7e7ef1]/10 border border-[#a0dafd]/40 shrink-0 ml-2">
                  Ganti
                </span>
              </button>
            </div>

            {/* Tanggal Eksekusi Date Picker Button */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                Tanggal Eksekusi Bulanan
              </label>
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition active:scale-[0.99] text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#a0dafd]/25 border border-[#a0dafd]/50 flex items-center justify-center text-[#7e7ef1] shrink-0 shadow-2xs">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">
                      Setiap Tanggal {executionDay}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Dipotong otomatis tiap tgl {executionDay} pukul 00:05 WIB
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#7e7ef1] px-2.5 py-1 rounded-lg bg-[#7e7ef1]/10 border border-[#a0dafd]/40 shrink-0 ml-2">
                  Pilih Tanggal
                </span>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs text-slate-500 font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs bg-[#7e7ef1] text-white rounded-xl font-bold shadow-md shadow-[#7e7ef1]/25 hover:bg-[#6c6ce8] ring-1 ring-[#a0dafd]/40 active:scale-95 transition cursor-pointer"
            >
              Simpan Otomasi
            </button>
          </div>
        </form>
      )}

      {/* List Tagihan */}
      {recurringRules.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center border border-slate-100 shadow-xs">
          <Repeat className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">Belum ada tagihan rutin.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Tambahkan tagihan bulanan seperti sewa kosan atau langganan internet.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {recurringRules.map((rule) => {
            const category = categoryMap.get(rule.category_id);

            return (
              <div
                key={rule.id}
                className={clsx(
                  'bg-white rounded-2xl p-3.5 border shadow-xs flex items-center justify-between transition',
                  rule.is_active ? 'border-slate-100' : 'border-slate-200/60 opacity-60'
                )}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 flex items-center justify-center shrink-0">
                    <CategoryIcon icon={category?.icon || '🔁'} name={category?.name || rule.title} size={40} className="w-10 h-10 object-contain" />
                  </div>
                  <div className="truncate">
                    <h3 className="text-xs font-bold text-slate-800 truncate">{rule.title}</h3>
                    <p className="text-[11px] text-slate-400">
                      Tiap tgl {rule.execution_day} • {formatRupiah(rule.amount)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onToggleRule(rule.id, rule.is_active)}
                    title={rule.is_active ? 'Jeda Otomasi' : 'Aktifkan'}
                    className={clsx(
                      'p-2 rounded-xl text-xs font-bold transition',
                      rule.is_active
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                    )}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setRuleToDelete(rule)}
                    title="Hapus"
                    className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Picker Modal */}
      {isCategoryPickerOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsCategoryPickerOpen(false)} />
          <div className="relative w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 leading-tight">Pilih Kategori Tagihan</h3>
                <p className="text-[10px] text-slate-400 font-medium">Pilih pos anggaran untuk pengeluaran ini</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryPickerOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto py-1">
              {categories.map((c) => {
                const isSelected = c.id === categoryId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCategoryId(c.id);
                      setIsCategoryPickerOpen(false);
                    }}
                    className={clsx(
                      'flex flex-col items-center justify-center py-2.5 px-1.5 rounded-2xl border transition-all active:scale-95 cursor-pointer',
                      isSelected
                        ? 'border-[#7e7ef1] bg-[#7e7ef1]/10 ring-2 ring-[#a0dafd]/60 shadow-xs'
                        : 'border-slate-100 bg-white hover:bg-slate-50'
                    )}
                  >
                    <div className="w-9 h-9 flex items-center justify-center shrink-0 mb-1">
                      <CategoryIcon icon={c.icon} name={c.name} size={36} className="w-9 h-9 object-contain" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 truncate w-full text-center">
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Date Picker Modal for Execution Day */}
      <CuteDatePickerModal
        isOpen={isDatePickerOpen}
        selectedDate={format(
          new Date(2026, 0, Math.min(Math.max(executionDay, 1), 31)),
          'yyyy-MM-dd'
        )}
        title="Pilih Tanggal Eksekusi"
        subtitle="Tagihan akan otomatis dicatat setiap tanggal ini"
        onSelectDate={(newDate) => {
          try {
            const parsed = parseISO(newDate);
            const day = parsed.getDate();
            setExecutionDay(day);
          } catch {
            // fallback
          }
          setIsDatePickerOpen(false);
        }}
        onClose={() => setIsDatePickerOpen(false)}
      />

      {/* Confirmation Modal for Rule Deletion */}
      <ConfirmModal
        isOpen={Boolean(ruleToDelete)}
        title="Hapus Tagihan Rutin?"
        message={
          ruleToDelete ? (
            <span>
              Yakin ingin menghapus tagihan rutin{' '}
              <strong className="text-slate-800 font-semibold">"{ruleToDelete.title}"</strong>{' '}
              sebesar <strong className="text-rose-600 font-semibold">{formatRupiah(ruleToDelete.amount)}</strong>?
              <br />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Transaksi otomatis bulanan untuk tagihan ini akan dihentikan.
              </span>
            </span>
          ) : ''
        }
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setRuleToDelete(null)}
      />
    </div>
  );
};

