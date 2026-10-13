import { NextResponse } from 'next/server';
import { isLeadStatus } from '../../../lib/leads';
import { requireAdmin } from '../../../lib/session';
import { getServiceClient } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

/** Read-only JSON feed of leads (handy for the outreach tool or integrations). */
export async function GET() {
  if (!(await requireAdmin())) return new NextResponse('Not Found', { status: 404 });

  const sb = getServiceClient();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const { data, error } = await sb
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ count: data?.length ?? 0, leads: data ?? [] });
}

/** Update a lead's CRM status. Body: { id: number, status: LeadStatus }. */
export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return new NextResponse('Not Found', { status: 404 });

  const sb = getServiceClient();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  let body: { id?: unknown; status?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'A valid numeric id is required' }, { status: 400 });
  }
  if (!isLeadStatus(body.status)) {
    return NextResponse.json({ error: 'Unknown status' }, { status: 400 });
  }

  // Only the CRM status changes here; `qualified` is the bot's original record.
  const { data, error } = await sb
    .from('leads')
    .update({ status: body.status })
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) {
    const hint =
      /status/i.test(error.message) && /column|schema cache/i.test(error.message)
        ? 'Run the latest apps/bot/supabase/schema.sql to add the leads.status column.'
        : undefined;
    return NextResponse.json({ error: error.message, hint }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  return NextResponse.json({ lead: data });
}
