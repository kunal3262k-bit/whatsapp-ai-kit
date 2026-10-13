'use client';

import { useMemo, useState } from 'react';
import {
  LEAD_STATUSES,
  STATUS_LABELS,
  toCsv,
  type LeadStatus,
  type LeadView,
} from '../lib/leads';

const STATUS_STYLE: Record<LeadStatus, string> = {
  new: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  contacted: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  qualified: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  disqualified: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  human: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
};

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function matches(lead: LeadView, query: string): boolean {
  if (!query) return true;
  const haystack = [
    lead.name,
    lead.phone,
    lead.business,
    lead.need,
    lead.callTime,
    ...lead.extras.map((e) => `${e.key} ${e.value}`),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

export default function LeadsCrm({ leads }: { leads: LeadView[] }) {
  const [rows, setRows] = useState<LeadView[]>(leads);
  const [status, setStatus] = useState<'all' | LeadStatus>('all');
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromMs = from ? new Date(`${from}T00:00:00+05:30`).getTime() : null;
    const toMs = to ? new Date(`${to}T23:59:59+05:30`).getTime() : null;
    return rows.filter((lead) => {
      if (status !== 'all' && lead.status !== status) return false;
      if (!matches(lead, q)) return false;
      const at = new Date(lead.created_at).getTime();
      if (fromMs !== null && at < fromMs) return false;
      if (toMs !== null && at > toMs) return false;
      return true;
    });
  }, [rows, status, query, from, to]);

  const counts = useMemo(() => {
    const base: Record<LeadStatus, number> = {
      new: 0,
      contacted: 0,
      qualified: 0,
      disqualified: 0,
      human: 0,
    };
    for (const lead of rows) base[lead.status] += 1;
    return base;
  }, [rows]);

  async function updateStatus(id: number, next: LeadStatus) {
    const previous = rows;
    setSaving(id);
    setError(null);
    setRows((current) => current.map((l) => (l.id === id ? { ...l, status: next } : l)));
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string; hint?: string };
        throw new Error(body.hint ?? body.error ?? `Update failed (${res.status})`);
      }
    } catch (err) {
      setRows(previous);
      setError((err as Error).message);
    } finally {
      setSaving(null);
    }
  }

  function exportCsv() {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const inputClass =
    'rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-brand';

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(LEAD_STATUSES as readonly LeadStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(status === s ? 'all' : s)}
            className={`rounded-lg border px-3 py-2 text-left transition ${
              status === s ? 'border-brand/60 bg-brand/10' : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
            }`}
          >
            <div className="text-lg font-semibold text-zinc-100">{counts[s]}</div>
            <div className="text-xs text-zinc-400">{STATUS_LABELS[s]}</div>
          </button>
        ))}
      </section>

      <section className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
        <input
          className={`${inputClass} min-w-[12rem] flex-1`}
          placeholder="Search name, phone, need…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className={inputClass}
          value={status}
          onChange={(e) => setStatus(e.target.value as 'all' | LeadStatus)}
        >
          <option value="all">All statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <input type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="text-zinc-600">→</span>
        <input type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:border-brand hover:text-brand"
        >
          Export CSV
        </button>
        <span className="ml-auto text-xs text-zinc-500">
          {filtered.length} / {rows.length}
        </span>
      </section>

      {error && (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}

      <section className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-medium">Created</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Phone</th>
              <th className="px-3 py-2 font-medium">Business</th>
              <th className="px-3 py-2 font-medium">Need</th>
              <th className="px-3 py-2 font-medium">Call Time</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-zinc-500" colSpan={8}>
                  No leads match these filters.
                </td>
              </tr>
            )}
            {filtered.map((lead) => (
              <tr key={lead.id} className="hover:bg-zinc-900/50">
                <td className="whitespace-nowrap px-3 py-2 text-zinc-400">{DATE_FMT.format(new Date(lead.created_at))}</td>
                <td className="px-3 py-2 font-medium text-zinc-100">{lead.name ?? '—'}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-300">{lead.phone}</span>
                    {lead.wa && (
                      <a
                        href={lead.wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded border border-emerald-500/40 px-1.5 py-0.5 text-xs text-emerald-300 hover:bg-emerald-500/10"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-zinc-300">{lead.business ?? '—'}</td>
                <td className="px-3 py-2 text-zinc-300">{lead.need ?? '—'}</td>
                <td className="px-3 py-2 text-zinc-300">{lead.callTime ?? '—'}</td>
                <td className="px-3 py-2">
                  <select
                    value={lead.status}
                    disabled={saving === lead.id}
                    onChange={(e) => updateStatus(lead.id, e.target.value as LeadStatus)}
                    className={`rounded-md border px-2 py-1 text-xs font-medium outline-none ${STATUS_STYLE[lead.status]}`}
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-zinc-900 text-zinc-100">
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-xs text-zinc-500">
                  {lead.extras.length === 0
                    ? '—'
                    : lead.extras.map((e) => `${e.key}: ${e.value}`).join(' · ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
