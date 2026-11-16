export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED';
export type TransactionType = 'EXPENSE' | 'INCOME';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  monthly_salary: number;
  payday_date: number; // 1 - 31
  subscription_status: SubscriptionStatus;
  trial_ends_at: string;
  subscription_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string | null; // null if default/global category
  name: string;
  icon: string; // Unicode emoji string e.g. "🍜"
  color: string; // Hex color e.g. "#FFD8A8"
  type: TransactionType;
  created_at?: string;
  is_synced?: boolean;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  monthly_limit: number;
  created_at?: string;
  updated_at?: string;
  is_synced?: boolean;
}

export interface RecurringRule {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id: string;
  title: string;
  amount: number;
  execution_day: number; // 1 - 31
  is_active: boolean;
  last_executed_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string; // UUID v4 generated on client
  user_id: string;
  wallet_id: string;
  category_id: string;
  amount: number;
  type: TransactionType;
  transaction_date: string; // YYYY-MM-DD
  notes: string | null;
  is_recurring_instance?: boolean;
  recurring_rule_id?: string | null;
  created_at: string;
  synced_at?: string | null;
  is_synced?: boolean; // false if pending sync to cloud
}

export interface SafeToSpendSummary {
  dailySafeToSpend: number;
  remainingSalary: number; // Sisa uang gaji riil = (Gaji + Income) - Expenses
  freeCash: number; // Uang bebas = Gaji - Total komitmen ter-budget
  totalBudgeted: number; // Total budget kategori
  totalCommitted: number; // Total komitmen (budget + recurring)
  totalExpenses: number; // Total belanja riil
  daysUntilPayday: number;
  paydayFormatted: string;
  totalMonthlySalary: number;
  salaryUsedPercentage: number;
  budgetAllocatedPercentage: number;
  status: 'ON_TRACK' | 'WARNING' | 'DEFICIT';
}

