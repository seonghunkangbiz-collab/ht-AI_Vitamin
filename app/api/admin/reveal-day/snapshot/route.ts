import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { generateOfficialSnapshot } from '@/lib/reveal-day/snapshot';

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
  const eventId = searchParams.get('eventId') || 'event-live-20261028';

  try {
    const supabase = getSupabaseServerClient();
    const { data: snapshots, error } = await supabase
      .from('reveal_snapshots')
      .select('*')
      .eq('event_id', eventId)
      .order('version', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (snapshots || []).map(s => ({
      id: s.id,
      eventId: s.event_id,
      version: s.version,
      cutoffAt: s.cutoff_at,
      dataHash: s.data_hash,
      sourceUsersCount: s.source_users_count,
      sourcePraisesCount: s.source_praises_count,
      sourceNotesCount: s.source_notes_count,
      sourceMaxTimestamp: s.source_max_timestamp,
      statsPayload: s.stats_payload,
      createdBy: s.created_by,
      reason: s.reason,
      createdAt: s.created_at
    }));

    return NextResponse.json({ snapshots: formatted });
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

  const { session } = adminAuth;

  try {
    const { eventId, reason, forceNewVersion } = await request.json();
    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 });
    }

    const result = await generateOfficialSnapshot({
      eventId,
      adminId: session.userId,
      reason,
      forceNewVersion: Boolean(forceNewVersion)
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
