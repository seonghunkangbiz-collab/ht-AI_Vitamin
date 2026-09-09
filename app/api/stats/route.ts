import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { ActivityStats } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_REVEAL_DATE = '2026-10-23';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const now = new Date();

    // 1. Fetch Praises Count & Date Filtering
    const { data: praises } = await supabase.from('praise_messages').select('created_at');
    const totalPraiseCount = praises?.length || 0;

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const weeklyPraiseCount = (praises || []).filter(p => new Date(p.created_at) >= sevenDaysAgo).length;
    const recentPraiseCount = (praises || []).filter(p => new Date(p.created_at) >= threeDaysAgo).length;

    // 2. Fetch Users Count (excluding admin)
    const { count: totalUserCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .neq('role', 'admin');

    // 3. Fetch Private Notes Count
    const { count: totalNoteCount } = await supabase
      .from('private_notes')
      .select('*', { count: 'exact', head: true });

    // 4. Fetch App State (reveal_date & wall_view_count)
    const { data: revealDateRow } = await supabase
      .from('app_state')
      .select('value')
      .eq('key', 'reveal_date')
      .maybeSingle();

    const revealDate = revealDateRow?.value?.date || DEFAULT_REVEAL_DATE;

    const { data: wallViewRow } = await supabase
      .from('app_state')
      .select('value')
      .eq('key', 'wall_view_count')
      .maybeSingle();

    const wallViewCount = wallViewRow?.value?.count || 0;

    // Calculate D-Day
    const targetDate = new Date(revealDate);
    const diffTime = targetDate.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const revealDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const stats: ActivityStats = {
      weeklyPraiseCount,
      totalPraiseCount,
      recentPraiseCount,
      totalUserCount: totalUserCount || 24,
      totalNoteCount: totalNoteCount || 0,
      wallViewCount,
      revealDate,
      revealDaysLeft
    };

    return NextResponse.json({ stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const { action, revealDate } = await request.json();
    const supabase = getSupabaseServerClient();

    if (action === 'set_reveal_date') {
      if (!revealDate) {
        return NextResponse.json({ error: 'revealDate parameter required' }, { status: 400 });
      }

      await supabase.from('app_state').upsert({
        key: 'reveal_date',
        value: { date: revealDate }
      });

      return NextResponse.json({ success: true, revealDate });
    }

    if (action === 'increment_wall_view') {
      const { data } = await supabase
        .from('app_state')
        .select('value')
        .eq('key', 'wall_view_count')
        .maybeSingle();

      const currentCount = data?.value?.count || 0;
      await supabase.from('app_state').upsert({
        key: 'wall_view_count',
        value: { count: currentCount + 1 }
      });

      return NextResponse.json({ success: true, count: currentCount + 1 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
