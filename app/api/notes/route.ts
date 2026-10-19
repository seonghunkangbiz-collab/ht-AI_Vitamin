import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const auth = requireAuth(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { session } = auth;
  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get('userId');

  // Prevent querying other users' private notes
  let targetUserId = session.userId;
  if (requestedUserId && requestedUserId !== session.userId) {
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'FORBIDDEN: Cannot view other users notes' }, { status: 403 });
    }
    targetUserId = requestedUserId;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data: notes, error } = await supabase
      .from('private_notes')
      .select('*')
      .eq('user_id', targetUserId)
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formattedNotes = (notes || []).map(n => ({
      id: n.id,
      userId: n.user_id,
      targetUserId: n.target_user_id,
      content: n.content,
      updatedAt: n.updated_at
    }));

    return NextResponse.json({ notes: formattedNotes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireAuth(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  const { session } = auth;

  try {
    const { targetUserId, content } = await request.json();
    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId required' }, { status: 400 });
    }

    // Force user_id to session.userId (prevent spoofing)
    const authorUserId = session.userId;

    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();

    // Check if existing note exists
    const { data: existing } = await supabase
      .from('private_notes')
      .select('id')
      .eq('user_id', authorUserId)
      .eq('target_user_id', targetUserId)
      .maybeSingle();

    const noteId = existing?.id || `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const { data, error } = await supabase
      .from('private_notes')
      .upsert({
        id: noteId,
        user_id: authorUserId,
        target_user_id: targetUserId,
        content: content || '',
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      note: {
        id: data.id,
        userId: data.user_id,
        targetUserId: data.target_user_id,
        content: data.content,
        updatedAt: data.updated_at
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
