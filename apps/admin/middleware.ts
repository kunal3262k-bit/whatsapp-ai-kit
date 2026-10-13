import { NextResponse, type NextRequest } from 'next/server';
import { isAuthorized, SESSION_COOKIE } from './lib/auth';

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  if (pathname === '/enter') return NextResponse.next();

  const secret = process.env.ADMIN_SESSION_SECRET;
  const authed = await isAuthorized(req.cookies.get(SESSION_COOKIE)?.value, secret);
  if (authed) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/__not_found__';
  return NextResponse.rewrite(url);
}

export const config = { matcher: ['/:path*'] };
