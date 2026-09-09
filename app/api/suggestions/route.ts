import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { AISuggestion } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_SUGGESTIONS: AISuggestion[] = [
  { id: 'sug-01', content: '이번 주에는 다른 팀 동료 한 명에게 "고마웠던 점" 한 가지를 이야기해보세요.' },
  { id: 'sug-02', content: '다른 팀 동료와 커피 한잔 해보세요.' },
  { id: 'sug-03', content: '회의에서 좋은 의견을 먼저 인정해 보세요.' },
  { id: 'sug-04', content: '도움을 받았다면 짧게 감사해 보세요.' },
  { id: 'sug-05', content: 'Mystery Mate가 아니어도 좋은 점을 발견하면 응원해 보세요.' },
  { id: 'sug-06', content: '점심시간에 평소 이야기하지 않았던 동료와 대화해 보세요.' },
  { id: 'sug-07', content: '누군가의 장점을 발견하면 Vitamin Thanks를 남겨보세요.' },
];

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ suggestions: DEFAULT_SUGGESTIONS });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('app_state')
      .select('value')
      .eq('key', 'ai_suggestions')
      .maybeSingle();

    if (error || !data || !data.value || !Array.isArray(data.value) || data.value.length === 0) {
      return NextResponse.json({ suggestions: DEFAULT_SUGGESTIONS });
    }

    return NextResponse.json({ suggestions: data.value });
  } catch (err: any) {
    return NextResponse.json({ suggestions: DEFAULT_SUGGESTIONS });
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const { suggestions } = await request.json();
    if (!Array.isArray(suggestions)) {
      return NextResponse.json({ error: 'Suggestions array required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from('app_state')
      .upsert({
        key: 'ai_suggestions',
        value: suggestions
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, suggestions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
