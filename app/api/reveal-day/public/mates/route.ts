import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { REHEARSAL_MATE_PAIRS } from '@/lib/reveal-day/rehearsal-data';
import { INITIAL_NOTES } from '@/lib/seedData';

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

        const batchIndex = Math.floor(targetIdx / 4);

        selectedAssignments.forEach(a => {
          const observer = userMap.get(a.user_id);
          const matchedPraise = (praises || []).find(p => p.sender_user_id === a.user_id && p.recipient_user_id === target.id);
          const latestNote = noteMap.get(`${a.user_id}->${target.id}`) || '';

          allPairs.push({
            id: a.id,
            batchIndex,
            observerId: a.user_id,
            observerName: observer?.name || '익명 메이트',
            observerTeam: observer?.team || '',
            targetId: target.id,
            targetName: target.name,
            targetTeam: target.team,
            praiseMessage: matchedPraise?.refined_content || matchedPraise?.content || '',
            noteMessage: latestNote
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
