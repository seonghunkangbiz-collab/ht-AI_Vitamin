import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { REHEARSAL_MATE_PAIRS } from '@/lib/reveal-day/rehearsal-data';
import { MatePairReveal } from '@/lib/reveal-day/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Builds ordered list of mate pairs for the event.
 * Target is the person being observed, Observer is the secret mystery mate who observed them.
 */
async function getEventMatePairs(eventId: string): Promise<MatePairReveal[]> {
  if (eventId.includes('rehearsal')) {
    return REHEARSAL_MATE_PAIRS;
  }

  const supabase = getSupabaseServerClient();
  const { data: users } = await supabase
    .from('users')
    .select('id, name, team, role')
    .order('name', { ascending: true });

  const activeUsers = (users || []).filter(u => u.role !== 'admin');
  const userMap = new Map(activeUsers.map(u => [u.id, u]));

  // Inbound relations: target_user_id is the recipient, user_id is the observer
  const { data: assignments } = await supabase
    .from('mate_assignments')
    .select('id, user_id, target_user_id, assigned_at')
    .order('assigned_at', { ascending: true });

  const { data: praises } = await supabase
    .from('praise_messages')
    .select('sender_user_id, recipient_user_id, content, refined_content')
    .order('created_at', { ascending: false });

  const { data: notes } = await supabase
    .from('private_note_history')
    .select('user_id, target_user_id, content, change_type')
    .order('created_at', { ascending: false });

  const activeNotes = (notes || []).filter(n => n.change_type !== 'delete' && n.content?.trim());

  const pairs: MatePairReveal[] = [];
  let pairIdx = 0;

  // Group by target user to maintain clean batches
  activeUsers.forEach((target, targetIdx) => {
    const targetAssignments = (assignments || []).filter(a => a.target_user_id === target.id);
    const batchIndex = Math.floor(targetIdx / 4); // Batches of 4 targets each

    targetAssignments.forEach(a => {
      const observer = userMap.get(a.user_id);
      const matchedPraise = (praises || []).find(p => p.sender_user_id === a.user_id && p.recipient_user_id === target.id);
      const matchedNote = activeNotes.find(n => n.user_id === a.user_id && n.target_user_id === target.id);

      pairs.push({
        id: a.id,
        batchIndex,
        observerId: a.user_id,
        observerName: observer?.name || '익명 메이트',
        observerTeam: observer?.team || '',
        targetId: target.id,
        targetName: target.name,
        targetTeam: target.team,
        praiseMessage: matchedPraise?.refined_content || matchedPraise?.content || '',
        noteMessage: matchedNote?.content || '',
        isRevealed: false
      });
      pairIdx++;
    });
  });

  return pairs;
}

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

    // Fetch current reveal index
    const { data: event } = await supabase
      .from('reveal_events')
      .select('current_reveal_index, current_batch_index')
      .eq('id', eventId)
      .single();

    const currentRevealIndex = event?.current_reveal_index || 0;
    const currentBatchIndex = event?.current_batch_index || 0;

    const allPairs = await getEventMatePairs(eventId);

    // Annotate revealed status
    const annotated = allPairs.map((pair, idx) => ({
      ...pair,
      isRevealed: idx < currentRevealIndex
    }));

    return NextResponse.json({
      pairs: annotated,
      currentRevealIndex,
      currentBatchIndex,
      totalPairs: allPairs.length,
      totalBatches: Math.ceil(allPairs.length / 8)
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
    const { eventId, action, targetIndex } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data: event } = await supabase
      .from('reveal_events')
      .select('current_reveal_index, current_batch_index, mode')
      .eq('id', eventId)
      .single();

    const currentBatch = event?.current_batch_index || 0;
    const currentIndex = event?.current_reveal_index || 0;
    const allPairs = await getEventMatePairs(eventId);
    const totalBatches = Math.max(1, Math.ceil(allPairs.length / 8));
    let nextIndex = currentIndex;
    let nextBatchIndex = currentBatch;

    if (action === 'reveal_next') {
      nextIndex = Math.min(allPairs.length, currentIndex + 1);
      nextBatchIndex = Math.min(totalBatches - 1, Math.floor((nextIndex > 0 ? nextIndex - 1 : 0) / 8));
    } else if (action === 'reveal_batch') {
      // Reveal all pairs up to and including the current batch, keeping the current batch view active!
      nextIndex = Math.min(allPairs.length, (currentBatch + 1) * 8);
      nextBatchIndex = currentBatch;
    } else if (action === 'next_batch') {
      nextBatchIndex = Math.min(totalBatches - 1, currentBatch + 1);
    } else if (action === 'prev_batch') {
      nextBatchIndex = Math.max(0, currentBatch - 1);
    } else if (action === 'set_batch') {
      const { batchIndex } = body;
      if (typeof batchIndex === 'number') {
        nextBatchIndex = Math.max(0, Math.min(totalBatches - 1, batchIndex));
      }
    } else if (action === 'set_index') {
      if (typeof targetIndex !== 'number') {
        return NextResponse.json({ error: 'targetIndex required' }, { status: 400 });
      }
      // Monotonicity check in live mode
      if (event?.mode === 'live' && targetIndex < currentIndex) {
        return NextResponse.json({ error: 'CANNOT_REWIND_IN_LIVE: 라이브 모드에서는 공개 단계를 되돌릴 수 없습니다.' }, { status: 400 });
      }
      nextIndex = Math.max(0, Math.min(allPairs.length, targetIndex));
      nextBatchIndex = Math.min(totalBatches - 1, Math.floor((nextIndex > 0 ? nextIndex - 1 : 0) / 8));
    } else if (action === 'reset_rehearsal') {
      if (event?.mode !== 'rehearsal') {
        return NextResponse.json({ error: 'Reset is only allowed in rehearsal mode.' }, { status: 400 });
      }
      nextIndex = 0;
      nextBatchIndex = 0;
    }

    const now = new Date().toISOString();

    await supabase
      .from('reveal_events')
      .update({
        current_reveal_index: nextIndex,
        current_batch_index: nextBatchIndex,
        updated_at: now
      })
      .eq('id', eventId);

    await supabase
      .from('reveal_public_state')
      .update({
        current_reveal_index: nextIndex,
        current_batch_index: nextBatchIndex,
        revealed_pairs_count: nextIndex,
        updated_at: now
      })
      .eq('event_id', eventId);

    // Audit log
    await supabase.from('reveal_audit_logs').insert({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      event_id: eventId,
      action: 'REVEAL_MATE_INDEX_ADVANCE',
      actor_id: session.userId,
      details: { previousIndex: currentIndex, nextIndex, action },
      created_at: now
    });

    return NextResponse.json({
      success: true,
      currentRevealIndex: nextIndex,
      currentBatchIndex: nextBatchIndex
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
