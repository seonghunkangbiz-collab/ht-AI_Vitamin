import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_USERS } from '@/lib/seedData';

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const normalizedCode = code.trim().toUpperCase();

    // Query user by code from Supabase
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('code', normalizedCode)
      .single();

    if (error || !user) {
      // If DB is empty, attempt auto-seed for initial 24 users
      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
      if (count === 0) {
        await supabase.from('users').insert(INITIAL_USERS);
        const retry = await supabase.from('users').select('*').eq('code', normalizedCode).single();
        user = retry.data;
      }
    }

    if (!user) {
      return NextResponse.json({ error: '올바르지 않은 참여코드입니다.' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
