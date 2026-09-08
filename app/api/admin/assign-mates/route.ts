import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const supabase = getSupabaseClient();

    // Fetch all non-admin users
    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('*')
      .neq('role', 'admin');

    if (usersErr || !users || users.length === 0) {
      return NextResponse.json({ error: 'No users found to assign mates' }, { status: 400 });
    }

    // Delete existing mate assignments
    await supabase.from('mate_assignments').delete().neq('id', 'keep-all');

    const newAssignments: Array<{ id: string; user_id: string; target_user_id: string; assigned_at: string }> = [];
    const now = new Date().toISOString();

    users.forEach((user) => {
      // Find candidates from different teams first
      let candidates = users.filter(u => u.id !== user.id && u.team !== user.team);
      if (candidates.length < 2) {
        candidates = users.filter(u => u.id !== user.id);
      }

      // Shuffle candidates
      const shuffled = [...candidates].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 2);

      selected.forEach(target => {
        newAssignments.push({
          id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          user_id: user.id,
          target_user_id: target.id,
          assigned_at: now
        });
      });
    });

    const { error: insertErr } = await supabase
      .from('mate_assignments')
      .insert(newAssignments);

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: newAssignments.length
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
