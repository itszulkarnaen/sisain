'use client';

import React, { useState } from 'react';
import { RecurringRule, Category } from '@/types';
import { formatRupiah, formatRupiahInput, parseRupiahInput } from '@/lib/utils/currency';
import { Repeat, Plus, Trash2, Power, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';
import { CategoryIcon } from '@/components/common/CategoryIcon';

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
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [executionDay, setExecutionDay] = useState(1);

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
          className="bg-white rounded-2xl p-4 border border-[#a0dafd]/50 shadow-sm space-y-3 animate-in fade-in"
        >
          <h3 className="text-xs font-bold text-slate-800">Daftarkan Tagihan Baru</h3>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Nama Tagihan (misal: Kosan, Wi-Fi, Spotify)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:border-indigo-500"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Nominal (misal: Rp 1.500.000)"
                value={amountStr}
                onChange={(e) => setAmountStr(formatRupiahInput(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:border-indigo-500 font-bold"
                required
              />
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon.startsWith('/') ? '' : `${c.icon} `}{c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Tanggal Eksekusi Tiap Bulan:</span>
              <select
                value={executionDay}
                onChange={(e) => setExecutionDay(parseInt(e.target.value, 10))}
                className="px-2 py-1 border rounded-lg bg-white font-bold"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Tgl {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-slate-500 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs bg-[#7e7ef1] text-white rounded-xl font-bold shadow-xs hover:bg-[#6c6ce8] ring-1 ring-[#a0dafd]/30 active:scale-95 transition"
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
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-xs shrink-0"
                    style={{ backgroundColor: category?.color || '#F1F5F9' }}
                  >
                    <CategoryIcon icon={category?.icon || '🔁'} name={category?.name || rule.title} size={22} />
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
                    onClick={() => onDeleteRule(rule.id)}
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
    </div>
  );
};

