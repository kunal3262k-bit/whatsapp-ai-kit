import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const chosen = req.cookies.get('akra_country')?.value;
  const geo = req.geo?.country ?? req.headers.get('x-vercel-ip-country') ?? '';
  const country = chosen || geo;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-akra-country', country);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
