import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const JURAGAN_PIN = process.env.JURAGAN_PIN || '888888';

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured in environment variables');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(req: NextRequest) {
  try {
    const pin = req.headers.get('x-juragan-pin');
    if (!pin || pin !== JURAGAN_PIN) {
      return NextResponse.json({ error: 'PIN Juragan tidak valid' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, monthly_salary, payday_date, subscription_status, trial_ends_at, subscription_ends_at, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscribers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const list = profiles || [];
    const stats = {
      total: list.length,
      sultan: list.filter((p) => p.subscription_status === 'ACTIVE').length,
      trial: list.filter((p) => p.subscription_status === 'TRIAL').length,
      expired: list.filter((p) => p.subscription_status === 'EXPIRED').length,
    };

    return NextResponse.json({
      success: true,
      profiles: list,
      stats,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. Verifikasi PIN login
    if (action === 'verify-pin') {
      const { pin } = body;
      if (!pin || pin !== JURAGAN_PIN) {
        return NextResponse.json({ error: 'PIN Juragan salah!' }, { status: 401 });
      }
      return NextResponse.json({
        success: true,
        message: 'Akses Juragan terverifikasi!',
      });
    }

    // 2. Update status subscriber
    if (action === 'update-subscription') {
      const pinHeader = req.headers.get('x-juragan-pin');
      const pinBody = body.pin;
      const effectivePin = pinHeader || pinBody;

      if (!effectivePin || effectivePin !== JURAGAN_PIN) {
        return NextResponse.json({ error: 'Akses ditolak: PIN tidak valid' }, { status: 401 });
      }

      const { userId, targetStatus, durationMonths } = body;
      if (!userId || !targetStatus) {
        return NextResponse.json(
          { error: 'userId dan targetStatus wajib diisi' },
          { status: 400 }
        );
      }

      const supabase = getSupabaseAdmin();
      const now = new Date();
      let subscription_ends_at: string | null = null;
      let trial_ends_at: string | undefined = undefined;

      if (targetStatus === 'ACTIVE') {
        if (durationMonths && durationMonths < 999) {
          subscription_ends_at = new Date(
            now.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000
          ).toISOString();
        } else {
          subscription_ends_at = null; // Permanen / Lifetime Sultan
        }
      } else if (targetStatus === 'TRIAL') {
        trial_ends_at = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        subscription_ends_at = null;
      } else if (targetStatus === 'EXPIRED') {
        subscription_ends_at = null;
      }

      const updatePayload: Record<string, unknown> = {
        subscription_status: targetStatus,
        subscription_ends_at,
        updated_at: now.toISOString(),
      };
      if (trial_ends_at) {
        updatePayload.trial_ends_at = trial_ends_at;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating subscriber in Supabase:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Subscriber berhasil diubah ke status ${targetStatus}`,
        profile: data,
      });
    }

    return NextResponse.json({ error: 'Action tidak dikenali' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
