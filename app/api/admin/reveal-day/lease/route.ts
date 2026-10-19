import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { manageControllerLease } from '@/lib/reveal-day/state-machine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  const adminAuth = await requireAdmin(request);
  if ('errorResponse' in adminAuth) {
    return adminAuth.errorResponse;
  }

  const { session } = adminAuth;

  try {
    const { eventId, action } = await request.json();
    if (!eventId || !['acquire', 'heartbeat', 'release', 'takeover'].includes(action)) {
      return NextResponse.json({ error: 'Valid eventId and action required' }, { status: 400 });
    }

    const result = await manageControllerLease(
      eventId,
      session.userId,
      session.name,
      action
    );

    if (result.conflict) {
      return NextResponse.json({
        conflict: true,
        currentController: result.currentController
      }, { status: 409 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
