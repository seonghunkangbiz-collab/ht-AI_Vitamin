import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { getApprovedCapsuleForUser } from '@/lib/reveal-day/capsule';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const auth = requireAuth(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { session } = auth;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const eventId = searchParams.get('eventId') || 'event-live-20261028';

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const supabase = getSupabaseServerClient();

    if (type === 'my_capsule') {
      const capsule = await getApprovedCapsuleForUser(session.userId);
      return NextResponse.json({ capsule });
    }

    if (type === 'my_status') {
      // Check if user checked in
      const { data: checkin } = await supabase
        .from('reveal_interactions')
        .select('id, created_at')
        .eq('event_id', eventId)
        .eq('user_id', session.userId)
        .eq('type', 'checkin')
        .maybeSingle();

      // Check if user won lucky draw
      const { data: drawWin } = await supabase
        .from('reveal_draws')
        .select('id, prize_name, round_number')
        .eq('event_id', eventId)
        .eq('winner_id', session.userId)
        .eq('is_voided', false)
        .maybeSingle();

      return NextResponse.json({
        isCheckedIn: Boolean(checkin),
        checkedInAt: checkin?.created_at,
        winningPrize: drawWin ? { prizeName: drawWin.prize_name, roundNumber: drawWin.round_number } : null
      });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireAuth(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { session } = auth;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { action, eventId } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();

    if (action === 'checkin') {
      // Upsert interaction
      const { error: insErr } = await supabase
        .from('reveal_interactions')
        .upsert({
          id: `checkin-${eventId}-${session.userId}`,
          event_id: eventId,
          user_id: session.userId,
          type: 'checkin',
          payload: { name: session.name, team: session.team },
          created_at: now
        });

      if (insErr) {
        return NextResponse.json({ error: insErr.message }, { status: 500 });
      }

      // Count distinct checkins
      const { count } = await supabase
        .from('reveal_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('type', 'checkin');

      // Update public state checkin_count
      await supabase
        .from('reveal_public_state')
        .update({
          checkin_count: count || 1,
          updated_at: now
        })
        .eq('event_id', eventId);

      return NextResponse.json({ success: true, isCheckedIn: true, checkinCount: count || 1 });
    }

    if (action === 'reaction') {
      const { reaction } = body; // 'heart' | 'clap' | 'party' | 'sparkle' | 'fire'
      if (!['heart', 'clap', 'party', 'sparkle', 'fire'].includes(reaction)) {
        return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
      }

      // Read current counts
      const { data: pubState } = await supabase
        .from('reveal_public_state')
        .select('reaction_counts')
        .eq('event_id', eventId)
        .single();

      const counts = pubState?.reaction_counts || { heart: 0, clap: 0, party: 0, sparkle: 0, fire: 0 };
      counts[reaction] = (counts[reaction] || 0) + 1;

      await supabase
        .from('reveal_public_state')
        .update({
          reaction_counts: counts,
          updated_at: now
        })
        .eq('event_id', eventId);

      return NextResponse.json({ success: true, reactionCounts: counts });
    }

    if (action === 'guess') {
      const { guessedUserId } = body;
      if (!guessedUserId) {
        return NextResponse.json({ error: 'guessedUserId required' }, { status: 400 });
      }

      await supabase
        .from('reveal_interactions')
        .insert({
          id: `guess-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          event_id: eventId,
          user_id: session.userId,
          type: 'guess',
          payload: { guessedUserId },
          created_at: now
        });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
