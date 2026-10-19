import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const adminAuth = await requireAdmin(request);
  if ('errorResponse' in adminAuth) {
    return adminAuth.errorResponse;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50));

  try {
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from('reveal_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data: logs, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logs: logs || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
