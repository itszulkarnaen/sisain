import { db } from './dexie';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { Transaction, Budget } from '@/types';
import { LEGACY_CATEGORY_ID_MAP } from '../constants/defaults';

export type SyncStatus = 'SYNCED' | 'PENDING' | 'OFFLINE' | 'ERROR';

/**
 * Upload semua transaksi lokal yang belum tersinkronisasi ke cloud
 */
export async function syncPendingTransactions(): Promise<{ success: boolean; count: number; error?: string }> {
  if (!navigator.onLine) {
    return { success: false, count: 0, error: 'Offline' };
  }

  try {
    // Ambil transaksi lokal dengan is_synced == false
    const pendingTransactions = await db.transactions
      .filter((tx) => tx.is_synced === false)
      .toArray();

    // Jangan sync data dummy usep ke cloud
    const validPendingTransactions = pendingTransactions.filter(
      (tx) => tx.user_id && tx.user_id !== 'user-usep-default'
    );

    if (validPendingTransactions.length === 0) {
      return { success: true, count: 0 };
    }

    // Jika Supabase belum dikonfigurasi, tandai lokal saja
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase not configured, skipping cloud sync.');
      return { success: true, count: validPendingTransactions.length };
    }

    const userId = validPendingTransactions[0].user_id;

    // Pastikan user punya wallet valid di Supabase
    const { data: wallets } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    let defaultWalletId = wallets?.[0]?.id;
    if (!defaultWalletId) {
      const { data: newWallet } = await supabase
        .from('wallets')
        .insert({ user_id: userId, name: 'Dompet Utama', is_default: true })
        .select('id')
        .single();
      defaultWalletId = newWallet?.id;
    }

    // Transform payload untuk PostgreSQL
    const payload = validPendingTransactions.map((tx) => ({
      id: tx.id,
      user_id: tx.user_id,
      wallet_id: (tx.wallet_id && tx.wallet_id.length === 36 && tx.wallet_id !== 'wallet-default')
        ? tx.wallet_id
        : defaultWalletId,
      category_id: LEGACY_CATEGORY_ID_MAP[tx.category_id] || tx.category_id,
      amount: tx.amount,
      type: tx.type,
      transaction_date: tx.transaction_date ? tx.transaction_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      notes: tx.notes || null,
      is_recurring_instance: tx.is_recurring_instance || false,
      recurring_rule_id: tx.recurring_rule_id || null,
      created_at: tx.created_at,
      synced_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('transactions')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Error syncing transactions to Supabase:', error);
      return { success: false, count: 0, error: error.message };
    }

    // Update status lokal di Dexie
    const now = new Date().toISOString();
    await db.transaction('rw', db.transactions, async () => {
      for (const tx of validPendingTransactions) {
        await db.transactions.update(tx.id, {
          is_synced: true,
          synced_at: now,
        });
      }
    });

    return { success: true, count: validPendingTransactions.length };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Sync failed:', errorMsg);
    return { success: false, count: 0, error: errorMsg };
  }
}

/**
 * Upload semua alokasi budget lokal yang valid ke Supabase Cloud
 */
export async function syncBudgetsToCloud(userId: string): Promise<{ success: boolean; count: number; error?: string }> {
  if (!navigator.onLine || !isSupabaseConfigured || !supabase) {
    return { success: false, count: 0, error: 'Offline / Supabase not configured' };
  }
  if (!userId || userId === 'user-usep-default' || userId === 'guest-user') {
    return { success: false, count: 0, error: 'Unauthenticated' };
  }

  try {
    const localBudgets = await db.budgets.toArray();
    if (localBudgets.length === 0) {
      return { success: true, count: 0 };
    }

    // Deduplikasi per valid category_id
    const categoryBudgetMap = new Map<string, Budget>();
    for (const b of localBudgets) {
      const catId = LEGACY_CATEGORY_ID_MAP[b.category_id] || b.category_id;
      categoryBudgetMap.set(catId, b);
    }

    const payload = Array.from(categoryBudgetMap.values())
      .filter((b) => b.monthly_limit > 0)
      .map((b) => {
        const catId = LEGACY_CATEGORY_ID_MAP[b.category_id] || b.category_id;
        const bId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.id)
          ? b.id
          : crypto.randomUUID();

        return {
          id: bId,
          user_id: userId,
          category_id: catId,
          monthly_limit: b.monthly_limit,
          updated_at: b.updated_at || new Date().toISOString(),
        };
      });

    if (payload.length > 0) {
      const { error } = await supabase
        .from('budgets')
        .upsert(payload, { onConflict: 'user_id, category_id' });

      if (error) {
        console.error('Error syncing budgets to Supabase:', error);
        return { success: false, count: 0, error: error.message };
      }

      // Pastikan di Dexie ID-nya seragam dengan payload Supabase
      for (const p of payload) {
        const matches = localBudgets.filter(
          (b) => (LEGACY_CATEGORY_ID_MAP[b.category_id] || b.category_id) === p.category_id
        );
        for (const m of matches) {
          if (m.id !== p.id) {
            await db.budgets.delete(m.id);
          }
        }
        await db.budgets.put({
          id: p.id,
          user_id: userId,
          category_id: p.category_id,
          monthly_limit: p.monthly_limit,
          updated_at: p.updated_at,
        });
      }
    }

    return { success: true, count: payload.length };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Failed to sync budgets:', errorMsg);
    return { success: false, count: 0, error: errorMsg };
  }
}

/**
 * Hydrate data dari Supabase ke Dexie saat user baru login / ganti device
 */
export async function hydrateFromCloud(userId: string) {
  if (!navigator.onLine || !isSupabaseConfigured || !supabase) return;

  try {
    // 1. Transactions
    const { data: cloudTx, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    if (!txError && cloudTx && cloudTx.length > 0) {
      const localFormat: Transaction[] = cloudTx.map((tx) => ({
        ...tx,
        transaction_date: tx.transaction_date ? tx.transaction_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        is_synced: true,
      }));
      await db.transactions.bulkPut(localFormat);
    }

    // 2. Budgets
    const { data: cloudBudgets, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId);

    if (!budgetError && cloudBudgets && cloudBudgets.length > 0) {
      const cleanBudgets: Budget[] = cloudBudgets.map((b) => ({
        ...b,
        category_id: LEGACY_CATEGORY_ID_MAP[b.category_id] || b.category_id,
      }));
      // Bersihkan budget lokal dengan category_id yang sama sebelum bulkPut agar ID lokal lama tidak bersanding
      for (const cb of cleanBudgets) {
        await db.budgets.where('category_id').equals(cb.category_id).delete();
      }
      await db.budgets.bulkPut(cleanBudgets);
    }

    // 3. Recurring Rules
    const { data: cloudRules, error: ruleError } = await supabase
      .from('recurring_rules')
      .select('*')
      .eq('user_id', userId);

    if (!ruleError && cloudRules && cloudRules.length > 0) {
      await db.recurringRules.bulkPut(cloudRules);
    }
  } catch (err) {
    console.error('Hydration error:', err);
  }
}
