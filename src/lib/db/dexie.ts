import Dexie, { type EntityTable } from 'dexie';
import { Transaction, Category, Budget, RecurringRule, Profile } from '@/types';
import { DEFAULT_CATEGORIES } from '../constants/defaults';

export interface AppMeta {
  key: string;
  value: unknown;
}

export class SisaInDatabase extends Dexie {
  transactions!: EntityTable<Transaction, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  budgets!: EntityTable<Budget, 'id'>;
  recurringRules!: EntityTable<RecurringRule, 'id'>;
  profiles!: EntityTable<Profile, 'id'>;
  meta!: EntityTable<AppMeta, 'key'>;

  constructor() {
    super('sisaInDB');
    this.version(1).stores({
      transactions: 'id, user_id, wallet_id, category_id, transaction_date, type, is_synced, created_at',
      categories: 'id, user_id, type, is_synced',
      budgets: 'id, user_id, category_id, is_synced',
      recurringRules: 'id, user_id, execution_day, is_active',
      profiles: 'id, subscription_status',
      meta: 'key',
    });
  }
}

export const db = new SisaInDatabase();

// Inisialisasi kategori default jika masih kosong
export async function seedDefaultCategories() {
  const count = await db.categories.count();
  if (count === 0) {
    await db.categories.bulkPut(DEFAULT_CATEGORIES);
  }
}
