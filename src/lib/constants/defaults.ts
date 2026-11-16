import { Category } from '@/types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'c0000001-0000-0000-0000-000000000001',
    user_id: null,
    name: 'Makan & Minum',
    icon: '🍜',
    color: '#FED7AA', // Peach / orange soft
    type: 'EXPENSE',
  },
  {
    id: 'c0000001-0000-0000-0000-000000000002',
    user_id: null,
    name: 'Nongkrong/Kopi',
    icon: '☕',
    color: '#FEF08A', // Soft yellow
    type: 'EXPENSE',
  },
  {
    id: 'c0000001-0000-0000-0000-000000000003',
    user_id: null,
    name: 'Transport',
    icon: '🚗',
    color: '#BAE6FD', // Soft light blue
    type: 'EXPENSE',
  },
  {
    id: 'c0000001-0000-0000-0000-000000000004',
    user_id: null,
    name: 'Belanja',
    icon: '🛍️',
    color: '#FBCFE8', // Soft pink
    type: 'EXPENSE',
  },
  {
    id: 'c0000001-0000-0000-0000-000000000005',
    user_id: null,
    name: 'Kosan/Tagihan',
    icon: '🏠',
    color: '#BBF7D0', // Soft green
    type: 'EXPENSE',
  },
  {
    id: 'c0000001-0000-0000-0000-000000000006',
    user_id: null,
    name: 'Hiburan',
    icon: '🎬',
    color: '#DDD6FE', // Soft purple
    type: 'EXPENSE',
  },
  {
    id: 'c0000001-0000-0000-0000-000000000009',
    user_id: null,
    name: 'Tidak Terduga',
    icon: '⚡',
    color: '#FECDD3', // Soft rose/pink alert
    type: 'EXPENSE',
  },
  // Incomes
  {
    id: 'c0000001-0000-0000-0000-000000000007',
    user_id: null,
    name: 'Gaji Utama',
    icon: '💰',
    color: '#A7F3D0',
    type: 'INCOME',
  },
  {
    id: 'c0000001-0000-0000-0000-000000000008',
    user_id: null,
    name: 'Side Hustle',
    icon: '💻',
    color: '#E9D5FF',
    type: 'INCOME',
  },
];

