'use client';

import { useCallback, useEffect, useState } from 'react';
import { ACTIVITY_LABELS, activityLevel, relativeTime, type ActivityLevel } from '../lib/bot-shared';
import type { BotActivity } from '../lib/bot';

const LEVEL_STYLE: Record<ActivityLevel, { dot: string; text: string; ring: string }> = {
  active: { dot: 'bg-emerald-400', text: 'text-emerald-300', ring: 'border-emerald-500/40' },
  idle: { dot: 'bg-amber-400', text: 'text-amber-300', ring: 'border-amber-500/40' },
  quiet: { dot: 'bg-zinc-500', text: 'text-zinc-300', ring: 'border-zinc-700' },
  none: { dot: 'bg-red-400', text: 'text-red-300', ring: 'border-red-500/40' },
};

export default function BotStatus({ initial }: { initial: BotActivity }) {
  const [data, setData] = useState<BotActivity>(initial);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bot-status', { cache: 'no-store' });
      if (res.ok) setData((await res.json()) as BotActivity);
    } catch {
      /* keep last known state */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [refresh]);

  const level = activityLevel(data.lastActivityAt);
  const style = LEVEL_STYLE[level];

  const counts: { label: string; value: number }[] = [
    { label: 'Leads', value: data.counts.leads },
    { label: 'Qualified', value: data.counts.qualified },
    { label: 'Messages', value: data.counts.messages },
    { label: 'Contacts', value: data.counts.contacts },
    { label: 'Open reminders', value: data.counts.remindersOpen },
  ];

  const events: { label: string; at: string | null }[] = [
    { label: 'Last message', at: data.lastMessageAt },
    { label: 'Last inbound', at: data.lastInboundAt },
    { label: 'Last lead', at: data.lastLeadAt },
  ];

  return (
    <div className="space-y-5">
      <section className={`rounded-xl border bg-zinc-900/60 p-5 ${style.ring}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`inline-block h-3 w-3 rounded-full ${style.dot}`} />
            <div>
              <div className={`text-lg font-semibold ${style.text}`}>{ACTIVITY_LABELS[level]}</div>
              <div className="text-sm text-zinc-500">
                Last activity {relativeTime(data.lastActivityAt)}
                {data.lastActivityAt ? ` · ${new Date(data.lastActivityAt).toLocaleString()}` : ''}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:border-brand hover:text-brand"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Derived from the bot&apos;s own writes (messages, inbound replies, leads) — no heartbeat required.
          Auto-refreshes every 15s.
        </p>
      </section>

      {!data.ok && (
        <section className="rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-300">
          Could not read activity: {data.error}
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {counts.map((c) => (
          <div key={c.label} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-2xl font-semibold text-zinc-100">{c.value.toLocaleString('en-IN')}</div>
            <div className="text-xs text-zinc-500">{c.label}</div>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-200">Recent signals</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {events.map((e) => (
            <div key={e.label}>
              <div className="text-xs text-zinc-500">{e.label}</div>
              <div className="text-sm text-zinc-200">{relativeTime(e.at)}</div>
              <div className="text-xs text-zinc-600">{e.at ? new Date(e.at).toLocaleString() : '—'}</div>
            </div>
          ))}
        </div>
      </section>

      {data.config.length > 0 && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-200">Runtime config</h2>
          <div className="flex flex-wrap gap-2">
            {data.config.map((c) => (
              <span key={c.key} className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
                {c.key}: <span className="text-zinc-100">{c.value}</span>
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
