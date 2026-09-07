import { NextResponse } from 'next/server';
import { fetchAISuggestion } from '@/lib/aiService';

export async function GET() {
  try {
    const suggestion = await fetchAISuggestion();
    return NextResponse.json({ suggestion });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch suggestion' }, { status: 500 });
  }
}
