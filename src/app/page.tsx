'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { initializeAppData } from '@/lib/db/initialData';
import { syncPendingTransactions, SyncStatus } from '@/lib/db/sync';
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
import { TransactionType, Transaction } from '@/types';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('SYNCED');
  const [authChecking, setAuthChecking] = useState(true);

  // Auth gate: redirect to /login if not authenticated or not guest
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isGuest = localStorage.getItem('ninetopay_guest');
      if (isGuest === 'true') {
        setAuthChecking(false);
        return;
      }
    }

    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          router.replace('/login');
        } else {
          setAuthChecking(false);
        }
      });
    } else {
      router.replace('/login');
    }
  }, [router]);

  // Initialize DB seed
  useEffect(() => {
    initializeAppData().catch(console.error);

    // Online/Offline sync listener
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

  const categories = useMemo(() => rawCategories || [], [rawCategories]);
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

  // Safe-to-Spend Metric
  const safeToSpendSummary = useMemo(() => {
    const salary = profile?.monthly_salary || 8000000;
    const paydayDate = profile?.payday_date || 25;

    return calculateSafeToSpend({
      monthlySalary: salary,
      paydayDate,
      transactions,
      recurringRules,
    });
  }, [profile, transactions, recurringRules]);

  // Today's Transactions & Expense
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.transaction_date === todayStr);
  }, [transactions, todayStr]);

  const totalTodayExpense = useMemo(() => {
    return todayTransactions
      .filter((tx) => tx.type === 'EXPENSE')
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
  const handleSaveTransaction = async (data: {
    amount: number;
    type: TransactionType;
    categoryId: string;
    notes: string;
    transactionDate: string;
  }) => {
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      user_id: profile?.id || 'user-usep-default',
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
    syncPendingTransactions().catch(() => {});
  };

  const handleSaveBudget = async (categoryId: string, monthlyLimit: number) => {
    const existing = await db.budgets.where('category_id').equals(categoryId).first();
    if (existing) {
      await db.budgets.update(existing.id, { monthly_limit: monthlyLimit });
    } else {
      await db.budgets.add({
        id: crypto.randomUUID(),
        user_id: profile?.id || 'user-usep-default',
        category_id: categoryId,
        monthly_limit: monthlyLimit,
        created_at: new Date().toISOString(),
      });
    }
  };

  const handleToggleRecurringRule = async (ruleId: string, currentActive: boolean) => {
    await db.recurringRules.update(ruleId, { is_active: !currentActive });
  };

  const handleAddRecurringRule = async (data: {
    title: string;
    amount: number;
    categoryId: string;
    executionDay: number;
  }) => {
    await db.recurringRules.add({
      id: crypto.randomUUID(),
      user_id: profile?.id || 'user-usep-default',
      wallet_id: 'wallet-default',
      category_id: data.categoryId,
      title: data.title,
      amount: data.amount,
      execution_day: data.executionDay,
      is_active: true,
      last_executed_at: null,
      created_at: new Date().toISOString(),
    });
  };

  const handleDeleteRecurringRule = async (ruleId: string) => {
    await db.recurringRules.delete(ruleId);
  };

  const handleSaveProfile = async (data: {
    fullName: string;
    monthlySalary: number;
    paydayDate: number;
  }) => {
    if (profile) {
      await db.profiles.update(profile.id, {
        full_name: data.fullName,
        monthly_salary: data.monthlySalary,
        payday_date: data.paydayDate,
        updated_at: new Date().toISOString(),
      });
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ninetopay_guest');
    }
    router.replace('/login');
  };

  if (authChecking) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl animate-pulse">
            9
          </div>
          <p className="text-xs font-bold text-slate-500">Memuat NineToPay...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 flex justify-center py-0 sm:py-6 selection:bg-indigo-100">
      {/* Mobile-First Frame Container (iPhone 14/15 size max-w-md) */}
      <div className="w-full max-w-md bg-[#FAFBFD] min-h-screen sm:min-h-[844px] sm:rounded-3xl sm:shadow-2xl sm:border sm:border-slate-200/80 flex flex-col relative overflow-hidden">
        
        {/* Top Header */}
        <TopHeader
          userName={profile?.full_name || 'Usep'}
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
                onCardClick={() => setActiveTab('budget')}
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
              isProOrTrial={isProOrTrial}
              onLockedFeatureClick={() => setIsPaywallOpen(true)}
            />
          )}
        </div>

        {/* Floating Dock Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />

        {/* Add Transaction Drawer / Numpad Modal */}
        <TransactionModal
          isOpen={isAddModalOpen}
          categories={categories}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveTransaction}
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
