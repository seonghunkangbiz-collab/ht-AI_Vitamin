import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_PRAISES, INITIAL_MATE_ASSIGNMENTS } from '@/lib/seedData';

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const isAdmin = searchParams.get('admin') === 'true';

  try {
    const supabase = getSupabaseClient();
    let { data: praises, error } = await supabase
      .from('praise_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Auto-seed initial praises if DB table is empty
    if (!praises || praises.length === 0) {
      const { count } = await supabase.from('praise_messages').select('*', { count: 'exact', head: true });
      if (count === 0) {
        await supabase.from('praise_messages').insert(
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
        const reFetch = await supabase
          .from('praise_messages')
          .select('*')
          .order('created_at', { ascending: false });
        praises = reFetch.data || [];
      }
    }

    // Format for frontend & STRIP sender_user_id for non-admin client security!
    const formatted = (praises || []).map(p => ({
      id: p.id,
      // CRITICAL SECURITY RULE: Strip sender_user_id for regular users
      senderUserId: isAdmin ? p.sender_user_id : undefined,
      recipientUserId: p.recipient_user_id,
      recipientName: p.recipient_name,
      recipientTeam: p.recipient_team,
      content: p.content,
      refinedContent: p.refined_content,
      likes: p.likes || 0,
      likedBy: p.liked_by || [],
      isMatePraise: p.is_mate_praise || false,
      createdAt: p.created_at
    }));

    return NextResponse.json({ praises: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const { senderUserId, recipientUserId, recipientName, recipientTeam, content, refinedContent } = await request.json();

    if (!senderUserId || !recipientUserId || !content) {
      return NextResponse.json({ error: 'Missing required praise fields' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Check if senderUserId has targetUserId as a Mystery Mate in mate_assignments
    const { data: mateCheck } = await supabase
      .from('mate_assignments')
      .select('id')
      .eq('user_id', senderUserId)
      .eq('target_user_id', recipientUserId);

    const isMatePraise = (mateCheck && mateCheck.length > 0) || false;

    const newId = `praise-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('praise_messages')
      .insert({
        id: newId,
        sender_user_id: senderUserId,
        recipient_user_id: recipientUserId,
        recipient_name: recipientName,
        recipient_team: recipientTeam || '',
        content,
        refined_content: refinedContent || content,
        likes: 0,
        liked_by: [],
        is_mate_praise: isMatePraise,
        created_at: now
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      praise: {
        id: data.id,
        recipientUserId: data.recipient_user_id,
        recipientName: data.recipient_name,
        recipientTeam: data.recipient_team,
        content: data.content,
        refinedContent: data.refined_content,
        likes: data.likes,
        likedBy: data.liked_by,
        isMatePraise: data.is_mate_praise,
        createdAt: data.created_at
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
