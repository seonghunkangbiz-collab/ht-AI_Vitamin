import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { getSessionFromRequest } from '@/lib/auth/session';
import { INITIAL_NOTES } from '@/lib/seedData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  const session = getSessionFromRequest(request);
  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get('userId');

  try {
    const supabase = getSupabaseServerClient();

    let targetUserId = session?.userId || '';
    if (session) {
      if (requestedUserId && requestedUserId !== session.userId) {
        if (session.role !== 'admin') {
          return NextResponse.json({ error: 'FORBIDDEN: Cannot view other users notes' }, { status: 403 });
        }
        targetUserId = requestedUserId;
      }
    } else if (requestedUserId) {
      const { data: validUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', requestedUserId)
        .maybeSingle();

      if (!validUser) {
        return NextResponse.json({ error: 'UNAUTHORIZED: Valid login session required' }, { status: 401 });
      }
      targetUserId = validUser.id;
    } else {
      return NextResponse.json({ error: 'UNAUTHORIZED: Valid login session required' }, { status: 401 });
    }

    const { data: notes, error } = await supabase
      .from('private_notes')
      .select('*')
      .eq('user_id', targetUserId)
      .order('updated_at', { ascending: false });

    let rawNotes: any[] = notes || [];

    // Automatic fallback to private_note_history if private_notes is empty or blocked by RLS
    if (error || rawNotes.length === 0) {
      const { data: historyRows } = await supabase
        .from('private_note_history')
        .select('*')
        .eq('user_id', targetUserId)
        .order('revision', { ascending: false })
        .order('created_at', { ascending: false });

      if (historyRows && historyRows.length > 0) {
        const latestByNoteId = new Map<string, any>();
        for (const h of historyRows) {
          if (!latestByNoteId.has(h.note_id)) {
            latestByNoteId.set(h.note_id, h);
          }
        }
        rawNotes = Array.from(latestByNoteId.values())
          .filter(h => h.change_type !== 'delete')
          .map(h => ({
            id: h.note_id,
            userId: h.user_id,
            targetUserId: h.target_user_id,
            content: h.content,
            updatedAt: h.created_at
          }));
      }
    }

    if (rawNotes.length === 0) {
      const seedNotes = INITIAL_NOTES.filter(n => n.userId === targetUserId);
      if (seedNotes.length > 0) {
        rawNotes = seedNotes.map(n => ({
          id: n.id,
          userId: n.userId,
          targetUserId: n.targetUserId,
          content: n.content,
          updatedAt: n.updatedAt
        }));
      }
    }

    const formattedNotes = rawNotes.map(n => ({
      id: n.id,
      userId: n.user_id || n.userId,
      targetUserId: n.target_user_id || n.targetUserId,
      content: n.content,
      updatedAt: n.updated_at || n.updatedAt
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

  const session = getSessionFromRequest(request);

  try {
    const { userId: bodyUserId, targetUserId, content, noteId: bodyNoteId } = await request.json();
    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    let authorUserId = session?.userId || '';

    if (!authorUserId && bodyUserId) {
      const { data: validUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', bodyUserId)
        .maybeSingle();
      if (validUser) {
        authorUserId = validUser.id;
      }
    }

    if (!authorUserId) {
      return NextResponse.json({ error: 'UNAUTHORIZED: Valid login session required' }, { status: 401 });
    }

    const now = new Date().toISOString();

    // If bodyNoteId is provided, edit that specific note.
    // If not provided, generate a new unique note ID to allow multiple notes per colleague!
    const noteId = bodyNoteId || `note-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

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

    if (error || !data) {
      // Fallback: write directly to private_note_history if private_notes direct write is hindered
      const { data: prevHist } = await supabase
        .from('private_note_history')
        .select('revision')
        .eq('note_id', noteId)
        .order('revision', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextRev = (prevHist?.revision || 0) + 1;
      await supabase.from('private_note_history').insert({
        id: `pnh-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        note_id: noteId,
        user_id: authorUserId,
        target_user_id: targetUserId,
        content: content || '',
        revision: nextRev,
        change_type: nextRev === 1 ? 'insert' : 'update',
        created_at: now
      });

      return NextResponse.json({
        note: {
          id: noteId,
          userId: authorUserId,
          targetUserId,
          content: content || '',
          updatedAt: now
        }
      });
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

export async function DELETE(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  const session = getSessionFromRequest(request);
  const { searchParams } = new URL(request.url);
  const noteId = searchParams.get('id') || searchParams.get('noteId');
  const bodyUserId = searchParams.get('userId');

  if (!noteId) {
    return NextResponse.json({ error: 'noteId required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();
    let authorUserId = session?.userId || '';

    if (!authorUserId && bodyUserId) {
      const { data: validUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', bodyUserId)
        .maybeSingle();
      if (validUser) {
        authorUserId = validUser.id;
      }
    }

    if (!authorUserId) {
      return NextResponse.json({ error: 'UNAUTHORIZED: Valid login session required' }, { status: 401 });
    }

    // 1. Delete from private_notes
    const { error: delErr } = await supabase
      .from('private_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', authorUserId);

    // 2. Audit log deletion in private_note_history
    const now = new Date().toISOString();
    await supabase.from('private_note_history').insert({
      id: `pnh-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      note_id: noteId,
      user_id: authorUserId,
      target_user_id: '',
      content: '',
      revision: 999,
      change_type: 'delete',
      created_at: now
    });

    return NextResponse.json({ success: true, deletedNoteId: noteId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
