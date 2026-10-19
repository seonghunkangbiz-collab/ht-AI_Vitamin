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

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
