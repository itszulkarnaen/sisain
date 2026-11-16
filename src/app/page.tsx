'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { initializeAppData, deduplicateAndSyncCategories } from '@/lib/db/initialData';
import { syncPendingTransactions, syncBudgetsToCloud, hydrateFromCloud, SyncStatus } from '@/lib/db/sync';
import { DEFAULT_CATEGORIES, LEGACY_CATEGORY_ID_MAP } from '@/lib/constants/defaults';
import { supabase } from '@/lib/supabase/client';
import { calculateSafeToSpend } from '@/lib/utils/payday';
import { TopHeader } from '@/components/layout/TopHeader';
import { BottomNav, NavTab } from '@/components/layout/BottomNav';
import { SafeToSpendCard } from '@/components/dashboard/SafeToSpendCard';
import { UpcomingRecurringBanner } from '@/components/dashboard/UpcomingRecurringBanner';
import { CategoryBudgetGrid, CategoryBudgetDisplay } from '@/components/dashboard/CategoryBudgetGrid';
import { TodayTransactions } from '@/components/dashboard/TodayTransactions';
import { TransactionModal } from '@/components/transaction/TransactionModal';
import { SoftLockModal } from '@/components/paywall/SoftLockModal';
import { ProfileSettingsModal } from '@/components/profile/ProfileSettingsModal';
import { BudgetView } from '@/components/views/BudgetView';
import { AutomationView } from '@/components/views/AutomationView';
import { ReportsView } from '@/components/views/ReportsView';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { formatRupiah } from '@/lib/utils/currency';
import { TransactionType, Transaction, Profile, Category, RecurringRule } from '@/types';
import { format, differenceInCalendarDays } from 'date-fns';
import confetti from 'canvas-confetti';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('SYNCED');
  const [authChecking, setAuthChecking] = useState(true);
  const [ruleToMarkPaid, setRuleToMarkPaid] = useState<RecurringRule | null>(null);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  // Auth gate & profile sync
  useEffect(() => {
    let isMounted = true;

    async function checkAuthAndSync() {
      if (typeof window !== 'undefined') {
        const isGuest = localStorage.getItem('sisain_guest') || localStorage.getItem('ninetopay_guest');
        if (isGuest === 'true') {
          await initializeAppData().catch(console.error);
          if (isMounted) setAuthChecking(false);
          return;
        }
      }

      if (!supabase) {
        router.replace('/login');
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace('/login');
          return;
        }

        const user = session.user;
        const userEmail = user.email || '';
        const userFullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          userEmail.split('@')[0] ||
          'Pengguna';
        const userAvatar =
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          null;

        // 1. Fetch or create profile in Supabase
        const { data: remoteProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        let finalProfile: Profile;

        if (remoteProfile) {
          finalProfile = {
            ...remoteProfile,
            full_name: (remoteProfile.full_name && remoteProfile.full_name !== 'Pengguna Baru' && remoteProfile.full_name !== 'Usep')
              ? remoteProfile.full_name
              : userFullName,
            avatar_url: remoteProfile.avatar_url || userAvatar,
          };

          if (finalProfile.full_name !== remoteProfile.full_name || finalProfile.avatar_url !== remoteProfile.avatar_url) {
            await supabase
              .from('profiles')
              .update({
                full_name: finalProfile.full_name,
                avatar_url: finalProfile.avatar_url,
                updated_at: new Date().toISOString(),
              })
              .eq('id', user.id);
          }
        } else {
          finalProfile = {
            id: user.id,
            email: userEmail,
            full_name: userFullName,
            avatar_url: userAvatar,
            monthly_salary: 0,
            payday_date: 25,
            subscription_status: 'TRIAL',
            trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            subscription_ends_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          await supabase.from('profiles').upsert(finalProfile, { onConflict: 'id' });

          await supabase.from('wallets').upsert(
            { user_id: user.id, name: 'Dompet Utama', is_default: true },
            { onConflict: 'user_id' }
          );
        }

        // 2. Claim old local transactions to authenticated user instead of deleting
        const existingLocalProfile = await db.profiles.toCollection().first();
        if (!existingLocalProfile || existingLocalProfile.id !== user.id) {
          await db.transaction('rw', [db.profiles, db.transactions, db.budgets, db.recurringRules], async () => {
            await db.profiles.clear();
            await db.transactions
              .where('user_id')
              .equals('user-usep-default')
              .modify({ user_id: user.id, is_synced: false });
            await db.budgets.where('user_id').equals('user-usep-default').delete();
            await db.recurringRules.where('user_id').equals('user-usep-default').delete();
          });
        }

        // 3. Put authenticated user profile into Dexie
        await db.profiles.put(finalProfile);

        // 4. Ensure default categories exist and deduplicate in Dexie
        await deduplicateAndSyncCategories();

        // 5. Hydrate real user data from Supabase Cloud
        await hydrateFromCloud(user.id);

        // 6. Sync any local budgets to Supabase Cloud
        await syncBudgetsToCloud(user.id);

        // 7. Sync any pending transactions to cloud
        await syncPendingTransactions();

      } catch (err) {
        console.error('Error during auth check and sync:', err);
      } finally {
        if (isMounted) setAuthChecking(false);
      }
    }

    checkAuthAndSync();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Online/Offline sync listener
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('PENDING');
      syncPendingTransactions()
        .then(() => setSyncStatus('SYNCED'))
        .catch(() => setSyncStatus('ERROR'));
    };

    const handleOffline = () => setSyncStatus('OFFLINE');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Live queries from Dexie
  const profile = useLiveQuery(() => db.profiles.toCollection().first());
  const rawCategories = useLiveQuery(() => db.categories.toArray());
  const rawBudgets = useLiveQuery(() => db.budgets.toArray());
  const rawTransactions = useLiveQuery(() => db.transactions.orderBy('created_at').reverse().toArray());
  const rawRecurringRules = useLiveQuery(() => db.recurringRules.toArray());

  // Clean and deduplicate categories on mount
  useEffect(() => {
    deduplicateAndSyncCategories().catch(console.error);
  }, []);

  // Filter unique categories by normalized name and type
  const categories = useMemo(() => {
    const list = rawCategories || [];
    const seen = new Set<string>();
    const unique: Category[] = [];
    for (const cat of list) {
      const key = `${cat.type}_${cat.name.trim().toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(cat);
      }
    }
    return unique;
  }, [rawCategories]);
  const budgets = useMemo(() => rawBudgets || [], [rawBudgets]);
  const transactions = useMemo(() => rawTransactions || [], [rawTransactions]);
  const recurringRules = useMemo(() => rawRecurringRules || [], [rawRecurringRules]);

  // Check Subscription Status (TRIAL / ACTIVE vs EXPIRED)
  const isProOrTrial = useMemo(() => {
    if (!profile) return true;
    const now = new Date();
    if (profile.subscription_status === 'ACTIVE') {
      if (!profile.subscription_ends_at) return true;
      return new Date(profile.subscription_ends_at) > now;
    }
    if (profile.subscription_status === 'TRIAL') {
      if (!profile.trial_ends_at) return true;
      return new Date(profile.trial_ends_at) > now;
    }
    return false;
  }, [profile]);

  // Safe-to-Spend & Budget Metric
  const safeToSpendSummary = useMemo(() => {
    const salary = profile?.monthly_salary ?? 0;
    const paydayDate = profile?.payday_date || 25;

    return calculateSafeToSpend({
      monthlySalary: salary,
      paydayDate,
      transactions,
      recurringRules,
      budgets,
    });
  }, [profile, transactions, recurringRules, budgets]);

  // Today's Transactions & Expense
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (!tx.transaction_date) return false;
      const cleanDate = tx.transaction_date.slice(0, 10);
      return cleanDate === todayStr;
    });
  }, [transactions, todayStr]);

  const totalTodayExpense = useMemo(() => {
    return todayTransactions
      .filter((tx) => tx.type === 'EXPENSE')
      .reduce((acc, tx) => acc + tx.amount, 0);
  }, [todayTransactions]);

  const totalTodayIncome = useMemo(() => {
    return todayTransactions
      .filter((tx) => tx.type === 'INCOME')
      .reduce((acc, tx) => acc + tx.amount, 0);
  }, [todayTransactions]);

  // Spending per category map for current cycle
  const categorySpendingMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.type === 'EXPENSE') {
        const cur = map.get(tx.category_id) || 0;
        map.set(tx.category_id, cur + tx.amount);
      }
    }
    return map;
  }, [transactions]);

  // 4 Top Category Budget displays for Dashboard grid
  const categoryBudgetDisplays = useMemo<CategoryBudgetDisplay[]>(() => {
    const budgetMap = new Map(budgets.map((b) => [b.category_id, b.monthly_limit]));
    const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

    return expenseCategories.slice(0, 4).map((cat) => ({
      category: cat,
      budgetLimit: budgetMap.get(cat.id) || 1000000,
      spentAmount: categorySpendingMap.get(cat.id) || 0,
    }));
  }, [categories, budgets, categorySpendingMap]);

  // Upcoming bill rules and summary info for the reminder banner (Tagihan / Expense only)
  const upcomingRecurringSummary = useMemo(() => {
    if (!recurringRules || recurringRules.length === 0) return null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentMonthPrefix = format(now, 'yyyy-MM');

    // Filter active EXPENSE rules only (income does not trigger reminder notifications)
    const activeExpenseRules = recurringRules.filter((r) => {
      if (!r.is_active) return false;
      const cat = categories.find((c) => c.id === r.category_id);
      return cat?.type !== 'INCOME';
    });
    if (activeExpenseRules.length === 0) return null;

    const rulesWithDetails = activeExpenseRules.map((rule) => {
      const isPaidByLastExecuted = Boolean(
        rule.last_executed_at && rule.last_executed_at.startsWith(currentMonthPrefix)
      );

      const isPaidByTransaction = transactions.some(
        (tx) =>
          tx.recurring_rule_id === rule.id &&
          tx.transaction_date &&
          tx.transaction_date.startsWith(currentMonthPrefix)
      );

      const isPaidThisMonth = isPaidByLastExecuted || isPaidByTransaction;

      let dueDate: Date;
      let daysRemaining: number;

      if (!isPaidThisMonth) {
        dueDate = new Date(currentYear, currentMonth, rule.execution_day);
        daysRemaining = differenceInCalendarDays(dueDate, now);
      } else {
        dueDate = new Date(currentYear, currentMonth + 1, rule.execution_day);
        daysRemaining = differenceInCalendarDays(dueDate, now);
      }

      return {
        rule,
        isPaidThisMonth,
        dueDate,
        daysRemaining,
      };
    });

    // Unpaid bills for current month have top priority
    const unpaidRules = rulesWithDetails.filter((item) => !item.isPaidThisMonth);
    if (unpaidRules.length > 0) {
      unpaidRules.sort((a, b) => a.daysRemaining - b.daysRemaining);
      const nearest = unpaidRules[0];
      const totalAmount = unpaidRules.reduce((sum, item) => sum + item.rule.amount, 0);

      return {
        nearestRule: nearest.rule,
        nearestDaysRemaining: nearest.daysRemaining,
        totalUpcomingCount: unpaidRules.length,
        totalUpcomingAmount: totalAmount,
      };
    }

    // If all bills are paid this month, only show if next month's bill is very near (<= 3 days)
    const nextRules = [...rulesWithDetails].sort((a, b) => a.daysRemaining - b.daysRemaining);
    if (nextRules.length > 0 && nextRules[0].daysRemaining <= 3) {
      const nearest = nextRules[0];
      return {
        nearestRule: nearest.rule,
        nearestDaysRemaining: nearest.daysRemaining,
        totalUpcomingCount: 1,
        totalUpcomingAmount: nearest.rule.amount,
      };
    }

    return null;
  }, [recurringRules, transactions, categories]);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setIsAddModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  const handleSaveTransaction = async (data: {
    id?: string;
    amount: number;
    type: TransactionType;
    categoryId: string;
    notes: string;
    transactionDate: string;
  }) => {
    const existing = await db.profiles.toCollection().first();
    const userId = existing?.id || profile?.id || 'guest-user';
    const isEditing = Boolean(data.id);
    const txId = data.id || crypto.randomUUID();
    const validCategoryId = LEGACY_CATEGORY_ID_MAP[data.categoryId] || data.categoryId;

    if (isEditing) {
      await db.transactions.update(txId, {
        category_id: validCategoryId,
        amount: data.amount,
        type: data.type,
        transaction_date: data.transactionDate,
        notes: data.notes || null,
        is_synced: false,
      });

      if (supabase && userId !== 'user-usep-default' && userId !== 'guest-user') {
        await supabase
          .from('transactions')
          .update({
            category_id: validCategoryId,
            amount: data.amount,
            type: data.type,
            transaction_date: data.transactionDate,
            notes: data.notes || null,
          })
          .eq('id', txId);
      }
    } else {
      const newTx: Transaction = {
        id: txId,
        user_id: userId,
        wallet_id: 'wallet-default',
        category_id: validCategoryId,
        amount: data.amount,
        type: data.type,
        transaction_date: data.transactionDate,
        notes: data.notes || null,
        created_at: new Date().toISOString(),
        is_synced: false,
      };

      // Save locally in Dexie (<100ms)
      await db.transactions.put(newTx);

      // Micro-celebration
      try {
        confetti({
          particleCount: 25,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch {}

      // Trigger sync in background
      if (navigator.onLine && supabase && userId !== 'user-usep-default' && userId !== 'guest-user') {
        syncPendingTransactions().catch(() => {});
      }
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    await db.transactions.delete(id);
    const existing = await db.profiles.toCollection().first();
    const userId = existing?.id || profile?.id;
    if (supabase && userId && userId !== 'user-usep-default' && userId !== 'guest-user') {
      await supabase.from('transactions').delete().eq('id', id);
    }
  };

  const handleSaveBudget = async (categoryId: string, monthlyLimit: number) => {
    const validCatId = LEGACY_CATEGORY_ID_MAP[categoryId] || categoryId;
    const existing = await db.budgets.where('category_id').equals(validCatId).first();
    const budgetId = existing ? existing.id : crypto.randomUUID();
    const userId = profile?.id || 'user-usep-default';

    if (existing) {
      await db.budgets.update(existing.id, { monthly_limit: monthlyLimit, category_id: validCatId });
    } else {
      await db.budgets.put({
        id: budgetId,
        user_id: userId,
        category_id: validCatId,
        monthly_limit: monthlyLimit,
        created_at: new Date().toISOString(),
      });
    }

    if (supabase && userId !== 'user-usep-default' && userId !== 'guest-user') {
      await supabase.from('budgets').upsert(
        {
          id: budgetId,
          user_id: userId,
          category_id: validCatId,
          monthly_limit: monthlyLimit,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id, category_id' }
      );
    }
  };

  const handleToggleRecurringRule = async (ruleId: string, currentActive: boolean) => {
    await db.recurringRules.update(ruleId, { is_active: !currentActive });
    if (supabase && profile?.id && profile.id !== 'user-usep-default') {
      await supabase
        .from('recurring_rules')
        .update({ is_active: !currentActive, updated_at: new Date().toISOString() })
        .eq('id', ruleId);
    }
  };

  const handleAddRecurringRule = async (data: {
    title: string;
    amount: number;
    categoryId: string;
    executionDay: number;
  }) => {
    const ruleId = crypto.randomUUID();
    const userId = profile?.id || 'user-usep-default';

    const newRule = {
      id: ruleId,
      user_id: userId,
      wallet_id: 'wallet-default',
      category_id: data.categoryId,
      title: data.title,
      amount: data.amount,
      execution_day: data.executionDay,
      is_active: true,
      last_executed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.recurringRules.put(newRule);

    if (supabase && userId !== 'user-usep-default') {
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

      if (defaultWalletId) {
        await supabase.from('recurring_rules').insert({
          ...newRule,
          wallet_id: defaultWalletId,
        });
      }
    }
  };

  const handleDeleteRecurringRule = async (ruleId: string) => {
    await db.recurringRules.delete(ruleId);
    if (supabase && profile?.id && profile.id !== 'user-usep-default') {
      await supabase.from('recurring_rules').delete().eq('id', ruleId);
    }
  };

  const handleConfirmMarkAsPaid = async () => {
    if (!ruleToMarkPaid) return;
    setIsMarkingPaid(true);

    try {
      const existing = await db.profiles.toCollection().first();
      const userId = existing?.id || profile?.id || 'guest-user';
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const txId = crypto.randomUUID();
      const validCategoryId = LEGACY_CATEGORY_ID_MAP[ruleToMarkPaid.category_id] || ruleToMarkPaid.category_id;

      const targetCat = categories.find((c) => c.id === validCategoryId);
      const isIncome = targetCat?.type === 'INCOME';
      const txType: TransactionType = isIncome ? 'INCOME' : 'EXPENSE';
      const notesPrefix = isIncome ? '[Pemasukan Rutin]' : '[Tagihan]';

      // 1. Save Transaction to local Dexie
      const newTx: Transaction = {
        id: txId,
        user_id: userId,
        wallet_id: ruleToMarkPaid.wallet_id || 'wallet-default',
        category_id: validCategoryId,
        amount: ruleToMarkPaid.amount,
        type: txType,
        transaction_date: todayStr,
        notes: `${notesPrefix} ${ruleToMarkPaid.title}`,
        is_recurring_instance: true,
        recurring_rule_id: ruleToMarkPaid.id,
        created_at: new Date().toISOString(),
        is_synced: false,
      };

      await db.transactions.put(newTx);

      // 2. Update recurring rule in Dexie
      await db.recurringRules.update(ruleToMarkPaid.id, {
        last_executed_at: todayStr,
        updated_at: new Date().toISOString(),
      });

      // 3. Sync to Supabase if authenticated
      if (supabase && userId !== 'user-usep-default' && userId !== 'guest-user') {
        const { data: wallets } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', userId)
          .limit(1);
        const defaultWalletId = wallets?.[0]?.id || newTx.wallet_id;

        await supabase.from('transactions').insert({
          id: txId,
          user_id: userId,
          wallet_id: defaultWalletId,
          category_id: validCategoryId,
          amount: ruleToMarkPaid.amount,
          type: txType,
          transaction_date: todayStr,
          notes: `${notesPrefix} ${ruleToMarkPaid.title}`,
          is_recurring_instance: true,
          recurring_rule_id: ruleToMarkPaid.id,
        });

        await supabase
          .from('recurring_rules')
          .update({
            last_executed_at: todayStr,
            updated_at: new Date().toISOString(),
          })
          .eq('id', ruleToMarkPaid.id);
      }

      setRuleToMarkPaid(null);
    } catch (err) {
      console.error('Error marking bill as paid:', err);
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleSaveProfile = async (data: {
    fullName: string;
    monthlySalary: number;
    paydayDate: number;
  }) => {
    const existing = await db.profiles.toCollection().first();
    const profileId = existing?.id || profile?.id;
    if (profileId) {
      await db.profiles.update(profileId, {
        full_name: data.fullName,
        monthly_salary: data.monthlySalary,
        payday_date: data.paydayDate,
        updated_at: new Date().toISOString(),
      });

      if (supabase && profileId !== 'user-usep-default') {
        await supabase
          .from('profiles')
          .update({
            full_name: data.fullName,
            monthly_salary: data.monthlySalary,
            payday_date: data.paydayDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profileId);
      }
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sisain_guest');
      localStorage.removeItem('ninetopay_guest');
    }
    await db.transaction('rw', [db.profiles, db.transactions, db.budgets, db.recurringRules], async () => {
      await db.profiles.clear();
      await db.transactions.clear();
      await db.budgets.clear();
      await db.recurringRules.clear();
    });
    router.replace('/login');
  };

  if (authChecking) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-[#7e7ef1]/25 animate-pulse border border-[#a0dafd]/50 bg-white">
            <Image
              src="/sisain.png"
              alt="sisa.in logo"
              width={56}
              height={56}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <p className="text-xs font-bold text-slate-500">Memuat sisa.in...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 flex justify-center py-0 sm:py-6 selection:bg-[#7e7ef1]/20">
      {/* Mobile-First Frame Container (iPhone 14/15 size max-w-md) */}
      <div className="w-full max-w-md bg-[#FAFBFD] min-h-screen sm:min-h-[844px] sm:rounded-3xl sm:shadow-2xl sm:border sm:border-slate-200/80 flex flex-col relative overflow-hidden">
        
        {/* Top Header */}
        <TopHeader
          userName={profile?.full_name || 'Pengguna'}
          syncStatus={syncStatus}
          onSyncClick={() => {
            setSyncStatus('PENDING');
            syncPendingTransactions()
              .then(() => setSyncStatus('SYNCED'))
              .catch(() => setSyncStatus('ERROR'));
          }}
          onAvatarClick={() => {
            setIsProfileModalOpen(true);
          }}
        />

        {/* Tab Body Content */}
        <div className="flex-1 px-4 overflow-y-auto">
          {activeTab === 'home' && (
            <div className="space-y-4 pt-1">
              {/* Hero Safe-to-Spend Card */}
              <SafeToSpendCard
                summary={safeToSpendSummary}
                onCardClick={() => {
                  if (safeToSpendSummary.totalMonthlySalary <= 0) {
                    setIsProfileModalOpen(true);
                  } else {
                    setActiveTab('budget');
                  }
                }}
              />

              {/* Upcoming Bill Reminder Banner */}
              {upcomingRecurringSummary && (
                <UpcomingRecurringBanner
                  rule={upcomingRecurringSummary.nearestRule}
                  daysRemaining={upcomingRecurringSummary.nearestDaysRemaining}
                  totalUpcomingCount={upcomingRecurringSummary.totalUpcomingCount}
                  totalUpcomingAmount={upcomingRecurringSummary.totalUpcomingAmount}
                  onClick={() => setActiveTab('automation')}
                  onMarkAsPaid={(rule) => setRuleToMarkPaid(rule)}
                />
              )}

              {/* Category Budget 2-Column Grid */}
              <CategoryBudgetGrid
                items={categoryBudgetDisplays}
                onViewAllClick={() => setActiveTab('budget')}
                onItemClick={() => setActiveTab('budget')}
              />

              {/* Today Transactions List */}
              <TodayTransactions
                transactions={todayTransactions}
                categories={categories}
                totalTodayExpense={totalTodayExpense}
                totalTodayIncome={totalTodayIncome}
                onItemClick={handleEditTransaction}
                onViewAllClick={() => setActiveTab('reports')}
              />
            </div>
          )}

          {activeTab === 'budget' && (
            <BudgetView
              categories={categories}
              budgets={budgets}
              categorySpendingMap={categorySpendingMap}
              isProOrTrial={isProOrTrial}
              onLockedFeatureClick={() => setIsPaywallOpen(true)}
              onSaveBudget={handleSaveBudget}
            />
          )}

          {activeTab === 'automation' && (
            <AutomationView
              recurringRules={recurringRules}
              categories={categories}
              transactions={transactions}
              isProOrTrial={isProOrTrial}
              onLockedFeatureClick={() => setIsPaywallOpen(true)}
              onToggleRule={handleToggleRecurringRule}
              onAddRule={handleAddRecurringRule}
              onDeleteRule={handleDeleteRecurringRule}
              onMarkAsPaid={(rule) => setRuleToMarkPaid(rule)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              transactions={transactions}
              categories={categories}
              userName={profile?.full_name || 'Pengguna'}
              isProOrTrial={isProOrTrial}
              onLockedFeatureClick={() => setIsPaywallOpen(true)}
              onItemClick={handleEditTransaction}
            />
          )}
        </div>

        {/* Floating Dock Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenAddModal={handleOpenAddModal}
        />

        {/* Add / Edit Transaction Drawer / Numpad Modal */}
        <TransactionModal
          isOpen={isAddModalOpen}
          categories={categories}
          editingTransaction={editingTransaction}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingTransaction(null);
          }}
          onSave={handleSaveTransaction}
          onDelete={handleDeleteTransaction}
        />

        {/* Paywall Soft-Lock Modal */}
        <SoftLockModal
          isOpen={isPaywallOpen}
          onClose={() => setIsPaywallOpen(false)}
          userEmail={profile?.email || 'usep@kantor.com'}
          adminWaNumber={process.env.NEXT_PUBLIC_ADMIN_WA_NUMBER || '6281234567890'}
          bcaNumber={process.env.NEXT_PUBLIC_PAYMENT_BCA_NO || '1234567890'}
          bcaName={process.env.NEXT_PUBLIC_PAYMENT_BCA_NAME || 'Zul'}
          ewalletNumber={process.env.NEXT_PUBLIC_PAYMENT_EWALLET || '08123456789'}
        />

        {/* Profile & Payday Settings Modal */}
        <ProfileSettingsModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          profile={profile || null}
          onSaveProfile={handleSaveProfile}
          onOpenPaywall={() => setIsPaywallOpen(true)}
          onLogout={handleLogout}
        />

        {/* Confirmation Modal for Marking Bill as Paid / Received */}
        <ConfirmModal
          isOpen={Boolean(ruleToMarkPaid)}
          title={
            categories.find((c) => c.id === ruleToMarkPaid?.category_id)?.type === 'INCOME'
              ? 'Tandai Sudah Masuk?'
              : 'Tandai Sudah Dibayar?'
          }
          message={
            ruleToMarkPaid ? (() => {
              const isIncome = categories.find((c) => c.id === ruleToMarkPaid.category_id)?.type === 'INCOME';
              return (
                <span>
                  {isIncome ? 'Catat pemasukan rutin ' : 'Catat pembayaran tagihan '}
                  <strong className="text-slate-800 font-semibold">"{ruleToMarkPaid.title}"</strong>{' '}
                  sebesar{' '}
                  <strong className={isIncome ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                    {formatRupiah(ruleToMarkPaid.amount)}
                  </strong>{' '}
                  ke {isIncome ? 'pemasukan' : 'pengeluaran'} hari ini?
                  <br />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Transaksi {isIncome ? 'pemasukan' : 'pengeluaran'} baru akan dicatat dan jadwal bulan ini akan selesai.
                  </span>
                </span>
              );
            })() : ''
          }
          confirmText={
            categories.find((c) => c.id === ruleToMarkPaid?.category_id)?.type === 'INCOME'
              ? 'Ya, Sudah Masuk'
              : 'Ya, Sudah Bayar'
          }
          cancelText="Batal"
          loadingText="Memproses..."
          variant={
            categories.find((c) => c.id === ruleToMarkPaid?.category_id)?.type === 'INCOME'
              ? 'primary'
              : 'warning'
          }
          isLoading={isMarkingPaid}
          onConfirm={handleConfirmMarkAsPaid}
          onClose={() => setRuleToMarkPaid(null)}
        />
      </div>
    </main>
  );
}
