import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_USERS } from '@/lib/seedData';
import { requireAdmin, getSessionFromRequest } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const session = getSessionFromRequest(request);
    const isAdmin = session?.role === 'admin';

    const supabase = getSupabaseServerClient();
    let { data: users, error } = await supabase
      .from('users')
      .select('id, name, team, avatar, role' + (isAdmin ? ', code' : ''))
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Auto-seed or sync initial users
    let rawUsers: any[] = (users || []) as any[];
    if (rawUsers.length === 0) {
      await supabase.from('users').upsert(INITIAL_USERS);
      const reFetch = await supabase
        .from('users')
        .select('id, name, team, avatar, role' + (isAdmin ? ', code' : ''))
        .order('name', { ascending: true });
      rawUsers = (reFetch.data || []) as any[];
    } else {
      // Check if new seed members (e.g. user-25, user-26) need to be synced
      const existingIds = new Set(rawUsers.map(u => u.id));
      const missingUsers = INITIAL_USERS.filter(u => !existingIds.has(u.id));
      if (missingUsers.length > 0) {
        await supabase.from('users').upsert(missingUsers);
        const reFetch = await supabase
          .from('users')
          .select('id, name, team, avatar, role' + (isAdmin ? ', code' : ''))
          .order('name', { ascending: true });
        rawUsers = (reFetch.data || []) as any[];
      }
    }

    // STRICT SANITIZATION: Never leak admin accounts or login credentials to regular users
    const filteredUsers = isAdmin ? rawUsers : rawUsers.filter(u => u.role !== 'admin');
    const safeUsers = filteredUsers.map(u => ({
      id: u.id,
      name: u.name,
      team: u.team,
      avatar: u.avatar,
      role: u.role,
      ...(isAdmin ? { code: u.code } : {})
    }));

    return NextResponse.json({ users: safeUsers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const adminAuth = await requireAdmin(request);
  if ('errorResponse' in adminAuth) {
    return adminAuth.errorResponse;
  }

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
      .select('id, name, team, avatar, role');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: data.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
