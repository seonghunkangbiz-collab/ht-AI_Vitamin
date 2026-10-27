import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { getApprovedCapsuleForUser } from '@/lib/reveal-day/capsule';
import { INITIAL_USERS } from '@/lib/seedData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const eventId = searchParams.get('eventId') || 'event-live-20261028';

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  // Allow public fetch for recent cheers for the beam projector display
  if (type === 'recent_cheers') {
    try {
      const supabase = getSupabaseServerClient();
      const { data: cheers } = await supabase
        .from('reveal_interactions')
        .select('id, payload, created_at')
        .eq('event_id', eventId)
        .eq('type', 'reaction')
        .order('created_at', { ascending: false })
        .limit(20);

      return NextResponse.json(
        {
          cheers: (cheers || []).map(c => ({
            id: c.id,
            senderName: c.payload?.senderName || '익명 메이트',
            senderTeam: c.payload?.senderTeam || '',
            reaction: c.payload?.reaction || 'heart',
            message: c.payload?.message || null,
            timestamp: new Date(c.created_at).getTime()
          }))
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      );
    } catch (e: any) {
      return NextResponse.json({ cheers: [] });
    }
  }

  const auth = requireAuth(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { session } = auth;

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
      // Ensure user exists in users table to satisfy foreign key constraint
      const { data: userExists } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.userId)
        .maybeSingle();

      if (!userExists) {
        const seedUser = INITIAL_USERS.find(u => u.id === session.userId);
        await supabase.from('users').upsert({
          id: session.userId,
          code: seedUser?.code || `VIT-${session.userId}`,
          name: session.name || seedUser?.name || '참여자',
          team: session.team || seedUser?.team || '',
          avatar: session.avatar || seedUser?.avatar || '👤',
          role: 'user'
        });
      }

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

    if (action === 'uncheckin') {
      // Delete user's checkin interaction for this specific eventId
      await supabase
        .from('reveal_interactions')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', session.userId)
        .eq('type', 'checkin');

      // Count remaining distinct checkins
      const { count } = await supabase
        .from('reveal_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('type', 'checkin');

      // Update public state checkin_count
      await supabase
        .from('reveal_public_state')
        .update({
          checkin_count: count || 0,
          updated_at: now
        })
        .eq('event_id', eventId);

      return NextResponse.json({ success: true, isCheckedIn: false, checkinCount: count || 0 });
    }

    if (action === 'reaction' || action === 'cheer') {
      const { reaction, message } = body;
      const validReactions = ['heart', 'clap', 'party', 'sparkle', 'fire', 'coffee', 'pizza', 'rocket'];
      const cleanReaction = validReactions.includes(reaction) ? reaction : 'heart';
      const cleanMessage = message ? String(message).trim().slice(0, 60) : null;

      // 1. Read current counts
      const { data: pubState } = await supabase
        .from('reveal_public_state')
        .select('reaction_counts')
        .eq('event_id', eventId)
        .single();

      const counts = pubState?.reaction_counts || { heart: 0, clap: 0, party: 0, sparkle: 0, fire: 0 };
      if (counts[cleanReaction] !== undefined) {
        counts[cleanReaction] = (counts[cleanReaction] || 0) + 1;
      }

      await supabase
        .from('reveal_public_state')
        .update({
          reaction_counts: counts,
          updated_at: now
        })
        .eq('event_id', eventId);

      // 2. Persist in interactions
      const cheerItem = {
        id: `cheer-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        eventId,
        userId: session.userId,
        senderName: session.name,
        senderTeam: session.team,
        reaction: cleanReaction,
        message: cleanMessage,
        timestamp: Date.now()
      };

      await supabase
        .from('reveal_interactions')
        .insert({
          id: cheerItem.id,
          event_id: eventId,
          user_id: session.userId,
          type: 'reaction',
          payload: {
            reaction: cleanReaction,
            message: cleanMessage,
            senderName: session.name,
            senderTeam: session.team
          },
          created_at: now
        });

      return NextResponse.json({
        success: true,
        cheer: cheerItem,
        reactionCounts: counts
      });
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
