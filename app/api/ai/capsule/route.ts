import { NextResponse } from 'next/server';
import { fetchAITimeCapsule } from '@/lib/aiService';
import { requireAuth } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  const auth = requireAuth(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

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
