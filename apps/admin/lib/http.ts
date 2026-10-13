import { NextResponse } from 'next/server';

/**
 * A fixed, self-contained body so that EVERY unauthenticated path/method
 * returns a byte-identical 404. It must not reference the app's own routes or
 * `/_next` assets (those are themselves gated), otherwise the response would
 * vary by path or fail to render. Shared by the middleware gate and the
 * `/enter` handler so their 404s are indistinguishable.
 */
export const NOT_FOUND_HTML =
  '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">' +
  '<meta name="robots" content="noindex"><title>404 Not Found</title></head>' +
  '<body><h1>404 Not Found</h1></body></html>';

export function notFoundResponse(): NextResponse {
  return new NextResponse(NOT_FOUND_HTML, {
    status: 404,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  });
}
