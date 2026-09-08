import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';

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

    // Query user by participation code from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('id, code, name, team, avatar, role')
      .eq('code', normalizedCode)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: '올바르지 않은 참여코드입니다.' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
