import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(req: NextRequest) {
  return handleCronExecution(req);
}

export async function POST(req: NextRequest) {
  return handleCronExecution(req);
}

async function handleCronExecution(req: NextRequest) {
  // Verifikasi Authorization Header
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase credentials not configured' }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const today = new Date();
  const currentDay = today.getDate();
  const todayDateStr = today.toISOString().split('T')[0];

  // Cek apakah hari ini adalah hari terakhir di bulan ini
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isLastDayOfMonth = tomorrow.getDate() === 1;

  try {
    // Ambil semua rule aktif yang jatuh tempo hari ini
    // (atau jatuh tempo di tanggal > hari ini jika hari ini adalah hari terakhir bulan)
    let query = supabaseAdmin
      .from('recurring_rules')
      .select('*, profiles!inner(subscription_status, trial_ends_at, subscription_ends_at)')
      .eq('is_active', true);

    if (isLastDayOfMonth) {
      query = query.gte('execution_day', currentDay);
    } else {
      query = query.eq('execution_day', currentDay);
    }

    const { data: rules, error: rulesError } = await query;

    if (rulesError) {
      return NextResponse.json({ error: rulesError.message }, { status: 500 });
    }

    if (!rules || rules.length === 0) {
      return NextResponse.json({ message: 'No recurring rules due today', executed: 0 });
    }

    let executedCount = 0;

    for (const rule of rules) {
      // Pastikan akun user berstatus Pro atau masih dalam masa Trial
      const userProfile = rule.profiles;
      const now = new Date();
      let hasAccess = false;

      if (userProfile.subscription_status === 'ACTIVE') {
        hasAccess = !userProfile.subscription_ends_at || new Date(userProfile.subscription_ends_at) > now;
      } else if (userProfile.subscription_status === 'TRIAL') {
        hasAccess = !userProfile.trial_ends_at || new Date(userProfile.trial_ends_at) > now;
      }

      // Jika expired, otomatis pause rule
      if (!hasAccess) {
        await supabaseAdmin
          .from('recurring_rules')
          .update({ is_active: false })
          .eq('id', rule.id);
        continue;
      }

      // Jangan eksekusi dobel jika sudah pernah dieksekusi hari ini
      if (rule.last_executed_at === todayDateStr) {
        continue;
      }

      // Insert transaksi baru ke PostgreSQL
      const transactionId = crypto.randomUUID();
      const { error: txError } = await supabaseAdmin.from('transactions').insert({
        id: transactionId,
        user_id: rule.user_id,
        wallet_id: rule.wallet_id,
        category_id: rule.category_id,
        amount: rule.amount,
        type: 'EXPENSE',
        transaction_date: todayDateStr,
        notes: `[Auto-Debit] ${rule.title}`,
        is_recurring_instance: true,
        recurring_rule_id: rule.id,
      });

      if (!txError) {
        // Update last_executed_at di recurring_rules
        await supabaseAdmin
          .from('recurring_rules')
          .update({ last_executed_at: todayDateStr })
          .eq('id', rule.id);
        executedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      executed: executedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
