import { NextResponse, type NextRequest } from 'next/server';
import { isAuthorized, timingSafeEqualStr, SESSION_COOKIE } from './lib/auth';
import { notFoundResponse } from './lib/http';

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // The secret entry path is only reachable with the correct key; anything
  // else (any method, wrong or missing key) gets the identical 404.
  if (pathname === '/enter') {
    const key = req.nextUrl.searchParams.get('key') ?? '';
    const expected = process.env.ADMIN_KEY;
    if (expected && timingSafeEqualStr(key, expected)) return NextResponse.next();
    return notFoundResponse();
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  const authed = await isAuthorized(req.cookies.get(SESSION_COOKIE)?.value, secret);
  if (authed) return NextResponse.next();

  return notFoundResponse();
}

export const config = { matcher: ['/:path*'] };
