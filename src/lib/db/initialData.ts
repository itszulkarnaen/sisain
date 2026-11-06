import { db } from './dexie';
import { Profile, RecurringRule } from '@/types';
import { DEFAULT_CATEGORIES } from '../constants/defaults';
import { format, subDays } from 'date-fns';

export async function initializeAppData() {
  // 1. Seed Categories if empty
  const catCount = await db.categories.count();
  if (catCount === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  }

  // 2. Seed Default Profile if empty
  const profileCount = await db.profiles.count();
  if (profileCount === 0) {
    const defaultProfile: Profile = {
      id: 'user-usep-default',
      email: 'usep@kantor.com',
      full_name: 'Usep',
      avatar_url: null,
      monthly_salary: 8000000, // Rp 8.000.000
      payday_date: 25, // Tanggal 25
      subscription_status: 'TRIAL',
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      subscription_ends_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await db.profiles.add(defaultProfile);
  }

  // 3. Seed Default Recurring Rule (Kosan) if empty
  const ruleCount = await db.recurringRules.count();
  if (ruleCount === 0) {
    const kosanRule: RecurringRule = {
      id: 'rule-kosan',
      user_id: 'user-usep-default',
      wallet_id: 'wallet-default',
      category_id: 'cat-kosan-tagihan',
      title: 'Tagihan Kosan',
      amount: 1500000,
      execution_day: 12,
      is_active: true,
      last_executed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await db.recurringRules.add(kosanRule);
  }

  // 4. Seed sample budgets & transactions if empty (matching the screenshot)
  const budgetCount = await db.budgets.count();
  if (budgetCount === 0) {
    await db.budgets.bulkAdd([
      {
        id: 'b-makan',
        user_id: 'user-usep-default',
        category_id: 'cat-makan-minum',
        monthly_limit: 1500000,
      },
      {
        id: 'b-kopi',
        user_id: 'user-usep-default',
        category_id: 'cat-nongkrong-kopi',
        monthly_limit: 500000,
      },
      {
        id: 'b-transport',
        user_id: 'user-usep-default',
        category_id: 'cat-transport',
        monthly_limit: 600000,
      },
      {
        id: 'b-hiburan',
        user_id: 'user-usep-default',
        category_id: 'cat-hiburan',
        monthly_limit: 300000,
      },
    ]);
  }

  // Seed sample transactions if completely empty
  const txCount = await db.transactions.count();
  if (txCount === 0) {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    await db.transactions.bulkAdd([
      {
        id: 'tx-1',
        user_id: 'user-usep-default',
        wallet_id: 'wallet-default',
        category_id: 'cat-makan-minum',
        amount: 35000,
        type: 'EXPENSE',
        transaction_date: todayStr,
        notes: 'Makan siang ayam geprek',
        created_at: new Date().toISOString(),
        is_synced: true,
      },
      {
        id: 'tx-2',
        user_id: 'user-usep-default',
        wallet_id: 'wallet-default',
        category_id: 'cat-nongkrong-kopi',
        amount: 28000,
        type: 'EXPENSE',
        transaction_date: todayStr,
        notes: 'Kopi susu gula aren',
        created_at: new Date().toISOString(),
        is_synced: true,
      },
      {
        id: 'tx-3',
        user_id: 'user-usep-default',
        wallet_id: 'wallet-default',
        category_id: 'cat-makan-minum',
        amount: 49000,
        type: 'EXPENSE',
        transaction_date: todayStr,
        notes: 'Makan malam kwetiau',
        created_at: new Date().toISOString(),
        is_synced: true,
      },
      {
        id: 'tx-4',
        user_id: 'user-usep-default',
        wallet_id: 'wallet-default',
        category_id: 'cat-makan-minum',
        amount: 891000,
        type: 'EXPENSE',
        transaction_date: yesterdayStr,
        notes: 'Akumulasi belanja makan',
        created_at: new Date().toISOString(),
        is_synced: true,
      },
      {
        id: 'tx-5',
        user_id: 'user-usep-default',
        wallet_id: 'wallet-default',
        category_id: 'cat-nongkrong-kopi',
        amount: 412000,
        type: 'EXPENSE',
        transaction_date: yesterdayStr,
        notes: 'Akumulasi nongkrong',
        created_at: new Date().toISOString(),
        is_synced: true,
      },
      {
        id: 'tx-6',
        user_id: 'user-usep-default',
        wallet_id: 'wallet-default',
        category_id: 'cat-transport',
        amount: 210000,
        type: 'EXPENSE',
        transaction_date: yesterdayStr,
        notes: 'Bensin & KRL',
        created_at: new Date().toISOString(),
        is_synced: true,
      },
      {
        id: 'tx-7',
        user_id: 'user-usep-default',
        wallet_id: 'wallet-default',
        category_id: 'cat-hiburan',
        amount: 285000,
        type: 'EXPENSE',
        transaction_date: yesterdayStr,
        notes: 'Nonton bioskop & Netflix',
        created_at: new Date().toISOString(),
        is_synced: true,
      },
    ]);
  }
}

