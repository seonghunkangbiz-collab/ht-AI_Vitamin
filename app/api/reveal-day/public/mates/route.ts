import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { REHEARSAL_MATE_PAIRS } from '@/lib/reveal-day/rehearsal-data';

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

      const activeUsers = (users || []).filter(u => u.role !== 'admin');
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

      // Fetch observation notes to correlate with mate pairs
      const { data: notes } = await supabase
        .from('private_note_history')
        .select('user_id, target_user_id, content, change_type')
        .order('created_at', { ascending: false });

      const activeNotes = (notes || []).filter(n => n.change_type !== 'delete' && n.content?.trim());

      activeUsers.forEach((target, targetIdx) => {
        const targetAssignments = (assignments || []).filter(a => a.target_user_id === target.id);
        const batchIndex = Math.floor(targetIdx / 4);

        targetAssignments.forEach(a => {
          const observer = userMap.get(a.user_id);
          const matchedPraise = (praises || []).find(p => p.sender_user_id === a.user_id && p.recipient_user_id === target.id);
          const matchedNote = activeNotes.find(n => n.user_id === a.user_id && n.target_user_id === target.id);

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
            noteMessage: matchedNote?.content || ''
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
