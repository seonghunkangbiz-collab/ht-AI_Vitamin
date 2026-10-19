import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_USERS, INITIAL_MATE_ASSIGNMENTS, INITIAL_PRAISES, INITIAL_NOTES } from '@/lib/seedData';
import { requireAdmin } from '@/lib/auth/session';

export async function POST(request: Request) {
  const adminAuth = await requireAdmin(request);
  if ('errorResponse' in adminAuth) {
    return adminAuth.errorResponse;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const supabase = getSupabaseServerClient();

    // 1. Seed Users
    await supabase.from('users').upsert(INITIAL_USERS);

    // 2. Seed Mate Assignments
    if (INITIAL_MATE_ASSIGNMENTS.length > 0) {
      await supabase.from('mate_assignments').upsert(
        INITIAL_MATE_ASSIGNMENTS.map(a => ({
          id: a.id,
          user_id: a.userId,
          target_user_id: a.targetUserId,
          assigned_at: a.assignedAt
        }))
      );
    }

    // 3. Seed Praises
    if (INITIAL_PRAISES.length > 0) {
      await supabase.from('praise_messages').upsert(
        INITIAL_PRAISES.map(p => ({
          id: p.id,
          sender_user_id: p.senderUserId,
          recipient_user_id: p.recipientUserId,
          recipient_name: p.recipientName,
          recipient_team: p.recipientTeam,
          content: p.content,
          refined_content: p.refinedContent,
          likes: p.likes || 0,
          liked_by: p.likedBy || [],
          is_mate_praise: p.isMatePraise,
          created_at: p.createdAt
        }))
      );
    }

    // 4. Seed Notes
    if (INITIAL_NOTES.length > 0) {
      await supabase.from('private_notes').upsert(
        INITIAL_NOTES.map(n => ({
          id: n.id,
          user_id: n.userId,
          target_user_id: n.targetUserId,
          content: n.content,
          updated_at: n.updatedAt
        }))
      );
    }

    return NextResponse.json({ success: true, message: 'Supabase seed data loaded successfully!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
