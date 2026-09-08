import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('app_state')
      .select('value')
      .eq('key', 'reveal_active')
      .single();

    if (error || !data) {
      return NextResponse.json({ isRevealActive: false });
    }

    return NextResponse.json({ isRevealActive: Boolean(data.value?.active) });
  } catch (err: any) {
    return NextResponse.json({ isRevealActive: false });
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const { active } = await request.json();
    const supabase = getSupabaseServerClient();

    const { error } = await supabase
      .from('app_state')
      .upsert({
        key: 'reveal_active',
        value: { active: Boolean(active) }
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ isRevealActive: Boolean(active) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
