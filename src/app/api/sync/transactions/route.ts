import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Transaction } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const body = await req.json();
    const { transactions } = body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ status: 'success', synced_count: 0 });
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }

    // Client authenticated with user's JWT from header
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const payload = transactions.map((tx: Transaction) => ({
      id: tx.id,
      user_id: tx.user_id,
      wallet_id: tx.wallet_id,
      category_id: tx.category_id,
      amount: tx.amount,
      type: tx.type,
      transaction_date: tx.transaction_date,
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
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      status: 'success',
      synced_count: transactions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
