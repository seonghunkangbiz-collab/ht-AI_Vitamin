import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { transitionSegment, toggleEmergencyMode } from '@/lib/reveal-day/state-machine';

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

  try {
    const supabase = getSupabaseServerClient();

    // 1. Fetch Event
    let { data: event, error: eventErr } = await supabase
      .from('reveal_events')
      .select('*')
      .eq('id', eventId)
      .maybeSingle();

    if (!event) {
      // Auto-initialize if row missing
      const isRehearsal = eventId.includes('rehearsal');
      const now = new Date().toISOString();
      const newEvent = {
        id: eventId,
        mode: isRehearsal ? 'rehearsal' : 'live',
        status: isRehearsal ? 'rehearsal' : 'ready',
        title: isRehearsal ? '[리허설] HT사업본부 AI Vitamin Program – Reveal Day' : 'HT사업본부 AI Vitamin Program – Reveal Day',
        concept: 'Connecting People, Growing Together',
        scheduled_at: '2026-10-28 16:00:00+09',
        cutoff_at: '2026-10-27 23:59:59+09',
        current_segment: 'opening',
        current_reveal_index: 0,
        current_batch_index: 0,
        version: 1,
        is_blackout: false,
        is_holding: false,
        created_at: now,
        updated_at: now
      };
      await supabase.from('reveal_events').upsert(newEvent);
      event = newEvent;
    }

    // 2. Fetch Public State
    let { data: publicState } = await supabase
      .from('reveal_public_state')
      .select('*')
      .eq('event_id', eventId)
      .maybeSingle();

    if (!publicState) {
      const now = new Date().toISOString();
      const newPubState = {
        event_id: eventId,
        mode: event.mode,
        status: event.status,
        current_segment: event.current_segment,
        current_reveal_index: event.current_reveal_index || 0,
        current_batch_index: event.current_batch_index || 0,
        revealed_pairs_count: 0,
        data_version: 1,
        sequence: 1,
        is_blackout: false,
        is_holding: false,
        reaction_counts: { heart: 0, clap: 0, party: 0, sparkle: 0, fire: 0 },
        checkin_count: 0,
        updated_at: now
      };
      await supabase.from('reveal_public_state').upsert(newPubState);
      publicState = newPubState;
    }

    let currentCapsuleIndex = 0;
    try {
      const { data: capsuleState } = await supabase
        .from('app_state')
        .select('value')
        .eq('key', `capsule_index_${eventId}`)
        .maybeSingle();

      if (capsuleState?.value?.index !== undefined) {
        currentCapsuleIndex = Number(capsuleState.value.index) || 0;
      }
    } catch {}

    let pizzaTimerSeconds = 50 * 60;
    let isPizzaTimerPaused = false;
    try {
      const { data: timerRow } = await supabase
        .from('app_state')
        .select('value')
        .eq('key', `pizza_timer_${eventId}`)
        .maybeSingle();

      if (timerRow?.value?.secondsLeft !== undefined) {
        pizzaTimerSeconds = Number(timerRow.value.secondsLeft);
        isPizzaTimerPaused = Boolean(timerRow.value.isPaused);
      }
    } catch {}

    return NextResponse.json({
      event: {
        id: event.id,
        mode: event.mode,
        status: event.status,
        title: event.title,
        concept: event.concept,
        scheduledAt: event.scheduled_at,
        cutoffAt: event.cutoff_at,
        currentSegment: event.current_segment,
        currentRevealIndex: event.current_reveal_index,
        currentBatchIndex: event.current_batch_index,
        currentCapsuleIndex,
        version: event.version,
        controllerId: event.controller_id,
        controllerName: event.controller_name,
        controllerLeaseUntil: event.controller_lease_until,
        isBlackout: event.is_blackout,
        isHolding: event.is_holding,
        createdAt: event.created_at,
        updatedAt: event.updated_at
      },
      publicState: {
        eventId: publicState.event_id,
        mode: publicState.mode,
        status: publicState.status,
        currentSegment: publicState.current_segment,
        currentRevealIndex: publicState.current_reveal_index,
        currentBatchIndex: publicState.current_batch_index,
        currentCapsuleIndex,
        pizzaTimerSeconds,
        isPizzaTimerPaused,
        revealedPairsCount: publicState.revealed_pairs_count,
        dataVersion: publicState.data_version,
        sequence: publicState.sequence,
        isBlackout: publicState.is_blackout,
        isHolding: publicState.is_holding,
        reactionCounts: publicState.reaction_counts,
        checkinCount: publicState.checkin_count,
        updatedAt: publicState.updated_at
      }
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
    const { eventId, action } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 });
    }

    if (action === 'transition_segment') {
      const { targetSegment, expectedVersion } = body;
      if (!targetSegment || typeof expectedVersion !== 'number') {
        return NextResponse.json({ error: 'targetSegment and expectedVersion required' }, { status: 400 });
      }

      const result = await transitionSegment(
        eventId,
        targetSegment,
        expectedVersion,
        session.userId,
        session.name
      );

      if (result.conflict) {
        return NextResponse.json(
          { error: 'VERSION_CONFLICT', message: '다른 운영자가 상태를 변경했습니다.', currentEvent: result.currentEvent },
          { status: 409 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'toggle_blackout') {
      const { active } = body;
      await toggleEmergencyMode(eventId, 'blackout', Boolean(active), session.userId);
      return NextResponse.json({ success: true, isBlackout: Boolean(active) });
    }

    if (action === 'toggle_holding') {
      const { active } = body;
      await toggleEmergencyMode(eventId, 'holding', Boolean(active), session.userId);
      return NextResponse.json({ success: true, isHolding: Boolean(active) });
    }

    if (action === 'set_status') {
      const { status } = body;
      const supabase = getSupabaseServerClient();
      await supabase.from('reveal_events').update({ status, updated_at: new Date().toISOString() }).eq('id', eventId);
      await supabase.from('reveal_public_state').update({ status, updated_at: new Date().toISOString() }).eq('event_id', eventId);
      return NextResponse.json({ success: true, status });
    }

    if (action === 'set_capsule_index') {
      const { index } = body;
      const targetIndex = typeof index === 'number' ? Math.max(0, index) : 0;
      const supabase = getSupabaseServerClient();
      const now = new Date().toISOString();

      // Upsert into app_state (safe, robust, unconstrained JSONB store)
      await supabase
        .from('app_state')
        .upsert({
          key: `capsule_index_${eventId}`,
          value: { index: targetIndex, updatedAt: now }
        });

      return NextResponse.json({ success: true, currentCapsuleIndex: targetIndex });
    }

    if (action === 'set_pizza_timer') {
      const { seconds, isPaused } = body;
      const targetSeconds = typeof seconds === 'number' ? Math.max(0, seconds) : 50 * 60;
      const targetPaused = Boolean(isPaused);
      const supabase = getSupabaseServerClient();
      const now = new Date().toISOString();

      await supabase
        .from('app_state')
        .upsert({
          key: `pizza_timer_${eventId}`,
          value: { secondsLeft: targetSeconds, isPaused: targetPaused, updatedAt: now }
        });

      return NextResponse.json({ success: true, secondsLeft: targetSeconds, isPaused: targetPaused });
    }

    if (action === 'reset_checkins') {
      const supabase = getSupabaseServerClient();
      const now = new Date().toISOString();

      // 1. Delete all checkin interactions for this specific eventId only
      const { error: delErr } = await supabase
        .from('reveal_interactions')
        .delete()
        .eq('event_id', eventId)
        .eq('type', 'checkin');

      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }

      // 2. Reset checkin_count to 0 in reveal_public_state
      const { error: updErr } = await supabase
        .from('reveal_public_state')
        .update({
          checkin_count: 0,
          updated_at: now
        })
        .eq('event_id', eventId);

      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      }

      // 3. Audit log
      await supabase.from('reveal_audit_logs').insert({
        event_id: eventId,
        actor_id: session.userId,
        actor_name: session.name,
        action: 'RESET_CHECKINS',
        payload: { eventId, resetBy: session.name },
        created_at: now
      });

      return NextResponse.json({ success: true, checkinCount: 0 });
    }

    if (action === 'factory_reset') {
      const supabase = getSupabaseServerClient();
      const now = new Date().toISOString();

      // 1. Delete all interactions for this eventId (checkins, reactions, guesses)
      await supabase
        .from('reveal_interactions')
        .delete()
        .eq('event_id', eventId);

      // 2. Delete all lucky draw results for this eventId
      await supabase
        .from('reveal_draws')
        .delete()
        .eq('event_id', eventId);

      // 3. Reset reveal_events
      const { data: currEv } = await supabase
        .from('reveal_events')
        .select('version')
        .eq('id', eventId)
        .single();

      const nextVersion = (currEv?.version || 1) + 1;

      await supabase
        .from('reveal_events')
        .update({
          status: 'ready',
          current_segment: 'opening',
          current_reveal_index: 0,
          current_batch_index: 0,
          is_blackout: false,
          is_holding: false,
          version: nextVersion,
          updated_at: now
        })
        .eq('id', eventId);

      // 4. Reset reveal_public_state
      const { data: currPub } = await supabase
        .from('reveal_public_state')
        .select('sequence')
        .eq('event_id', eventId)
        .single();

      const nextSequence = (currPub?.sequence || 1) + 1;

      await supabase
        .from('reveal_public_state')
        .update({
          status: 'ready',
          current_segment: 'opening',
          current_reveal_index: 0,
          current_batch_index: 0,
          revealed_pairs_count: 0,
          is_blackout: false,
          is_holding: false,
          checkin_count: 0,
          reaction_counts: { heart: 0, clap: 0, party: 0, sparkle: 0, fire: 0 },
          sequence: nextSequence,
          updated_at: now
        })
        .eq('event_id', eventId);

      // 5. Reset capsule index and pizza timer in app_state
      await supabase
        .from('app_state')
        .upsert([
          { key: `capsule_index_${eventId}`, value: { index: 0, updatedAt: now } },
          { key: `pizza_timer_${eventId}`, value: { secondsLeft: 50 * 60, isPaused: false, updatedAt: now } }
        ]);

      // 6. Audit log
      await supabase.from('reveal_audit_logs').insert({
        id: `audit-reset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        event_id: eventId,
        actor_id: session.userId,
        actor_name: session.name,
        action: 'FACTORY_RESET',
        payload: { eventId, resetBy: session.name, resetAt: now },
        created_at: now
      });

      return NextResponse.json({ 
        success: true, 
        message: '행사 전체 상태가 행사 시작 전 최초 상태로 완벽히 초기화되었습니다.' 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
