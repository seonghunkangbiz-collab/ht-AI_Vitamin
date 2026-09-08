import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_USERS } from '@/lib/seedData';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const supabase = getSupabaseServerClient();
    let { data: users, error } = await supabase
      .from('users')
      .select('id, code, name, team, avatar, role')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Auto-seed initial 24 users if database is empty
    if (!users || users.length === 0) {
      await supabase.from('users').upsert(INITIAL_USERS);
      const reFetch = await supabase
        .from('users')
        .select('id, code, name, team, avatar, role')
        .order('name', { ascending: true });
      users = reFetch.data || [];
    }

    return NextResponse.json({ users: users || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const { users } = await request.json();
    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'Users array is required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('users')
      .upsert(users)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: data.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
