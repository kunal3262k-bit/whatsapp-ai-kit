import { NextResponse } from 'next/server';
import { getAdminClient } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

/** Read-only JSON feed of leads (handy for the outreach tool or integrations). */
export async function GET() {
  const sb = getAdminClient();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const { data, error } = await sb
    .from('leads')
    .select('id,name,phone,fields,qualified,created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ count: data?.length ?? 0, leads: data ?? [] });
}
