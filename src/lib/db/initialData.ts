import { db } from './dexie';
import { Category, Profile, RecurringRule, Budget } from '@/types';
import { DEFAULT_CATEGORIES, LEGACY_CATEGORY_ID_MAP } from '../constants/defaults';
import { format, subDays } from 'date-fns';

/**
 * Membersihkan kategori duplikat di IndexedDB dan memastikan
 * semua kategori default (seperti 'Tidak Terduga') ada berdasarkan NAMA (bukan ID semata).
 */
export async function deduplicateAndSyncCategories() {
  // 0. Auto-migrate legacy non-UUID category IDs (cat-belanja, cat-makan-minum, dll)
  for (const [oldId, newUuid] of Object.entries(LEGACY_CATEGORY_ID_MAP)) {
    const oldCat = await db.categories.get(oldId);
    if (oldCat) {
      await db.transactions.where('category_id').equals(oldId).modify({ category_id: newUuid });
      await db.budgets.where('category_id').equals(oldId).modify({ category_id: newUuid });
      await db.categories.delete(oldId);
    }
  }

  // Pastikan SEMUA transaksi / budget / rule lokal tidak ada yang tertinggal ID legacy cat-*
  const allTxs = await db.transactions.toArray();
  for (const tx of allTxs) {
    if (LEGACY_CATEGORY_ID_MAP[tx.category_id]) {
      await db.transactions.update(tx.id, { category_id: LEGACY_CATEGORY_ID_MAP[tx.category_id] });
    }
  }
  const allBgs = await db.budgets.toArray();
  for (const b of allBgs) {
    if (LEGACY_CATEGORY_ID_MAP[b.category_id]) {
      await db.budgets.update(b.id, { category_id: LEGACY_CATEGORY_ID_MAP[b.category_id] });
    }
  }
  const allRls = await db.recurringRules.toArray();
  for (const r of allRls) {
    if (LEGACY_CATEGORY_ID_MAP[r.category_id]) {
      await db.recurringRules.update(r.id, { category_id: LEGACY_CATEGORY_ID_MAP[r.category_id] });
    }
  }

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
      // Selalu prioritaskan ID resmi DEFAULT_CATEGORIES atau UUID valid sebagai keeper
      const defaultCatKeeper = group.find((item) => DEFAULT_CATEGORIES.some((dc) => dc.id === item.id));
      const uuidKeeper = group.find((item) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id));
      const keeper = defaultCatKeeper || uuidKeeper || group[0];

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
    const existingById = await db.categories.get(dc.id);
    const existingByName = refreshedCategories.find(
      (c) =>
        c.type === dc.type &&
        (c.name.trim().toLowerCase() === dc.name.trim().toLowerCase() ||
          (dc.name === 'Gaji Pokok' && c.name.trim().toLowerCase() === 'gaji') ||
          (dc.name === 'Side Hustle' && c.name.trim().toLowerCase() === 'side husle'))
    );

    if (existingByName) {
      if (existingByName.icon !== dc.icon) {
        await db.categories.update(existingByName.id, { icon: dc.icon });
      }
    } else if (existingById) {
      await db.categories.update(dc.id, {
        name: dc.name,
        icon: dc.icon,
        color: dc.color,
        type: dc.type,
      });
    } else {
      await db.categories.put(dc);
    }
  }
}

/**
 * Membersihkan budget duplikat di IndexedDB (Dexie) dan menghapus data budget ghost lama.
 */
export async function deduplicateAndSyncBudgets(userId?: string) {
  const allBudgets = await db.budgets.toArray();
  if (allBudgets.length === 0) return;

  // 1. Jika user login (bukan usep/guest), hapus sisa budget dummy usep
  if (userId && userId !== 'user-usep-default' && userId !== 'guest-user') {
    const dummyBudgets = allBudgets.filter((b) => b.user_id === 'user-usep-default');
    if (dummyBudgets.length > 0) {
      await db.budgets.bulkDelete(dummyBudgets.map((b) => b.id));
    }
  }

  // 2. Normalisasi dan kelompokkan budget per category_id
  const refreshed = await db.budgets.toArray();
  const catMap = new Map<string, Budget[]>();

  for (const b of refreshed) {
    const validCatId = LEGACY_CATEGORY_ID_MAP[b.category_id] || b.category_id;
    const group = catMap.get(validCatId) || [];
    group.push(b);
    catMap.set(validCatId, group);
  }

  for (const [catId, group] of catMap.entries()) {
    if (group.length > 1) {
      // Urutkan prioritas keeper:
      // 1. UUID valid (dari Supabase / edit baru) dibanding ID statis 'b-makan'
      // 2. updated_at atau created_at yang paling baru
      // 3. monthly_limit valid
      group.sort((a, b) => {
        const aIsUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a.id);
        const bIsUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.id);
        if (aIsUuid && !bIsUuid) return -1;
        if (!aIsUuid && bIsUuid) return 1;

        const aTime = a.updated_at
          ? new Date(a.updated_at).getTime()
          : a.created_at
          ? new Date(a.created_at).getTime()
          : 0;
        const bTime = b.updated_at
          ? new Date(b.updated_at).getTime()
          : b.created_at
          ? new Date(b.created_at).getTime()
          : 0;
        if (bTime !== aTime) return bTime - aTime;

        return (b.monthly_limit || 0) - (a.monthly_limit || 0);
      });

      const keeper = group[0];
      const duplicatesToDelete = group.slice(1).map((b) => b.id);
      await db.budgets.bulkDelete(duplicatesToDelete);

      if (keeper.category_id !== catId) {
        await db.budgets.update(keeper.id, { category_id: catId });
      }
    } else if (group.length === 1 && group[0].category_id !== catId) {
      await db.budgets.update(group[0].id, { category_id: catId });
    }
  }
}

export async function initializeAppData() {
  // 1. Ensure Categories are deduplicated and all default categories exist
  await deduplicateAndSyncCategories();

  // 1b. Ensure Budgets are deduplicated
  await deduplicateAndSyncBudgets();

  // 2. Seed Default Profile if empty
  const profileCount = await db.profiles.count();
  if (profileCount === 0) {
    const defaultProfile: Profile = {
      id: 'user-usep-default',
      email: 'usep@kantor.com',
      full_name: 'Usep',
      avatar_url: '/pics/boy.png',
      monthly_salary: 8000000, // Rp 8.000.000
      payday_date: 25, // Tanggal 25
      subscription_status: 'TRIAL',
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      subscription_ends_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await db.profiles.put(defaultProfile);
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
    await db.recurringRules.put(kosanRule);
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

