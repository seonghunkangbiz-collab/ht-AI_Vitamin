import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_NOTES } from '@/lib/seedData';

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseClient();
    let { data: notes, error } = await supabase
      .from('private_notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Auto-seed initial notes if empty
    if (!notes || notes.length === 0) {
      const { count } = await supabase.from('private_notes').select('*', { count: 'exact', head: true });
      if (count === 0) {
        await supabase.from('private_notes').insert(
          INITIAL_NOTES.map(n => ({
            id: n.id,
            user_id: n.userId,
            target_user_id: n.targetUserId,
            content: n.content,
            updated_at: n.updatedAt
          }))
        );
        const reFetch = await supabase
          .from('private_notes')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });
        notes = reFetch.data || [];
      }
    }

    // Format for frontend
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
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const { userId, targetUserId, content } = await request.json();
    if (!userId || !targetUserId) {
      return NextResponse.json({ error: 'userId and targetUserId required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    // Check if existing note exists for user_id + target_user_id
    const { data: existing } = await supabase
      .from('private_notes')
      .select('id')
      .eq('user_id', userId)
      .eq('target_user_id', targetUserId)
      .single();

    let noteId = existing?.id || `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const { data, error } = await supabase
      .from('private_notes')
      .upsert({
        id: noteId,
        user_id: userId,
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
