import { db } from './dexie';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { Transaction } from '@/types';

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
      category_id: tx.category_id,
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
      await db.budgets.bulkPut(cloudBudgets);
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
