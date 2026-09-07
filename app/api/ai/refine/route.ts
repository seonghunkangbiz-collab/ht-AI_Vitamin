import { NextResponse } from 'next/server';
import { fetchAIRefinedPraise } from '@/lib/aiService';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Text parameter required' }, { status: 400 });
    }

    const refinedText = await fetchAIRefinedPraise(text);
    return NextResponse.json({ refinedText });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to refine praise' }, { status: 500 });
  }
}
