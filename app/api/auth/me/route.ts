import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getSupabaseServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ user: null });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, name, team, avatar, role')
      .eq('id', session.userId)
      .maybeSingle();

    if (!dbUser) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: dbUser.id,
        name: dbUser.name,
        team: dbUser.team,
        avatar: dbUser.avatar,
        role: dbUser.role
      }
    });
  } catch {
    return NextResponse.json({
      user: {
        id: session.userId,
        name: session.name,
        team: session.team,
        avatar: session.avatar,
        role: session.role
      }
    });
  }
}
