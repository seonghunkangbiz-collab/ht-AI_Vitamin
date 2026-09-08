import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_USERS } from '@/lib/seedData';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const supabase = getSupabaseClient();
    let { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Auto-seed if database is empty
    if (!users || users.length === 0) {
      await supabase.from('users').insert(INITIAL_USERS);
      const reFetch = await supabase.from('users').select('*').order('name', { ascending: true });
      users = reFetch.data || [];
    }

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
