import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_USERS } from '@/lib/seedData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ error: '참여코드 또는 사번을 입력해 주세요.' }, { status: 400 });
    }

    const rawInput = code.trim();
    const upperInput = rawInput.toUpperCase();
    const paddedInput = rawInput.padStart(5, '0');

    // Look up matching user in seed mapping by code or employeeNumber
    const seedUser = INITIAL_USERS.find(
      u => u.code.toUpperCase() === upperInput ||
           (u.employeeNumber && (u.employeeNumber === rawInput || u.employeeNumber === paddedInput))
    );

    const supabase = getSupabaseServerClient();
    const queryCode = seedUser ? seedUser.code : upperInput;

    // 1. Query user from Supabase users table by code
    let { data: user } = await supabase
      .from('users')
      .select('id, code, name, team, avatar, role')
      .eq('code', queryCode)
      .maybeSingle();

    if (!user && seedUser) {
      const { data: userById } = await supabase
        .from('users')
        .select('id, code, name, team, avatar, role')
        .eq('id', seedUser.id)
        .maybeSingle();
      user = userById;
    }

    // 2. Auto-seed initial users if table is empty
    if (!user) {
      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
      if (count === 0) {
        await supabase.from('users').upsert(INITIAL_USERS);
        const retry = await supabase
          .from('users')
          .select('id, code, name, team, avatar, role')
          .eq('code', queryCode)
          .maybeSingle();
        user = retry.data;
      }
    }

    if (!user) {
      return NextResponse.json({ error: '올바르지 않은 참여코드 또는 사번입니다. (예: 09721 또는 VIT-7F2A9)' }, { status: 404 });
    }

    const matchedSeed = INITIAL_USERS.find(u => u.id === user.id || u.code === user.code);

    const formattedUser = {
      id: user.id,
      code: user.code,
      name: user.name,
      team: user.team,
      avatar: user.avatar,
      role: user.role,
      employeeNumber: matchedSeed?.employeeNumber
    };

    return NextResponse.json({ user: formattedUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
