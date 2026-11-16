import { SafeToSpendSummary, Transaction, RecurringRule, Budget } from '@/types';
import { LEGACY_CATEGORY_ID_MAP } from '@/lib/constants/defaults';
import {
  differenceInCalendarDays,
  setDate,
  addMonths,
  subMonths,
  isAfter,
  isBefore,
  startOfDay,
  format,
  lastDayOfMonth,
} from 'date-fns';
import { id } from 'date-fns/locale';

export interface PaydayCycleInfo {
  cycleStartDate: Date;
  cycleEndDate: Date;
  nextPaydayDate: Date;
  daysRemaining: number;
}

/**
 * Menghitung tanggal gajian yang valid untuk suatu bulan tertentu.
 * Jika paydayDate = 31 (akhir bulan), otomatis mengambil hari terakhir bulan tersebut (28/29 Feb, 30 Apr, 31 Jan, dst).
 * Jika tanggal yang dipilih melebihi jumlah hari di bulan tersebut, di-clamp ke hari terakhir bulan tersebut.
 */
export function getPaydayInMonth(baseDate: Date, paydayDate: number): Date {
  const lastDay = lastDayOfMonth(baseDate).getDate();
  const day = paydayDate >= 31 || paydayDate <= 0 ? lastDay : Math.min(paydayDate, lastDay);
  return startOfDay(setDate(baseDate, day));
}

/**
 * Menghitung rentang siklus gajian berjalan dan sisa hari menuju gajian berikutnya.
 */
export function getPaydayCycle(paydayDate: number, referenceDate: Date = new Date()): PaydayCycleInfo {
  const today = startOfDay(referenceDate);
  const thisMonthPayday = getPaydayInMonth(today, paydayDate);

  let cycleStartDate: Date;
  let nextPaydayDate: Date;

  if (today.getTime() >= thisMonthPayday.getTime()) {
    // Sudah masuk siklus baru bulan ini (hari ini >= tanggal gajian bulan ini)
    cycleStartDate = thisMonthPayday;
    nextPaydayDate = getPaydayInMonth(addMonths(today, 1), paydayDate);
  } else {
    // Masih di siklus yang berakar dari bulan lalu
    cycleStartDate = getPaydayInMonth(subMonths(today, 1), paydayDate);
    nextPaydayDate = thisMonthPayday;
  }

  // Hari terakhir siklus adalah H-1 gajian berikutnya
  const cycleEndDate = startOfDay(new Date(nextPaydayDate.getTime() - 24 * 60 * 60 * 1000));

  // Sisa hari menuju tanggal gajian berikutnya (minimal 1 hari)
  const diffDays = differenceInCalendarDays(nextPaydayDate, today);
  const daysRemaining = Math.max(1, diffDays);

  return {
    cycleStartDate,
    cycleEndDate,
    nextPaydayDate,
    daysRemaining,
  };
}

/**
 * Menghitung metrik Safe-to-Spend, Uang Bebas (Unallocated), dan Sisa Saldo Gaji Riil
 */
export function calculateSafeToSpend({
  monthlySalary,
  paydayDate,
  transactions,
  recurringRules = [],
  budgets = [],
  referenceDate = new Date(),
}: {
  monthlySalary: number;
  paydayDate: number;
  transactions: Transaction[];
  recurringRules?: RecurringRule[];
  budgets?: Budget[];
  referenceDate?: Date;
}): SafeToSpendSummary {
  const cycle = getPaydayCycle(paydayDate, referenceDate);

  // 1. Total alokasi budget kategori (Deduplikasi by category_id agar tidak dobel hitung jika ada duplikat data lokal)
  let totalBudgeted = 0;
  const budgetedCategoryIds = new Set<string>();
  const categoryBudgetMap = new Map<string, number>();

  for (const b of budgets) {
    if (b.category_id) {
      const validCatId = LEGACY_CATEGORY_ID_MAP[b.category_id] || b.category_id;
      categoryBudgetMap.set(validCatId, b.monthly_limit || 0);
    }
  }

  for (const [catId, limit] of categoryBudgetMap.entries()) {
    if (limit > 0) {
      totalBudgeted += limit;
      budgetedCategoryIds.add(catId);
    }
  }

  // 2. Filter transaksi dalam siklus berjalan
  let totalExpenses = 0;
  let additionalIncome = 0;
  let unbudgetedExpenses = 0; // Kategori seperti 'Tidak Terduga' yang memotong uang di luar budget

  for (const tx of transactions) {
    const txDate = startOfDay(new Date(tx.transaction_date));
    if (!isBefore(txDate, cycle.cycleStartDate) && !isAfter(txDate, cycle.cycleEndDate)) {
      if (tx.type === 'EXPENSE') {
        totalExpenses += tx.amount;
        // Transaksi di kategori yang TIDAK dibudgetkan (seperti "Tidak Terduga") memotong uang di luar budget!
        const validTxCatId = LEGACY_CATEGORY_ID_MAP[tx.category_id] || tx.category_id;
        if (!budgetedCategoryIds.has(validTxCatId)) {
          unbudgetedExpenses += tx.amount;
        }
      } else if (tx.type === 'INCOME') {
        additionalIncome += tx.amount;
      }
    }
  }

  // Sisa gaji periode berjalan riil di rekening
  const remainingSalary = (monthlySalary + additionalIncome) - totalExpenses;

  // 3. Tagihan rutin aktif
  let unbudgetedRecurring = 0;
  let pendingRecurringAmount = 0;

  for (const rule of recurringRules) {
    if (!rule.is_active) continue;

    const validRuleCatId = LEGACY_CATEGORY_ID_MAP[rule.category_id] || rule.category_id;
    // Untuk komitmen total di luar kategori yang sudah dibudgetkan
    if (!budgetedCategoryIds.has(validRuleCatId)) {
      unbudgetedRecurring += rule.amount;
    }

    // Cek apakah sudah pernah dieksekusi dalam siklus ini
    if (rule.last_executed_at) {
      const lastExec = startOfDay(new Date(rule.last_executed_at));
      if (!isBefore(lastExec, cycle.cycleStartDate)) {
        continue;
      }
    }

    pendingRecurringAmount += rule.amount;
  }

  const totalCommitted = totalBudgeted + unbudgetedRecurring;
  const effectiveBaseIncome = monthlySalary + additionalIncome;

  // Uang di Luar Budget (Gaji + Pemasukan Tambahan - Total Ter-budget - Belanja Tidak Terduga / Unbudgeted)
  const freeCash = effectiveBaseIncome > 0
    ? Math.max(0, effectiveBaseIncome - totalCommitted - unbudgetedExpenses)
    : 0;

  // Formula Safe-to-Spend Harian (sub-metrik)
  const unallocatedSalary = remainingSalary - pendingRecurringAmount;
  const rawSafeToSpend = effectiveBaseIncome > 0
    ? Math.round(unallocatedSalary / cycle.daysRemaining)
    : 0;

  // Status visual
  let status: 'ON_TRACK' | 'WARNING' | 'DEFICIT' = 'ON_TRACK';
  if (effectiveBaseIncome > 0) {
    if (remainingSalary <= 0 || freeCash <= 0) {
      status = 'DEFICIT';
    } else if (remainingSalary < (effectiveBaseIncome * 0.2) || totalCommitted > effectiveBaseIncome) {
      status = 'WARNING';
    }
  }

  // Persentase gaji terpakai belanja riil
  const salaryUsedPercentage = effectiveBaseIncome > 0 
    ? Math.min(100, Math.max(0, Math.round((totalExpenses / effectiveBaseIncome) * 100)))
    : 0;

  // Persentase gaji yang sudah dialokasikan ke budget
  const budgetAllocatedPercentage = effectiveBaseIncome > 0
    ? Math.min(100, Math.max(0, Math.round((totalCommitted / effectiveBaseIncome) * 100)))
    : 0;

  const paydayFormatted = format(cycle.nextPaydayDate, 'd MMM', { locale: id });

  return {
    dailySafeToSpend: rawSafeToSpend,
    remainingSalary: (monthlySalary > 0 || additionalIncome > 0) ? remainingSalary : 0,
    freeCash,
    totalBudgeted,
    totalCommitted,
    totalExpenses,
    daysUntilPayday: cycle.daysRemaining,
    paydayFormatted,
    totalMonthlySalary: monthlySalary,
    salaryUsedPercentage,
    budgetAllocatedPercentage,
    status,
  };
}
