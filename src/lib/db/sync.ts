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

    if (pendingTransactions.length === 0) {
      return { success: true, count: 0 };
    }

    // Jika Supabase belum dikonfigurasi, tandai lokal saja
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase not configured, skipping cloud sync.');
      return { success: true, count: pendingTransactions.length };
    }

    // Transform payload untuk PostgreSQL
    const payload = pendingTransactions.map((tx) => ({
      id: tx.id,
      user_id: tx.user_id,
      wallet_id: tx.wallet_id,
      category_id: tx.category_id,
      amount: tx.amount,
      type: tx.type,
      transaction_date: tx.transaction_date,
      notes: tx.notes,
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
      for (const tx of pendingTransactions) {
        await db.transactions.update(tx.id, {
          is_synced: true,
          synced_at: now,
        });
      }
    });

    return { success: true, count: pendingTransactions.length };
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
    const { data: cloudTx, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Failed to hydrate from cloud:', error);
      return;
    }

    if (cloudTx && cloudTx.length > 0) {
      const localFormat: Transaction[] = cloudTx.map((tx) => ({
        ...tx,
        is_synced: true,
      }));
      await db.transactions.bulkPut(localFormat);
    }
  } catch (err) {
    console.error('Hydration error:', err);
  }
}
