import { Category } from '@/types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-makan-minum',
    user_id: null,
    name: 'Makan & Minum',
    icon: '🍜',
    color: '#FED7AA', // Peach / orange soft
    type: 'EXPENSE',
  },
  {
    id: 'cat-nongkrong-kopi',
    user_id: null,
    name: 'Nongkrong/Kopi',
    icon: '☕',
    color: '#FEF08A', // Soft yellow
    type: 'EXPENSE',
  },
  {
    id: 'cat-transport',
    user_id: null,
    name: 'Transport',
    icon: '🚗',
    color: '#BAE6FD', // Soft light blue
    type: 'EXPENSE',
  },
  {
    id: 'cat-belanja',
    user_id: null,
    name: 'Belanja',
    icon: '🛍️',
    color: '#FBCFE8', // Soft pink
    type: 'EXPENSE',
  },
  {
    id: 'cat-kosan-tagihan',
    user_id: null,
    name: 'Kosan/Tagihan',
    icon: '🏠',
    color: '#BBF7D0', // Soft green
    type: 'EXPENSE',
  },
  {
    id: 'cat-hiburan',
    user_id: null,
    name: 'Hiburan',
    icon: '🎬',
    color: '#DDD6FE', // Soft purple
    type: 'EXPENSE',
  },
  // Incomes
  {
    id: 'cat-gaji',
    user_id: null,
    name: 'Gaji Utama',
    icon: '💰',
    color: '#A7F3D0',
    type: 'INCOME',
  },
  {
    id: 'cat-freelance',
    user_id: null,
    name: 'Side Hustle',
    icon: '💻',
    color: '#E9D5FF',
    type: 'INCOME',
  },
];

