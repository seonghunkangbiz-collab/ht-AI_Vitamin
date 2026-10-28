import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { REHEARSAL_MATE_PAIRS } from '@/lib/reveal-day/rehearsal-data';
import { MatePairReveal } from '@/lib/reveal-day/types';
import { INITIAL_NOTES } from '@/lib/seedData';

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

  // Exclude admin and recent additions (이현서, 최지훈) who did not participate in mate assignments
  const activeUsers = (users || []).filter(
    u => u.role !== 'admin' && !['user-25', 'user-26'].includes(u.id) && !['이현서', '최지훈'].includes(u.name)
  );
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

  // Fetch latest observation notes (query active private_notes first, supplemented by history and seed)
  const { data: dbNotes } = await supabase
    .from('private_notes')
    .select('user_id, target_user_id, content, updated_at, created_at')
    .order('updated_at', { ascending: false });

  const { data: historyNotes } = await supabase
    .from('private_note_history')
    .select('user_id, target_user_id, content, change_type, created_at')
    .order('created_at', { ascending: false });

  // Note lookup map: key `${user_id}->${target_user_id}` => latest note content
  const noteMap = new Map<string, string>();
  // 1. Seed fallback
  INITIAL_NOTES.forEach(n => {
    if (n.userId && n.targetUserId && n.content?.trim()) {
      noteMap.set(`${n.userId}->${n.targetUserId}`, n.content.trim());
    }
  });
  // 2. History rows (older to newer so newer overwrites)
  (historyNotes || [])
    .filter(h => h.change_type !== 'delete' && h.content?.trim())
    .reverse()
    .forEach(h => {
      noteMap.set(`${h.user_id}->${h.target_user_id}`, h.content.trim());
    });
  // 3. Active notes table (highest priority, latest registered notes overwrite)
  (dbNotes || [])
    .filter(n => n.content?.trim())
    .reverse()
    .forEach(n => {
      noteMap.set(`${n.user_id}->${n.target_user_id}`, n.content.trim());
    });

  const pairs: MatePairReveal[] = [];
  let pairIdx = 0;

  // Group by target user to maintain clean batches
  activeUsers.forEach((target, targetIdx) => {
    let targetAssignments = (assignments || []).filter(a => a.target_user_id === target.id);

    // Ensure EVERY participant has EXACTLY 2 secret mates (supplement if fewer than 2)
    if (targetAssignments.length < 2) {
      const candidates = activeUsers.filter(
        u => u.id !== target.id && !targetAssignments.some(a => a.user_id === u.id)
      );
      const crossTeam = candidates.filter(u => u.team !== target.team);
      const pool = crossTeam.length >= 2 ? crossTeam : candidates;
      while (targetAssignments.length < 2 && pool.length > 0) {
        const nextObs = pool[(targetIdx * 5 + targetAssignments.length * 7) % pool.length];
        targetAssignments.push({
          id: `m-live-supp-${target.id}-${targetAssignments.length + 1}`,
          user_id: nextObs.id,
          target_user_id: target.id,
          assigned_at: '2026-09-09T03:16:26.732Z'
        });
      }
    }

    // Prioritize observers with latest notes, then praises, take exactly 2
    const selectedAssignments = targetAssignments
      .sort((a, b) => {
        const hasNoteA = noteMap.has(`${a.user_id}->${target.id}`) ? 2 : 0;
        const hasNoteB = noteMap.has(`${b.user_id}->${target.id}`) ? 2 : 0;
        const hasPraiseA = (praises || []).some(p => p.sender_user_id === a.user_id && p.recipient_user_id === target.id) ? 1 : 0;
        const hasPraiseB = (praises || []).some(p => p.sender_user_id === b.user_id && p.recipient_user_id === target.id) ? 1 : 0;
        return (hasNoteB + hasPraiseB) - (hasNoteA + hasPraiseA);
      })
      .slice(0, 2);

    const batchIndex = Math.floor(targetIdx / 4); // Batches of 4 targets each

    selectedAssignments.forEach(a => {
      const observer = userMap.get(a.user_id);
      const matchedPraise = (praises || []).find(p => p.sender_user_id === a.user_id && p.recipient_user_id === target.id);
      const latestNote = noteMap.get(`${a.user_id}->${target.id}`) || '';

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
        noteMessage: latestNote,
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
