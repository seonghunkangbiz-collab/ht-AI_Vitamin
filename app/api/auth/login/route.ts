import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_USERS } from '@/lib/seedData';

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ error: '참여코드를 입력해 주세요.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const normalizedCode = code.trim().toUpperCase();

    // 1. Query user by participation code from Supabase
    let { data: user, error } = await supabase
      .from('users')
      .select('id, code, name, team, avatar, role')
      .eq('code', normalizedCode)
      .maybeSingle();

    // 2. If user is not found, check if users table is empty or needs initial seed
    if (!user) {
      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
      if (count === 0 || normalizedCode === 'VIT-ADMIN') {
        // Auto-seed initial 24 users + admin into Supabase users table
        await supabase.from('users').upsert(INITIAL_USERS);
        
        // Retry fetching user after seed
        const retry = await supabase
          .from('users')
          .select('id, code, name, team, avatar, role')
          .eq('code', normalizedCode)
          .maybeSingle();
          
        user = retry.data;
      }
    }

    if (!user) {
      return NextResponse.json({ error: '올바르지 않은 참여코드입니다. (예: VIT-7F2A9 또는 VIT-ADMIN)' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
