'use client';

import { useEffect, useMemo, useState } from 'react';
import { SEED_BUSINESSES, PITCH_ANGLES, type Biz } from '../../lib/outreach';

const GOAL = 30000;
const SENT_KEY = 'wa-kit-sent';
const ADV_KEY = 'wa-kit-advances';

function toWa(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function parseCsv(text: string): Biz[] {
  const out: Biz[] = [];
  for (const line of text.split(/\r?\n/)) {
    const parts = line.split(',').map((p) => p.trim());
    if (parts.length < 4) continue;
    if (/name/i.test(parts[0]!) && /phone|number/i.test(line)) continue; // header
    out.push({ name: parts[0]!, category: parts[1] || 'business', area: parts[2] || '', phone: parts[3]! });
  }
  return out;
}

export default function OutreachPage() {
  const [biz, setBiz] = useState<Biz[]>(SEED_BUSINESSES);
  const [idx, setIdx] = useState(0);
  const [angleId, setAngleId] = useState(PITCH_ANGLES[0]!.id);
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [advances, setAdvances] = useState<{ label: string; amount: number }[]>([]);
  const [importText, setImportText] = useState('');
  const [advInput, setAdvInput] = useState('');

  useEffect(() => {
    try {
      setSent(JSON.parse(localStorage.getItem(SENT_KEY) || '{}'));
      setAdvances(JSON.parse(localStorage.getItem(ADV_KEY) || '[]'));
    } catch {
      /* ignore */
    }
  }, []);

  function persistSent(next: Record<string, boolean>) {
    setSent(next);
    localStorage.setItem(SENT_KEY, JSON.stringify(next));
  }
  function persistAdvances(next: { label: string; amount: number }[]) {
    setAdvances(next);
    localStorage.setItem(ADV_KEY, JSON.stringify(next));
  }

  const current = biz[idx];
  const angle = useMemo(() => PITCH_ANGLES.find((a) => a.id === angleId) ?? PITCH_ANGLES[0]!, [angleId]);
  const message = current ? angle.template(current) : '';
  const waLink = current ? `https://wa.me/${toWa(current.phone)}?text=${encodeURIComponent(message)}` : '#';

  const total = advances.reduce((s, a) => s + a.amount, 0);
  const pct = Math.min(100, Math.round((total / GOAL) * 100));

  function copy(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-bold">Outreach Accelerator</h1>
      <p className="mt-1 text-slate-600">
        Pick a business, choose a pitch angle, open WhatsApp with the message pre-filled. Send
        manually — max 15–20/day.
      </p>

      {/* Revenue tracker */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm text-slate-500">Advances collected</div>
            <div className="text-3xl font-bold">
              ₹{total.toLocaleString('en-IN')}{' '}
              <span className="text-base font-normal text-slate-400">/ ₹{GOAL.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <input
              value={advInput}
              onChange={(e) => setAdvInput(e.target.value)}
              placeholder="Client name"
              id="adv-label"
              className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              id="adv-amount"
              inputMode="numeric"
              placeholder="Amount ₹"
              className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              onClick={() => {
                const labelEl = document.getElementById('adv-label') as HTMLInputElement;
                const amtEl = document.getElementById('adv-amount') as HTMLInputElement;
                const amount = parseInt(amtEl.value.replace(/\D/g, ''), 10);
                if (amount > 0) {
                  persistAdvances([...advances, { label: labelEl.value.trim() || 'Client', amount }]);
                  labelEl.value = '';
                  amtEl.value = '';
                  setAdvInput('');
                }
              }}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Add advance
            </button>
          </div>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {pct}% to target • need ~{Math.max(0, Math.ceil((GOAL - total) / 8000))} more ₹8k deals
        </div>
        {advances.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {advances.map((a, i) => (
              <span key={i} className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-700">
                {a.label}: ₹{a.amount.toLocaleString('en-IN')}
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Business list */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Businesses ({biz.length})</h2>
            {sent && <span className="text-xs text-slate-400">{Object.values(sent).filter(Boolean).length} sent</span>}
          </div>
          <div className="mt-3 max-h-80 space-y-1 overflow-y-auto">
            {biz.map((b, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                  i === idx ? 'bg-brand/10 text-brand' : 'hover:bg-slate-50'
                }`}
              >
                <span>
                  <span className="font-medium">{b.name}</span>
                  <span className="block text-xs text-slate-400">
                    {b.category} • {b.area}
                  </span>
                </span>
                {sent[b.phone] && <span className="text-green-600">✓</span>}
              </button>
            ))}
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-slate-600">Import your ICP (CSV)</summary>
            <p className="mt-2 text-xs text-slate-400">One per line: name,category,area,phone</p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-lg border border-slate-300 p-2 text-xs"
              placeholder="Smile Dental,dental,Geeta Colony,9811..."
            />
            <button
              onClick={() => {
                const parsed = parseCsv(importText);
                if (parsed.length) {
                  setBiz(parsed);
                  setIdx(0);
                }
              }}
              className="mt-2 w-full rounded-lg border border-slate-300 py-1.5 text-xs font-medium hover:border-brand hover:text-brand"
            >
              Replace list with {parseCsv(importText).length || 0} rows
            </button>
          </details>
        </aside>

        {/* Composer */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {current ? (
            <>
              <div className="text-sm text-slate-500">Pitch angle</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {PITCH_ANGLES.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAngleId(a.id)}
                    title={a.description}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      a.id === angleId ? 'border-brand bg-brand text-white' : 'border-slate-300 hover:border-brand'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 text-sm text-slate-500">
                To <span className="font-medium text-slate-800">{current.name}</span> ({current.phone})
              </div>
              <textarea
                readOnly
                value={message}
                rows={6}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm"
              />

              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
                >
                  Open in WhatsApp Web →
                </a>
                <button
                  onClick={() => copy(message)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:border-brand hover:text-brand"
                >
                  Copy message
                </button>
                <button
                  onClick={() => persistSent({ ...sent, [current.phone]: true })}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:border-green-500 hover:text-green-600"
                >
                  {sent[current.phone] ? 'Marked sent ✓' : 'Mark as sent'}
                </button>
                <button
                  onClick={() => setIdx((i) => Math.min(biz.length - 1, i + 1))}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:border-brand hover:text-brand"
                >
                  Next →
                </button>
              </div>
            </>
          ) : (
            <p className="text-slate-500">Import a list to begin.</p>
          )}
        </section>
      </div>
    </main>
  );
}
