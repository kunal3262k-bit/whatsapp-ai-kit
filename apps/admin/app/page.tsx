import { notFound } from 'next/navigation';
import LeadsCrm from '../components/LeadsCrm';
import { toLeadView, type RawLead } from '../lib/leads';
import { requireAdmin } from '../lib/session';
import { getServiceClient } from '../lib/supabase';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  if (!(await requireAdmin())) notFound();

  const sb = getServiceClient();
  if (!sb) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="text-2xl font-bold text-zinc-100">Leads CRM</h1>
        <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 text-amber-200">
          <p className="font-medium">Supabase not configured.</p>
          <p className="mt-2 text-sm">
            Set <code>SUPABASE_URL</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code>, and run{' '}
            <code>apps/bot/supabase/schema.sql</code> in the Supabase SQL editor.
          </p>
        </div>
      </main>
    );
  }

  const { data, error } = await sb
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  const leads = ((data ?? []) as RawLead[]).map((lead) => toLeadView(lead));

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Leads CRM</h1>
          <p className="text-sm text-zinc-500">
            Latest {leads.length} leads · Asia/Kolkata · statuses sync to Supabase
          </p>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error.message}
        </div>
      )}

      <LeadsCrm leads={leads} />
    </main>
  );
}
