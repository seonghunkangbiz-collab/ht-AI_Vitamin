import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { runPreflightChecks } from '@/lib/reveal-day/preflight';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const adminAuth = await requireAdmin(request);
  if ('errorResponse' in adminAuth) {
    return adminAuth.errorResponse;
  }

  const { session } = adminAuth;
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId') || 'event-live-20261028';

  try {
    const report = await runPreflightChecks(eventId, session.userId);
    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
