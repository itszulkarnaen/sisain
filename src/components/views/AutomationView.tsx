'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { RecurringRule, Category, Transaction } from '@/types';
import { formatRupiah, formatRupiahInput, parseRupiahInput } from '@/lib/utils/currency';
import { Repeat, Plus, Trash2, Power, ShieldAlert, Calendar, X, Check, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { CuteDatePickerModal } from '@/components/common/CuteDatePickerModal';
import { format, parseISO } from 'date-fns';

interface AutomationViewProps {
  recurringRules: RecurringRule[];
  categories: Category[];
  transactions?: Transaction[];
  isProOrTrial: boolean;
  onLockedFeatureClick: () => void;
  onAddRule: (data: {
    title: string;
    amount: number;
    categoryId: string;
    executionDay: number;
  }) => Promise<void>;
  onUpdateRule: (data: {
    id: string;
    title: string;
    amount: number;
    categoryId: string;
    executionDay: number;
    isActive?: boolean;
  }) => Promise<void>;
  onDeleteRule: (ruleId: string) => Promise<void>;
  onMarkAsPaid?: (rule: RecurringRule) => void;
}

export const AutomationView: React.FC<AutomationViewProps> = ({
  recurringRules,
  categories,
  transactions = [],
  isProOrTrial,
  onLockedFeatureClick,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onMarkAsPaid,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');

  // Filter out 'Gaji' as monthly salary is managed in Profile Settings
  const selectableCategories = useMemo<Category[]>(() => {
    return categories.filter((c: Category) => c.name.trim().toLowerCase() !== 'gaji');
  }, [categories]);

  const defaultCategory =
    selectableCategories.find((c: Category) => c.name.toLowerCase().includes('tagihan')) ||
    selectableCategories.find((c: Category) => c.type === 'EXPENSE') ||
    selectableCategories[0] ||
    categories[0];

  const [categoryId, setCategoryId] = useState(defaultCategory?.id || '');
  const [executionDay, setExecutionDay] = useState(1);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<RecurringRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit State
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmountStr, setEditAmountStr] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editExecutionDay, setEditExecutionDay] = useState(1);
  const [editIsActive, setEditIsActive] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'add' | 'edit'>('add');

  useEffect(() => {
    if (!categoryId && selectableCategories.length > 0) {
      const def =
        selectableCategories.find((c: Category) => c.name.toLowerCase().includes('tagihan')) ||
        selectableCategories.find((c: Category) => c.type === 'EXPENSE') ||
        selectableCategories[0];
      if (def) setCategoryId(def.id);
    }
  }, [selectableCategories, categoryId]);

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

  const handleOpenEdit = (rule: RecurringRule) => {
    setEditingRule(rule);
    setEditTitle(rule.title);
    setEditAmountStr(formatRupiahInput(rule.amount));
    setEditCategoryId(rule.category_id);
    setEditExecutionDay(rule.execution_day);
    setEditIsActive(rule.is_active);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    const amount = parseRupiahInput(editAmountStr);
    if (!editTitle.trim() || amount <= 0 || !editCategoryId) return;

    setIsUpdating(true);
    try {
      await onUpdateRule({
        id: editingRule.id,
        title: editTitle.trim(),
        amount,
        categoryId: editCategoryId,
        executionDay: editExecutionDay,
        isActive: editIsActive,
      });
      setEditingRule(null);
    } catch (err) {
      console.error('Error updating recurring rule:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteFromEdit = () => {
    if (!editingRule) return;
    const target = editingRule;
    setEditingRule(null);
    setRuleToDelete(target);
  };

  if (!isProOrTrial) {
    return (
      <div className="py-8 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Monthly Fee Automation Terkunci</h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto mb-5 leading-relaxed">
          Semua jadwal tagihan rutin di-pause karena masa trial berakhir. Aktifkan Sultan Rp10.000/bulan untuk otomatisasi eksekusi server tanpa batas.
        </p>
        <button
          onClick={onLockedFeatureClick}
          className="px-6 py-3 rounded-full bg-indigo-600 text-white font-bold text-xs shadow-md hover:bg-indigo-700 transition"
        >
          Buka Kunci Fitur Sultan (Rp10.000)
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
      {isAdding && (() => {
        const isCurrentIncome = (categoryMap.get(categoryId) || defaultCategory)?.type === 'INCOME';

        return (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-5 border border-[#a0dafd]/60 shadow-lg shadow-indigo-100/50 space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <span className={clsx('w-2 h-2 rounded-full', isCurrentIncome ? 'bg-emerald-500' : 'bg-[#7e7ef1]')} />
                {isCurrentIncome ? 'Daftarkan Pemasukan Rutin Baru' : 'Daftarkan Tagihan Baru'}
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
              {/* Nama Tagihan / Pemasukan */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                  {isCurrentIncome ? 'Nama Pemasukan Rutin' : 'Nama Tagihan'}
                </label>
                <input
                  type="text"
                  placeholder={
                    isCurrentIncome
                      ? 'Contoh: Freelance Retainer, Sewa Properti, Dividen'
                      : 'Contoh: Sewa Kosan, Wi-Fi Indihome, Spotify'
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 font-bold placeholder-slate-400 outline-hidden focus:border-[#7e7ef1] focus:ring-2 focus:ring-[#a0dafd]/40 transition"
                  required
                />
              </div>

              {/* Nominal Tagihan / Pemasukan */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                  {isCurrentIncome ? 'Nominal Pemasukan' : 'Nominal Bulanan'}
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
                  onClick={() => {
                    setPickerTarget('add');
                    setIsCategoryPickerOpen(true);
                  }}
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
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-900 block truncate">
                          {(categoryMap.get(categoryId) || defaultCategory)?.name || 'Pilih Kategori'}
                        </span>
                        <span
                          className={clsx(
                            'text-[9px] font-bold px-1.5 py-0.2 rounded-sm border',
                            isCurrentIncome
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                              : 'text-indigo-700 bg-indigo-50 border-indigo-200'
                          )}
                        >
                          {isCurrentIncome ? 'Pemasukan' : 'Pengeluaran'}
                        </span>
                      </div>
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
                  {isCurrentIncome ? 'Tanggal Pemasukan Bulanan' : 'Tanggal Eksekusi Bulanan'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setPickerTarget('add');
                    setIsDatePickerOpen(true);
                  }}
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
                        {isCurrentIncome
                          ? `Otomatis dicatat masuk tiap tgl ${executionDay} pukul 00:05 WIB`
                          : `Dipotong otomatis tiap tgl ${executionDay} pukul 00:05 WIB`}
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
                className={clsx(
                  'px-5 py-2 text-xs text-white rounded-xl font-bold shadow-md active:scale-95 transition cursor-pointer',
                  isCurrentIncome
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                    : 'bg-[#7e7ef1] hover:bg-[#6c6ce8] shadow-[#7e7ef1]/25 ring-1 ring-[#a0dafd]/40'
                )}
              >
                {isCurrentIncome ? 'Simpan Pemasukan Rutin' : 'Simpan Tagihan'}
              </button>
            </div>
          </form>
        );
      })()}

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
            const isRuleIncome = category?.type === 'INCOME';
            const currentMonthPrefix = format(new Date(), 'yyyy-MM');
            const isPaidThisMonth =
              (rule.last_executed_at && rule.last_executed_at.startsWith(currentMonthPrefix)) ||
              transactions.some(
                (t) =>
                  t.recurring_rule_id === rule.id &&
                  t.transaction_date &&
                  t.transaction_date.startsWith(currentMonthPrefix)
              );

            return (
              <div
                key={rule.id}
                className={clsx(
                  'bg-white rounded-3xl p-3.5 border shadow-xs flex items-center justify-between transition',
                  rule.is_active ? 'border-slate-100' : 'border-slate-200/60 opacity-60'
                )}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 flex items-center justify-center shrink-0">
                    <CategoryIcon icon={category?.icon || '🔁'} name={category?.name || rule.title} size={40} className="w-10 h-10 object-contain" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-slate-800 truncate">{rule.title}</h3>
                      <span
                        className={clsx(
                          'text-[9px] font-bold px-1.5 py-0.2 rounded-sm border shrink-0',
                          isRuleIncome
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-slate-600 bg-slate-100 border-slate-200'
                        )}
                      >
                        {isRuleIncome ? 'Pemasukan' : 'Tagihan'}
                      </span>
                      {!rule.is_active && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-sm border shrink-0 text-amber-700 bg-amber-50 border-amber-200">
                          Dijeda
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tiap tgl {rule.execution_day} • {isRuleIncome ? '+' : '-'}{formatRupiah(rule.amount)}
                    </p>
                    {isPaidThisMonth && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full mt-1">
                        {isRuleIncome ? '✓ Sudah cair bulan ini' : '✓ Lunas bulan ini'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!isPaidThisMonth && rule.is_active && onMarkAsPaid && (
                    <button
                      type="button"
                      onClick={() => onMarkAsPaid(rule)}
                      title={isRuleIncome ? 'Tandai sudah masuk' : 'Tandai sudah dibayar'}
                      className={clsx(
                        'px-2.5 py-1.5 rounded-xl active:scale-95 text-xs font-bold flex items-center gap-1 transition cursor-pointer border',
                        isRuleIncome
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200/70'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200/60'
                      )}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{isRuleIncome ? 'Masuk' : 'Bayar'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(rule)}
                    title="Pengaturan Tagihan"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-95 transition cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Recurring Rule Modal */}
      {editingRule && (() => {
        const isEditingIncome = (categoryMap.get(editCategoryId) || defaultCategory)?.type === 'INCOME';

        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in">
            <div className="fixed inset-0" onClick={() => !isUpdating && setEditingRule(null)} />

            <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl z-10 px-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] flex flex-col max-h-[90dvh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom duration-200">
              {/* Handle */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2 shrink-0" />

              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                      {isEditingIncome ? 'Pengaturan Pemasukan Rutin' : 'Pengaturan Tagihan Rutin'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Ubah nominal, tanggal, status, atau hapus aturan ini
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  disabled={isUpdating}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveEdit} className="space-y-3.5">
                {/* Nama Tagihan */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                    {isEditingIncome ? 'Nama Pemasukan Rutin' : 'Nama Tagihan'}
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Nama tagihan / pemasukan"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 font-bold placeholder-slate-400 outline-hidden focus:border-[#7e7ef1] focus:ring-2 focus:ring-[#a0dafd]/40 transition"
                    required
                  />
                </div>

                {/* Nominal */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                    {isEditingIncome ? 'Nominal Pemasukan Bulanan' : 'Nominal Tagihan Bulanan'}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editAmountStr}
                    onChange={(e) => setEditAmountStr(formatRupiahInput(e.target.value))}
                    placeholder="Rp 0"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 font-extrabold placeholder-slate-400 outline-hidden focus:border-[#7e7ef1] focus:ring-2 focus:ring-[#a0dafd]/40 transition"
                    required
                  />
                </div>

                {/* Kategori Pos Anggaran Button */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                    Kategori Pos Anggaran
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerTarget('edit');
                      setIsCategoryPickerOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition active:scale-[0.99] text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center shrink-0">
                        <CategoryIcon
                          icon={(categoryMap.get(editCategoryId) || defaultCategory)?.icon}
                          name={(categoryMap.get(editCategoryId) || defaultCategory)?.name}
                          size={28}
                          className="w-7 h-7 object-contain"
                        />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-slate-900 block truncate">
                            {(categoryMap.get(editCategoryId) || defaultCategory)?.name || 'Pilih Kategori'}
                          </span>
                          <span
                            className={clsx(
                              'text-[9px] font-bold px-1.5 py-0.2 rounded-sm border',
                              isEditingIncome
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                : 'text-indigo-700 bg-indigo-50 border-indigo-200'
                            )}
                          >
                            {isEditingIncome ? 'Pemasukan' : 'Pengeluaran'}
                          </span>
                        </div>
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

                {/* Tanggal Eksekusi Button */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                    {isEditingIncome ? 'Tanggal Pemasukan Bulanan' : 'Tanggal Eksekusi Bulanan'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerTarget('edit');
                      setIsDatePickerOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition active:scale-[0.99] text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#a0dafd]/25 border border-[#a0dafd]/50 flex items-center justify-center text-[#7e7ef1] shrink-0 shadow-2xs">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 block">
                          Setiap Tanggal {editExecutionDay}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {isEditingIncome
                            ? `Otomatis dicatat masuk tiap tgl ${editExecutionDay} pukul 00:05 WIB`
                            : `Dipotong otomatis tiap tgl ${editExecutionDay} pukul 00:05 WIB`}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#7e7ef1] px-2.5 py-1 rounded-lg bg-[#7e7ef1]/10 border border-[#a0dafd]/40 shrink-0 ml-2">
                      Pilih Tanggal
                    </span>
                  </button>
                </div>

                {/* Status Otomasi Toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/80">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Status Otomasi</span>
                    <span className="text-[10px] text-slate-400">
                      {editIsActive ? 'Otomasi aktif dan dieksekusi bulanan' : 'Otomasi dijeda sementara'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditIsActive(!editIsActive)}
                    className={clsx(
                      'px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer',
                      editIsActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-200 text-slate-600 border border-slate-300'
                    )}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{editIsActive ? 'Aktif' : 'Dijeda'}</span>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="w-full py-3 rounded-xl font-bold text-xs text-white bg-[#7e7ef1] hover:bg-[#6c6ce8] shadow-md shadow-[#7e7ef1]/20 active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteFromEdit}
                    disabled={isUpdating}
                    className="w-full py-2.5 rounded-xl font-bold text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Tagihan Ini</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Category Picker Modal */}
      {isCategoryPickerOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsCategoryPickerOpen(false)} />
          <div className="relative w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 leading-tight">Pilih Kategori</h3>
                <p className="text-[10px] text-slate-400 font-medium">Pilih pos pengeluaran atau pemasukan rutin</p>
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
              {selectableCategories.map((c: Category) => {
                const currentSelectedId = pickerTarget === 'edit' ? editCategoryId : categoryId;
                const isSelected = c.id === currentSelectedId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      if (pickerTarget === 'edit') {
                        setEditCategoryId(c.id);
                      } else {
                        setCategoryId(c.id);
                      }
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
          new Date(2026, 0, Math.min(Math.max(pickerTarget === 'edit' ? editExecutionDay : executionDay, 1), 31)),
          'yyyy-MM-dd'
        )}
        title="Pilih Tanggal Eksekusi"
        subtitle="Tagihan akan otomatis dicatat setiap tanggal ini"
        onSelectDate={(newDate) => {
          try {
            const parsed = parseISO(newDate);
            const day = parsed.getDate();
            if (pickerTarget === 'edit') {
              setEditExecutionDay(day);
            } else {
              setExecutionDay(day);
            }
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
              <strong className="text-slate-800 font-semibold">&quot;{ruleToDelete.title}&quot;</strong>{' '}
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

