import { NextResponse, type NextRequest } from 'next/server';
import { signSession, timingSafeEqualStr, SESSION_COOKIE, SESSION_TTL_MS } from '../../lib/auth';
import { notFoundResponse } from '../../lib/http';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const key = req.nextUrl.searchParams.get('key') ?? '';
  const expected = process.env.ADMIN_KEY;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!expected || !secret || !timingSafeEqualStr(key, expected)) {
    return notFoundResponse();
  }
  const res = NextResponse.redirect(new URL('/', req.url));
  res.cookies.set(SESSION_COOKIE, await signSession(Date.now() + SESSION_TTL_MS, secret), {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
  return res;
}
