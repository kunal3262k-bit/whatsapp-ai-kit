import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

/**
 * Read-only Supabase client for the dashboard (anon key + RLS read policies).
 * Returns null when the env vars are not set, so the UI can show a setup hint.
 */
export function getAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!cached) cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

/**
 * Server-only Supabase client using the service-role key (bypasses RLS).
 * Used by route handlers (e.g. /api/subscribe). Returns null when unset.
 * Never import this into a client component.
 */
export function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
