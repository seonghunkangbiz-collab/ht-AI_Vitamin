import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { getSessionFromRequest } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  const session = getSessionFromRequest(request);
  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get('userId');

  try {
    const supabase = getSupabaseServerClient();

    let targetUserId = session?.userId || '';
    let isAdmin = session?.role === 'admin';

    if (session) {
      if (requestedUserId && requestedUserId !== session.userId) {
        if (session.role !== 'admin') {
          return NextResponse.json({ error: 'FORBIDDEN: Cannot view other users mate data' }, { status: 403 });
        }
        targetUserId = requestedUserId;
      }
    } else if (requestedUserId) {
      // Fallback for existing localStorage sessions before HttpOnly cookie is synced
      const { data: validUser } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', requestedUserId)
        .maybeSingle();

      if (!validUser) {
        return NextResponse.json({ error: 'UNAUTHORIZED: Valid login session required' }, { status: 401 });
      }
      targetUserId = validUser.id;
      isAdmin = validUser.role === 'admin';
    } else {
      return NextResponse.json({ error: 'UNAUTHORIZED: Valid login session required' }, { status: 401 });
    }

    // 1. Check if Reveal Day is active
    const { data: revealState } = await supabase
      .from('app_state')
      .select('value')
      .eq('key', 'reveal_active')
      .maybeSingle();

    const isRevealActive = Boolean(revealState?.value?.active);

    // 2. Fetch Outbound Assignments: Whom did targetUserId observe?
    const { data: outboundAssignments, error: outErr } = await supabase
      .from('mate_assignments')
      .select('target_user_id')
      .eq('user_id', targetUserId);

    if (outErr) {
      return NextResponse.json({ error: outErr.message }, { status: 500 });
    }

    const outboundTargetIds = (outboundAssignments || []).map(a => a.target_user_id);
    let outboundMates: any[] = [];
    if (outboundTargetIds.length > 0) {
      const { data: mates } = await supabase
        .from('users')
        .select('id, name, team, avatar')
        .in('id', outboundTargetIds);
      outboundMates = mates || [];
    }

    // 3. Fetch Inbound Assignments: Who observed targetUserId? (Mystery Mate!)
    // REVEAL RULE: Inbound Mystery Mates are only disclosed when Reveal Day is active or user is admin
    let inboundMates: any[] = [];
    if (isRevealActive || isAdmin) {
      const { data: inboundAssignments } = await supabase
        .from('mate_assignments')
        .select('user_id')
        .eq('target_user_id', targetUserId);

      const inboundObserverIds = (inboundAssignments || []).map(a => a.user_id);
      if (inboundObserverIds.length > 0) {
        const { data: observers } = await supabase
          .from('users')
          .select('id, name, team, avatar')
          .in('id', inboundObserverIds);
        inboundMates = observers || [];
      }
    }

    return NextResponse.json({
      mates: outboundMates, // People I observed
      myMysteryMates: inboundMates, // People who observed me (revealed only when active)
      isRevealActive
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
