import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { executeServerDraw, voidDraw } from '@/lib/reveal-day/draw';
import { REHEARSAL_USERS } from '@/lib/reveal-day/rehearsal-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const adminAuth = await requireAdmin(request);
  if ('errorResponse' in adminAuth) {
    return adminAuth.errorResponse;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId') || 'event-live-20261028';
  const isRehearsal = eventId.includes('rehearsal');

  try {
    const supabase = getSupabaseServerClient();

    // 1. Fetch existing draws
    const { data: draws, error: drawErr } = await supabase
      .from('reveal_draws')
      .select('*')
      .eq('event_id', eventId)
      .order('round_number', { ascending: true })
      .order('created_at', { ascending: true });

    if (drawErr) {
      return NextResponse.json({ error: drawErr.message }, { status: 500 });
    }

    // 2. Calculate eligible candidate count
    let totalEligible = 0;
    if (isRehearsal) {
      totalEligible = REHEARSAL_USERS.length;
    } else {
      const { data: users } = await supabase.from('users').select('id, role');
      totalEligible = (users || []).filter(u => u.role !== 'admin').length;
    }

    const previousWinnerIds = new Set(
      (draws || []).filter(d => !d.is_voided).map(d => d.winner_id)
    );

    const remainingEligible = Math.max(0, totalEligible - previousWinnerIds.size);

    const formatted = (draws || []).map(d => ({
      id: d.id,
      eventId: d.event_id,
      roundNumber: d.round_number,
      prizeName: d.prize_name,
      winnerId: d.winner_id,
      winnerName: d.winner_name,
      winnerTeam: d.winner_team,
      poolHash: d.pool_hash,
      poolSize: d.pool_size,
      selectedIndex: d.selected_index,
      executedBy: d.executed_by,
      idempotencyKey: d.idempotency_key,
      isVoided: d.is_voided,
      voidReason: d.void_reason,
      createdAt: d.created_at
    }));

    return NextResponse.json({
      draws: formatted,
      totalEligible,
      remainingEligible
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const adminAuth = await requireAdmin(request);
  if ('errorResponse' in adminAuth) {
    return adminAuth.errorResponse;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  const { session } = adminAuth;

  try {
    const body = await request.json();
    const { action, eventId } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 });
    }

    if (action === 'draw') {
      const { roundNumber, prizeName, excludePreviousWinners, idempotencyKey } = body;
      if (!roundNumber || !prizeName || !idempotencyKey) {
        return NextResponse.json({ error: 'roundNumber, prizeName, and idempotencyKey required' }, { status: 400 });
      }

      const result = await executeServerDraw({
        eventId,
        roundNumber: Number(roundNumber),
        prizeName,
        excludePreviousWinners: excludePreviousWinners !== false,
        adminId: session.userId,
        idempotencyKey
      });

      return NextResponse.json(result);
    }

    if (action === 'void') {
      const { drawId, reason } = body;
      if (!drawId || !reason) {
        return NextResponse.json({ error: 'drawId and reason required' }, { status: 400 });
      }

      await voidDraw(drawId, reason, session.userId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
