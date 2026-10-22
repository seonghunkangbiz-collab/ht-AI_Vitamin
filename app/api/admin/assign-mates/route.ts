import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth/session';

export async function POST(request: Request) {
  const adminAuth = await requireAdmin(request);
  if ('errorResponse' in adminAuth) {
    return adminAuth.errorResponse;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const supabase = getSupabaseServerClient();

    // Fetch all users and filter non-admin in JS
    const { data: allUsers, error: usersErr } = await supabase
      .from('users')
      .select('id, code, name, team, role');

    if (usersErr || !allUsers || allUsers.length === 0) {
      return NextResponse.json({ error: '배정 가능한 사용자가 없습니다. 먼저 사용자를 등록하세요.' }, { status: 400 });
    }

    const users = allUsers.filter(u => u.role !== 'admin');

    if (users.length < 2) {
      return NextResponse.json({ error: '배정 가능한 사용자가 2명 이상이어야 합니다.' }, { status: 400 });
    }

    // Safety check: Prevent accidental deletion of production mate assignments
    let forceOverwrite = false;
    let confirmReshuffle = '';
    try {
      const body = await request.json();
      forceOverwrite = Boolean(body?.forceOverwrite);
      confirmReshuffle = String(body?.confirmReshuffle || '');
    } catch {
      // Body may be empty on standard calls
    }

    const { count: existingCount } = await supabase
      .from('mate_assignments')
      .select('*', { count: 'exact', head: true });

    // Strictly block reshuffling during live operation unless explicit confirmation token is provided
    if (!forceOverwrite || confirmReshuffle !== 'CONFIRM_OVERWRITE_MATES') {
      return NextResponse.json({
        error: 'LOCKED: 현재 운영 중인 Mystery Mate 배정 데이터는 Reveal Day 종료 시까지 변경 및 재배정이 엄격히 잠겨 있습니다.',
        isLocked: true,
        count: existingCount || 48
      }, { status: 409 });
    }

    // Delete existing mate assignments from Supabase only if explicitly unlocked
    await supabase.from('mate_assignments').delete().neq('id', 'keep-all-placeholder');

    const newAssignments: Array<{ id: string; user_id: string; target_user_id: string; assigned_at: string }> = [];
    const now = new Date().toISOString();

    users.forEach((user) => {
      // 1. Exclude self & admin
      // 2. Prioritize different team
      let candidates = users.filter(u => u.id !== user.id && u.team !== user.team);
      if (candidates.length < 2) {
        candidates = users.filter(u => u.id !== user.id);
      }

      // Shuffle candidates
      const shuffled = [...candidates].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 2);

      selected.forEach(target => {
        newAssignments.push({
          id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
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
