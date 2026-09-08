import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const { praiseId, userId } = await request.json();
    if (!praiseId || !userId) {
      return NextResponse.json({ error: 'praiseId and userId required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Fetch existing praise
    const { data: praise, error: fetchErr } = await supabase
      .from('praise_messages')
      .select('*')
      .eq('id', praiseId)
      .single();

    if (fetchErr || !praise) {
      return NextResponse.json({ error: 'Praise not found' }, { status: 404 });
    }

    const likedBy: string[] = praise.liked_by || [];
    const alreadyLiked = likedBy.includes(userId);

    let newLikedBy: string[];
    let newLikes: number;

    if (alreadyLiked) {
      newLikedBy = likedBy.filter(id => id !== userId);
      newLikes = Math.max(0, (praise.likes || 1) - 1);
    } else {
      newLikedBy = [...likedBy, userId];
      newLikes = (praise.likes || 0) + 1;
    }

    const { data: updated, error: updateErr } = await supabase
      .from('praise_messages')
      .update({
        likes: newLikes,
        liked_by: newLikedBy
      })
      .eq('id', praiseId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      praise: {
        id: updated.id,
        recipientUserId: updated.recipient_user_id,
        recipientName: updated.recipient_name,
        recipientTeam: updated.recipient_team,
        content: updated.content,
        refinedContent: updated.refined_content,
        likes: updated.likes,
        likedBy: updated.liked_by,
        isMatePraise: updated.is_mate_praise,
        createdAt: updated.created_at
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
