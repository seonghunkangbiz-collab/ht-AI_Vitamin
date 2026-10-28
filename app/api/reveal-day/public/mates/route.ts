import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { REHEARSAL_MATE_PAIRS } from '@/lib/reveal-day/rehearsal-data';
import { INITIAL_NOTES, INITIAL_PRAISES, INITIAL_MATE_ASSIGNMENTS } from '@/lib/seedData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId') || 'event-live-20261028';
  const isRehearsal = eventId.includes('rehearsal');

  try {
    const supabase = getSupabaseServerClient();

    // 1. Fetch current allowed reveal index from public state
    const { data: pubState } = await supabase
      .from('reveal_public_state')
      .select('current_reveal_index')
      .eq('event_id', eventId)
      .maybeSingle();

    const currentRevealIndex = pubState?.current_reveal_index || 0;

    // 2. Fetch full relations
    let allPairs: any[] = [];
    if (isRehearsal) {
      allPairs = REHEARSAL_MATE_PAIRS;
    } else {
      const { data: users } = await supabase
        .from('users')
        .select('id, name, team, role')
        .order('name', { ascending: true });

      // Filter out admin and recent joins (이현서, 최지훈) who did not participate in mate assignments
      const activeUsers = (users || []).filter(
        u => u.role !== 'admin' && !['user-25', 'user-26'].includes(u.id) && !['이현서', '최지훈'].includes(u.name)
      );
      const userMap = new Map(activeUsers.map(u => [u.id, u]));

      const { data: assignments } = await supabase
        .from('mate_assignments')
        .select('id, user_id, target_user_id, assigned_at')
        .order('assigned_at', { ascending: true });

      // Fetch praise messages to correlate with mate pairs
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

        const batchIndex = Math.floor(targetIdx / 4);

        selectedObserverIds.forEach(obsId => {
          const observer = userMap.get(obsId);
          const latestNote = noteMap.get(`${obsId}->${target.id}`) || '';
          const matchedPraises = (praises || [])
            .filter(p => p.sender_user_id === obsId && p.recipient_user_id === target.id && (p.refined_content?.trim() || p.content?.trim()));
          const latestPraise = matchedPraises[0]?.refined_content || matchedPraises[0]?.content || '';

          allPairs.push({
            id: `live-pair-${target.id}-${obsId}`,
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
        });
      });
    }

    // 3. Fetch user guesses and check-ins for this event
    const { data: guessRows } = await supabase
      .from('reveal_interactions')
      .select('user_id, payload')
      .eq('event_id', eventId)
      .eq('type', 'guess');

    const userGuessMap = new Map<string, string>();
    (guessRows || []).forEach(g => {
      if (g.user_id && g.payload?.guessedUserId) {
        userGuessMap.set(g.user_id, g.payload.guessedUserId);
      }
    });

    const { data: checkinRows } = await supabase
      .from('reveal_interactions')
      .select('user_id')
      .eq('event_id', eventId)
      .eq('type', 'checkin');

    const checkinSet = new Set((checkinRows || []).map(c => c.user_id));

    // STRICT ZERO-LEAKAGE RULE:
    // Only revealed pairs (index < currentRevealIndex) reveal observer name/team/id and their praise message.
    // Unrevealed pairs provide target info (for card layout) with strictly masked observer data.
    const safePairs = allPairs.map((p, idx) => {
      const isRevealed = idx < currentRevealIndex;
      // Strictly verify if the attendee checked in and submitted a matching guess on mobile /live
      const dbGuessed = userGuessMap.get(p.targetId) === p.observerId;
      const isGuessed = Boolean(dbGuessed);
      const isCheckedIn = checkinSet.has(p.targetId) || isRehearsal;

      if (isRevealed) {
        return {
          ...p,
          isRevealed: true,
          isGuessedCorrectly: isGuessed,
          isTargetCheckedIn: isCheckedIn
        };
      } else {
        return {
          id: p.id,
          batchIndex: p.batchIndex,
          targetId: p.targetId,
          targetName: p.targetName,
          targetTeam: p.targetTeam,
          observerId: '',
          observerName: '???',
          observerTeam: '비공개',
          praiseMessage: '',
          noteMessage: '',
          isRevealed: false,
          isGuessedCorrectly: false,
          isTargetCheckedIn: isCheckedIn
        };
      }
    });

    return NextResponse.json({
      revealedPairs: safePairs,
      revealedCount: safePairs.filter(p => p.isRevealed).length,
      totalCount: allPairs.length,
      currentRevealIndex
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
