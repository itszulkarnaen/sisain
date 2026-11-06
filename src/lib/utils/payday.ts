import { SafeToSpendSummary, Transaction, RecurringRule } from '@/types';
import { differenceInCalendarDays, setDate, addMonths, subMonths, isAfter, isBefore, startOfDay, format } from 'date-fns';
import { id } from 'date-fns/locale';

export interface PaydayCycleInfo {
  cycleStartDate: Date;
  cycleEndDate: Date;
  nextPaydayDate: Date;
  daysRemaining: number;
}

/**
 * Menghitung rentang siklus gajian berjalan dan sisa hari menuju gajian berikutnya.
 * Misal: paydayDate = 25
 * Jika hari ini 7 Nov: siklus 25 Okt - 24 Nov, gajian berikutnya 25 Nov (18 hari lagi)
 * Jika hari ini 25 Nov: siklus baru dimulai 25 Nov - 24 Des, gajian berikutnya 25 Des
 */
export function getPaydayCycle(paydayDate: number, referenceDate: Date = new Date()): PaydayCycleInfo {
  const today = startOfDay(referenceDate);
  const currentDay = today.getDate();

  let cycleStartDate: Date;
  let nextPaydayDate: Date;

  if (currentDay >= paydayDate) {
    // Sudah masuk siklus baru bulan ini
    cycleStartDate = setDate(today, paydayDate);
    // Gajian berikutnya adalah bulan depan tanggal paydayDate
    nextPaydayDate = setDate(addMonths(today, 1), paydayDate);
  } else {
    // Masih di siklus yang berakar dari bulan lalu
    cycleStartDate = setDate(subMonths(today, 1), paydayDate);
    // Gajian berikutnya adalah bulan ini tanggal paydayDate
    nextPaydayDate = setDate(today, paydayDate);
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
 * Menghitung metrik Safe-to-Spend Harian & Sisa Saldo Gaji
 */
export function calculateSafeToSpend({
  monthlySalary,
  paydayDate,
  transactions,
  recurringRules = [],
  referenceDate = new Date(),
}: {
  monthlySalary: number;
  paydayDate: number;
  transactions: Transaction[];
  recurringRules?: RecurringRule[];
  referenceDate?: Date;
}): SafeToSpendSummary {
  const cycle = getPaydayCycle(paydayDate, referenceDate);

  // Filter transaksi dalam siklus berjalan
  let totalExpenses = 0;
  let additionalIncome = 0;

  for (const tx of transactions) {
    const txDate = startOfDay(new Date(tx.transaction_date));
    if (!isBefore(txDate, cycle.cycleStartDate) && !isAfter(txDate, cycle.cycleEndDate)) {
      if (tx.type === 'EXPENSE') {
        totalExpenses += tx.amount;
      } else if (tx.type === 'INCOME') {
        additionalIncome += tx.amount;
      }
    }
  }

  // Sisa gaji periode berjalan
  const remainingSalary = (monthlySalary + additionalIncome) - totalExpenses;

  // Hitung total tagihan rutin aktif yang BELUM terpotong di siklus ini
  let pendingRecurringAmount = 0;
  for (const rule of recurringRules) {
    if (!rule.is_active) continue;

    // Cek apakah sudah pernah dieksekusi dalam siklus ini
    if (rule.last_executed_at) {
      const lastExec = startOfDay(new Date(rule.last_executed_at));
      if (!isBefore(lastExec, cycle.cycleStartDate)) {
        // Sudah dieksekusi di siklus ini
        continue;
      }
    }

    pendingRecurringAmount += rule.amount;
  }

  // Formula Safe-to-Spend Harian
  const unallocatedSalary = remainingSalary - pendingRecurringAmount;
  const rawSafeToSpend = Math.round(unallocatedSalary / cycle.daysRemaining);

  // Status visual
  let status: 'ON_TRACK' | 'WARNING' | 'DEFICIT' = 'ON_TRACK';
  if (unallocatedSalary <= 0 || rawSafeToSpend <= 0) {
    status = 'DEFICIT';
  } else if (rawSafeToSpend < (monthlySalary / 30) * 0.5) {
    status = 'WARNING';
  }

  // Persentase gaji terpakai
  const salaryUsedPercentage = monthlySalary > 0 
    ? Math.min(100, Math.max(0, Math.round((totalExpenses / monthlySalary) * 100)))
    : 0;

  const paydayFormatted = format(cycle.nextPaydayDate, 'd MMM', { locale: id });

  return {
    dailySafeToSpend: rawSafeToSpend,
    remainingSalary,
    daysUntilPayday: cycle.daysRemaining,
    paydayFormatted,
    totalMonthlySalary: monthlySalary,
    salaryUsedPercentage,
    status,
  };
}
