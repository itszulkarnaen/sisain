import { Category } from '@/types';

export const LEGACY_CATEGORY_ID_MAP: Record<string, string> = {
  'cat-makan-minum': 'c0000001-0000-0000-0000-000000000001',
  'cat-nongkrong-kopi': 'c0000001-0000-0000-0000-000000000002',
  'cat-transport': 'c0000001-0000-0000-0000-000000000003',
  'cat-belanja': 'c0000001-0000-0000-0000-000000000004',
  'cat-kosan-tagihan': 'c0000001-0000-0000-0000-000000000005',
  'cat-hiburan': 'c0000001-0000-0000-0000-000000000006',
  'cat-gaji': 'c0000001-0000-0000-0000-000000000007',
  'cat-freelance': 'c0000001-0000-0000-0000-000000000008',
  'cat-side-hustle': 'c0000001-0000-0000-0000-000000000008',
  'cat-tidak-terduga': 'c0000001-0000-0000-0000-000000000009',
  'cat-tak-terduga': 'c0000001-0000-0000-0000-000000000009',
};

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'c0000001-0000-0000-0000-000000000001',
    user_id: null,
    name: 'Makan & Minum',
    icon: '/category/makan_minum.png',
    color: '#FED7AA', // Peach / orange soft
    type: 'EXPENSE',
  },
  {
    id: 'c0000001-0000-0000-0000-000000000002',
    user_id: null,
    name: 'Nongkrong/Kopi',
    icon: '/category/kopi.png',
    color: '#FEF08A', // Soft yellow
    type: 'EXPENSE',
  },
  {
    id: 'c0000001-0000-0000-0000-000000000003',
    user_id: null,
    name: 'Transport',
    icon: '/category/transport.png',
    color: '#BAE6FD', // Soft light blue
    type: 'EXPENSE',
  },
  {
    id: 'c0000001-0000-0000-0000-000000000004',
    user_id: null,
    name: 'Belanja',
    icon: '/category/belanja.png',
    color: '#FBCFE8', // Soft pink
    type: 'EXPENSE',
  },
  {
    id: 'c0000001-0000-0000-0000-000000000005',
    user_id: null,
    name: 'Kosan/Tagihan',
    icon: '/category/kosan.png',
    color: '#BBF7D0', // Soft green
    type: 'EXPENSE',
  },
  {
    id: 'c0000001-0000-0000-0000-000000000006',
    user_id: null,
    name: 'Hiburan',
    icon: '/category/hiburan.png',
    color: '#DDD6FE', // Soft purple
    type: 'EXPENSE',
  },
  {
    id: 'c0000001-0000-0000-0000-000000000009',
    user_id: null,
    name: 'Tidak Terduga',
    icon: '/category/tak_terduga.png',
    color: '#FECDD3', // Soft rose/pink alert
    type: 'EXPENSE',
  },
  // Incomes
  {
    id: 'c0000001-0000-0000-0000-000000000007',
    user_id: null,
    name: 'Gaji Pokok',
    icon: '/category/gaji.png',
    color: '#A7F3D0',
    type: 'INCOME',
  },
  {
    id: 'c0000001-0000-0000-0000-000000000008',
    user_id: null,
    name: 'Side Hustle',
    icon: '/category/side_husle.png',
    color: '#E9D5FF',
    type: 'INCOME',
  },
];
