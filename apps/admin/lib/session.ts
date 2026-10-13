import { cookies } from 'next/headers';
import { isAuthorized, SESSION_COOKIE } from './auth';

/**
 * Defense-in-depth auth for server components and route handlers. The edge
 * middleware is the primary gate; this guards against matcher mistakes and
 * direct handler access. Always returns `false` when the secret is unset.
 */
export async function requireAdmin(): Promise<boolean> {
  const store = await cookies();
  return isAuthorized(store.get(SESSION_COOKIE)?.value, process.env.ADMIN_SESSION_SECRET);
}
