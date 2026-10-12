import { getAdminClient } from '../lib/supabase';
import EnableNotifications from './enable-notifications';

export const dynamic = 'force-dynamic';

interface Lead {
  id: number;
  name: string | null;
  phone: string;
  fields: Record<string, string>;
  qualified: boolean;
  created_at: string;
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}

export default async function HomePage() {
  const sb = getAdminClient();

  if (!sb) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="text-2xl font-bold">WhatsApp AI Kit — Dashboard</h1>
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900">
          <p className="font-medium">Supabase not configured.</p>
          <p className="mt-2 text-sm">
            Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env</code>, and run{' '}
            <code>apps/bot/supabase/schema.sql</code> in the Supabase SQL editor.
          </p>
        </div>
      </main>
    );
  }

  const { data: leads } = await sb
    .from('leads')
    .select('id,name,phone,fields,qualified,created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  const { count: totalContacts } = await sb
    .from('contacts')
    .select('jid', { count: 'exact', head: true });

  const rows = (leads ?? []) as Lead[];
  const qualified = rows.filter((l) => l.qualified).length;
  const dayAgo = Date.now() - 24 * 3600 * 1000;
  const last24 = rows.filter((l) => new Date(l.created_at).getTime() >= dayAgo).length;

  const allKeys = Array.from(new Set(rows.flatMap((l) => Object.keys(l.fields ?? {}))));

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Leads Dashboard</h1>
        <div className="flex items-center gap-3">
          <EnableNotifications />
          <a href="/offer" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
            View offer page →
          </a>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total leads" value={rows.length} />
        <Stat label="Qualified" value={qualified} />
        <Stat label="Last 24h" value={last24} />
        <Stat label="Conversations" value={totalContacts ?? 0} />
      </section>

      <section className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {allKeys.map((k) => (
                <th key={k} className="px-4 py-3 font-medium capitalize">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={4 + allKeys.length}>
                  No leads yet. Send a message to the connected WhatsApp number to test.
                </td>
              </tr>
            )}
            {rows.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {new Date(l.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </td>
                <td className="px-4 py-3">{l.name ?? '—'}</td>
                <td className="whitespace-nowrap px-4 py-3">{l.phone}</td>
                <td className="px-4 py-3">
                  {l.qualified ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Qualified
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      New
                    </span>
                  )}
                </td>
                {allKeys.map((k) => (
                  <td key={k} className="px-4 py-3 text-slate-700">
                    {l.fields?.[k] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
