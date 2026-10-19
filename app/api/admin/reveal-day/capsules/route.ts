import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { pregenerateAllTimeCapsules } from '@/lib/reveal-day/capsule';
import { REHEARSAL_TIME_CAPSULES } from '@/lib/reveal-day/rehearsal-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const adminAuth = await requireAdmin(request);
  if ('errorResponse' in adminAuth) {
    return adminAuth.errorResponse;
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId') || 'event-live-20261028';

  if (eventId.includes('rehearsal')) {
    return NextResponse.json({ capsules: REHEARSAL_TIME_CAPSULES });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data: capsules, error } = await supabase
      .from('reveal_time_capsules')
      .select('*')
      .order('recipient_name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (capsules || []).map(c => ({
      id: c.id,
      userId: c.user_id,
      recipientName: c.recipient_name,
      recipientTeam: c.recipient_team,
      keywords: c.keywords,
      analysis: c.analysis,
      letter: c.letter,
      approvalStatus: c.approval_status,
      sourceHash: c.source_hash,
      isSpotlight: c.is_spotlight,
      generationMethod: c.generation_method,
      reviewedBy: c.reviewed_by,
      reviewedAt: c.reviewed_at,
      createdAt: c.created_at
    }));

    return NextResponse.json({ capsules: formatted });
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
    const body = await request.json();
    const { action } = body;

    if (action === 'pregenerate') {
      const result = await pregenerateAllTimeCapsules(session.userId);
      return NextResponse.json({ success: true, ...result });
    }

    if (action === 'update') {
      const { capsuleId, approvalStatus, isSpotlight, letter, analysis, keywords } = body;
      if (!capsuleId) {
        return NextResponse.json({ error: 'capsuleId required' }, { status: 400 });
      }

      const supabase = getSupabaseServerClient();
      const updates: any = {
        reviewed_by: session.userId,
        reviewed_at: new Date().toISOString()
      };

      if (approvalStatus) updates.approval_status = approvalStatus;
      if (typeof isSpotlight === 'boolean') updates.is_spotlight = isSpotlight;
      if (letter) updates.letter = letter;
      if (analysis) updates.analysis = analysis;
      if (Array.isArray(keywords)) updates.keywords = keywords;

      const { data, error } = await supabase
        .from('reveal_time_capsules')
        .update(updates)
        .eq('id', capsuleId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, capsule: data });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
