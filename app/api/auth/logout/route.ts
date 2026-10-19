import { NextResponse } from 'next/server';
import { createClearSessionCookie } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.headers.set('Set-Cookie', createClearSessionCookie());
  return response;
}
