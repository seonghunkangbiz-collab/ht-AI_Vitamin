import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_USERS, INITIAL_MATE_ASSIGNMENTS, INITIAL_PRAISES, INITIAL_NOTES } from '@/lib/seedData';

export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const supabase = getSupabaseClient();

    // 1. Seed Users
    await supabase.from('users').upsert(INITIAL_USERS);

    // 2. Seed Mate Assignments
    await supabase.from('mate_assignments').upsert(
      INITIAL_MATE_ASSIGNMENTS.map(a => ({
        id: a.id,
        user_id: a.userId,
        target_user_id: a.targetUserId,
        assigned_at: a.assignedAt
      }))
    );

    // 3. Seed Praises
    await supabase.from('praise_messages').upsert(
      INITIAL_PRAISES.map(p => ({
        id: p.id,
        sender_user_id: p.senderUserId,
        recipient_user_id: p.recipientUserId,
        recipient_name: p.recipientName,
        recipient_team: p.recipientTeam,
        content: p.content,
        refined_content: p.refinedContent,
        likes: p.likes,
        liked_by: p.likedBy,
        is_mate_praise: p.isMatePraise,
        created_at: p.createdAt
      }))
    );

    // 4. Seed Notes
    await supabase.from('private_notes').upsert(
      INITIAL_NOTES.map(n => ({
        id: n.id,
        user_id: n.userId,
        target_user_id: n.targetUserId,
        content: n.content,
        updated_at: n.updatedAt
      }))
    );

    return NextResponse.json({ success: true, message: 'Supabase seed data loaded successfully!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
