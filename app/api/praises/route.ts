import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const isAdmin = searchParams.get('admin') === 'true';

  try {
    const supabase = getSupabaseServerClient();
    const { data: praises, error } = await supabase
      .from('praise_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format for frontend & STRICTLY STRIP sender_user_id for non-admin client security!
    const formatted = (praises || []).map(p => ({
      id: p.id,
      // CRITICAL ANONYMITY RULE: Strip sender_user_id for regular users
      senderUserId: isAdmin ? p.sender_user_id : undefined,
      recipientUserId: p.recipient_user_id,
      recipientName: p.recipient_name,
      recipientTeam: p.recipient_team,
      content: p.content,
      refinedContent: p.refined_content,
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

    const supabase = getSupabaseServerClient();

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
        isMatePraise: data.is_mate_praise,
        createdAt: data.created_at
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

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Praise message ID is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from('praise_messages')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
