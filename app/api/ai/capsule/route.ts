import { NextResponse } from 'next/server';
import { fetchAITimeCapsule } from '@/lib/aiService';

export async function POST(request: Request) {
  try {
    const { recipientName, praises } = await request.json();
    if (!recipientName) {
      return NextResponse.json({ error: 'recipientName parameter required' }, { status: 400 });
    }

    const timeCapsule = await fetchAITimeCapsule(recipientName, praises || []);
    return NextResponse.json(timeCapsule);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate AI time capsule' }, { status: 500 });
  }
}
