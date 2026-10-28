import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { REHEARSAL_MATE_PAIRS } from '@/lib/reveal-day/rehearsal-data';
import { MatePairReveal } from '@/lib/reveal-day/types';
import { INITIAL_NOTES, INITIAL_PRAISES, INITIAL_MATE_ASSIGNMENTS } from '@/lib/seedData';

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
    // Observers from mate assignments (database or seed fallback)
    let assignedObservers = (assignments || [])
      .filter(a => a.target_user_id === target.id)
      .map(a => a.user_id);
    if (assignedObservers.length === 0) {
      assignedObservers = INITIAL_MATE_ASSIGNMENTS
        .filter(a => a.targetUserId === target.id)
        .map(a => a.userId);
    }

    // Distinct assigned observer IDs (exclude self and recent joins)
    const candidateIds = Array.from(new Set(assignedObservers))
      .filter(uid => uid !== target.id && !['user-25', 'user-26'].includes(uid));

    // Ensure candidate pool has at least 2 distinct observers (fallback supplement only if needed)
    const otherCandidates = activeUsers.filter(u => u.id !== target.id && !candidateIds.includes(u.id));
    const crossTeam = otherCandidates.filter(u => u.team !== target.team);
    const supplementPool = crossTeam.length >= 2 ? crossTeam : otherCandidates;

    let suppIdx = 0;
    while (candidateIds.length < 2 && supplementPool.length > 0) {
      const nextUid = supplementPool[(targetIdx * 5 + suppIdx * 7) % supplementPool.length].id;
      if (!candidateIds.includes(nextUid)) {
        candidateIds.push(nextUid);
      }
      suppIdx++;
    }

    // Rank candidates:
    // 1. Assigned mates who wrote an observation note about this target (100 pts)
    // 2. Assigned mates (50 pts)
    // 3. Supplemented (0 pts)
    const selectedObserverIds = candidateIds.sort((a, b) => {
      const isAssignedA = assignedObservers.includes(a);
      const isAssignedB = assignedObservers.includes(b);
      const hasNoteA = noteMap.has(`${a}->${target.id}`);
      const hasNoteB = noteMap.has(`${b}->${target.id}`);

      const scoreA = (isAssignedA ? 50 : 0) + (hasNoteA ? 50 : 0);
      const scoreB = (isAssignedB ? 50 : 0) + (hasNoteB ? 50 : 0);
      return scoreB - scoreA;
    }).slice(0, 2);

    const batchIndex = Math.floor(targetIdx / 4); // Batches of 4 targets each

    selectedObserverIds.forEach(obsId => {
      const observer = userMap.get(obsId);
      const latestNote = noteMap.get(`${obsId}->${target.id}`) || '';
      const matchedPraises = (praises || [])
        .filter(p => p.sender_user_id === obsId && p.recipient_user_id === target.id && (p.refined_content?.trim() || p.content?.trim()));
      const latestPraise = matchedPraises[0]?.refined_content || matchedPraises[0]?.content || '';

      pairs.push({
        id: `admin-pair-${target.id}-${obsId}`,
        batchIndex,
        observerId: obsId,
        observerName: observer?.name || '익명 메이트',
        observerTeam: observer?.team || '',
        targetId: target.id,
        targetName: target.name,
        targetTeam: target.team,
        praiseMessage: latestPraise, // Fallback praise when observation note is missing
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
