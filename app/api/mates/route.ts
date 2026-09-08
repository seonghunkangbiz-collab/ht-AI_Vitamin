import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_MATE_ASSIGNMENTS } from '@/lib/seedData';

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();
    
    // Fetch assignments for this user only
    let { data: assignments, error } = await supabase
      .from('mate_assignments')
      .select('target_user_id')
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Auto-seed initial assignments if table is completely empty
    if (!assignments || assignments.length === 0) {
      const { count } = await supabase.from('mate_assignments').select('*', { count: 'exact', head: true });
      if (count === 0) {
        await supabase.from('mate_assignments').upsert(
          INITIAL_MATE_ASSIGNMENTS.map(a => ({
            id: a.id,
            user_id: a.userId,
            target_user_id: a.targetUserId,
            assigned_at: a.assignedAt
          }))
        );
        const reFetch = await supabase
          .from('mate_assignments')
          .select('target_user_id')
          .eq('user_id', userId);
        assignments = reFetch.data || [];
      }
    }

    const targetUserIds = (assignments || []).map(a => a.target_user_id);
    if (targetUserIds.length === 0) {
      return NextResponse.json({ mates: [] });
    }

    // Fetch user details for targetUserIds
    const { data: mates, error: usersErr } = await supabase
      .from('users')
      .select('id, code, name, team, avatar, role')
      .in('id', targetUserIds);

    if (usersErr) {
      return NextResponse.json({ error: usersErr.message }, { status: 500 });
    }

    return NextResponse.json({ mates: mates || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
