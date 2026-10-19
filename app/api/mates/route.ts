import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const auth = requireAuth(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { session } = auth;
  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get('userId');

  // Prevent querying other users' mates unless administrator
  let targetUserId = session.userId;
  if (requestedUserId && requestedUserId !== session.userId) {
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'FORBIDDEN: Cannot view other users mate data' }, { status: 403 });
    }
    targetUserId = requestedUserId;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const supabase = getSupabaseServerClient();

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
    if (isRevealActive || session.role === 'admin') {
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
