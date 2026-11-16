import { db } from './dexie';
import { Category, Profile, RecurringRule } from '@/types';
import { DEFAULT_CATEGORIES } from '../constants/defaults';
import { format, subDays } from 'date-fns';

/**
 * Membersihkan kategori duplikat di IndexedDB dan memastikan
 * semua kategori default (seperti 'Tidak Terduga') ada berdasarkan NAMA (bukan ID semata).
 */
export async function deduplicateAndSyncCategories() {
  const allCategories = await db.categories.toArray();
  const allTransactions = await db.transactions.toArray();
  const allBudgets = await db.budgets.toArray();
  const allRules = await db.recurringRules.toArray();

  // Group categories by normalized name + type
  const map = new Map<string, Category[]>();
  for (const cat of allCategories) {
    const key = `${cat.type}_${cat.name.trim().toLowerCase()}`;
    const group = map.get(key) || [];
    group.push(cat);
    map.set(key, group);
  }

  const idsToDelete: string[] = [];

  for (const [, group] of map.entries()) {
    if (group.length > 1) {
      // Cari yang sudah dipakai oleh transaksi/budget
      let keeper = group[0];
      for (const item of group) {
        const isUsed =
          allTransactions.some((t) => t.category_id === item.id) ||
          allBudgets.some((b) => b.category_id === item.id) ||
          allRules.some((r) => r.category_id === item.id);
        if (isUsed) {
          keeper = item;
          break;
        }
      }

      // Remap transaksi/budget/rule yang pakai ID duplikat ke keeper.id
      for (const item of group) {
        if (item.id !== keeper.id) {
          idsToDelete.push(item.id);

          const txsToRemap = allTransactions.filter((t) => t.category_id === item.id);
          for (const tx of txsToRemap) {
            await db.transactions.update(tx.id, { category_id: keeper.id });
          }

          const budgetsToRemap = allBudgets.filter((b) => b.category_id === item.id);
          for (const b of budgetsToRemap) {
            await db.budgets.update(b.id, { category_id: keeper.id });
          }

          const rulesToRemap = allRules.filter((r) => r.category_id === item.id);
          for (const r of rulesToRemap) {
            await db.recurringRules.update(r.id, { category_id: keeper.id });
          }
        }
      }
    }
  }

  // Hapus kategori duplikat
  if (idsToDelete.length > 0) {
    await db.categories.bulkDelete(idsToDelete);
  }

  // Perbarui icon atau tambahkan kategori default yang BELUM ADA secara nama
  const refreshedCategories = await db.categories.toArray();

  for (const dc of DEFAULT_CATEGORIES) {
    const existing = refreshedCategories.find(
      (c) => c.type === dc.type && c.name.trim().toLowerCase() === dc.name.trim().toLowerCase()
    );
    if (existing) {
      if (existing.icon !== dc.icon) {
        await db.categories.update(existing.id, { icon: dc.icon });
      }
    } else {
      await db.categories.add(dc);
    }
  }
}

export async function initializeAppData() {
  // 1. Ensure Categories are deduplicated and all default categories exist
  await deduplicateAndSyncCategories();

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
      category_id: 'c0000001-0000-0000-0000-000000000005',
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
        category_id: 'c0000001-0000-0000-0000-000000000001',
        monthly_limit: 1500000,
      },
      {
        id: 'b-kopi',
        user_id: 'user-usep-default',
        category_id: 'c0000001-0000-0000-0000-000000000002',
        monthly_limit: 500000,
      },
      {
        id: 'b-transport',
        user_id: 'user-usep-default',
        category_id: 'c0000001-0000-0000-0000-000000000003',
        monthly_limit: 600000,
      },
      {
        id: 'b-hiburan',
        user_id: 'user-usep-default',
        category_id: 'c0000001-0000-0000-0000-000000000006',
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
        category_id: 'c0000001-0000-0000-0000-000000000001',
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
        category_id: 'c0000001-0000-0000-0000-000000000002',
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
        category_id: 'c0000001-0000-0000-0000-000000000001',
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
        category_id: 'c0000001-0000-0000-0000-000000000001',
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
        category_id: 'c0000001-0000-0000-0000-000000000002',
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
        category_id: 'c0000001-0000-0000-0000-000000000003',
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
        category_id: 'c0000001-0000-0000-0000-000000000006',
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

