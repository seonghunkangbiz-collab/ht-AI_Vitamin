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

      activeUsers.forEach((target, targetIdx) => {
        const targetAssignments = (assignments || []).filter(a => a.target_user_id === target.id);
        const batchIndex = Math.floor(targetIdx / 4);

        targetAssignments.forEach(a => {
          const observer = userMap.get(a.user_id);
          allPairs.push({
            id: a.id,
            batchIndex,
            observerId: a.user_id,
            observerName: observer?.name || '익명 메이트',
            observerTeam: observer?.team || '',
            targetId: target.id,
            targetName: target.name,
            targetTeam: target.team
          });
        });
      });
    }

    // STRICT ZERO-LEAKAGE RULE:
    // Only return pairs with index < currentRevealIndex!
    // Unrevealed pairs are strictly truncated and excluded from response body.
    const revealedPairs = allPairs.slice(0, currentRevealIndex).map(p => ({
      ...p,
      isRevealed: true
    }));

    return NextResponse.json({
      revealedPairs,
      revealedCount: revealedPairs.length,
      totalCount: allPairs.length,
      currentRevealIndex
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
