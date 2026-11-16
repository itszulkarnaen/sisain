'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { initializeAppData, deduplicateAndSyncCategories } from '@/lib/db/initialData';
import { syncPendingTransactions, hydrateFromCloud, SyncStatus } from '@/lib/db/sync';
import { DEFAULT_CATEGORIES } from '@/lib/constants/defaults';
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
import { TransactionType, Transaction, Profile, Category } from '@/types';
import { format } from 'date-fns';
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

        // 2. Clear old dummy data in Dexie if it still holds dummy 'user-usep-default' or another user
        const existingLocalProfile = await db.profiles.toCollection().first();
        if (!existingLocalProfile || existingLocalProfile.id !== user.id) {
          await db.transaction('rw', [db.profiles, db.transactions, db.budgets, db.recurringRules], async () => {
            await db.profiles.clear();
            await db.transactions.where('user_id').equals('user-usep-default').delete();
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

  // Nearest active recurring rule for the banner
  const nearestRecurringRule = useMemo(() => {
    return recurringRules.find((r) => r.is_active);
  }, [recurringRules]);

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

    if (isEditing) {
      await db.transactions.update(txId, {
        category_id: data.categoryId,
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
            category_id: data.categoryId,
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
        category_id: data.categoryId,
        amount: data.amount,
        type: data.type,
        transaction_date: data.transactionDate,
        notes: data.notes || null,
        created_at: new Date().toISOString(),
        is_synced: false,
      };

      // Save locally in Dexie (<100ms)
      await db.transactions.add(newTx);

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
    const existing = await db.budgets.where('category_id').equals(categoryId).first();
    const budgetId = existing ? existing.id : crypto.randomUUID();
    const userId = profile?.id || 'user-usep-default';

    if (existing) {
      await db.budgets.update(existing.id, { monthly_limit: monthlyLimit });
    } else {
      await db.budgets.add({
        id: budgetId,
        user_id: userId,
        category_id: categoryId,
        monthly_limit: monthlyLimit,
        created_at: new Date().toISOString(),
      });
    }

    if (supabase && userId !== 'user-usep-default') {
      await supabase.from('budgets').upsert(
        {
          id: budgetId,
          user_id: userId,
          category_id: categoryId,
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

    await db.recurringRules.add(newRule);

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

              {/* Upcoming Auto-Debit Banner */}
              <UpcomingRecurringBanner
                rule={nearestRecurringRule}
                daysRemaining={5}
                onClick={() => setActiveTab('automation')}
              />

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
              isProOrTrial={isProOrTrial}
              onLockedFeatureClick={() => setIsPaywallOpen(true)}
              onToggleRule={handleToggleRecurringRule}
              onAddRule={handleAddRecurringRule}
              onDeleteRule={handleDeleteRecurringRule}
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
      </div>
    </main>
  );
}
