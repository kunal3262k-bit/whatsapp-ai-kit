'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  PITCH_ANGLES,
  SEED_BUSINESSES,
  TRACK_LABELS,
  TRACK_STATUSES,
  parseProspectCsv,
  trackerTotal,
  waLinkFor,
  type Biz,
  type TrackEntry,
  type TrackStatus,
} from '../lib/outreach';

const GOAL = 30000;
const LIST_KEY = 'akra-outreach-list';
const TRACK_KEY = 'akra-outreach-track';
const ADV_KEY = 'akra-outreach-advances';

type Advance = { label: string; amount: number };

const STATUS_STYLE: Record<TrackStatus, string> = {
  new: 'border-zinc-700 text-zinc-300',
  sent: 'border-sky-500/40 text-sky-300',
  replied: 'border-violet-500/40 text-violet-300',
  call: 'border-amber-500/40 text-amber-300',
  won: 'border-emerald-500/40 text-emerald-300',
  lost: 'border-rose-500/40 text-rose-300',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function OutreachBoard() {
  const [biz, setBiz] = useState<Biz[]>(SEED_BUSINESSES);
  const [idx, setIdx] = useState(0);
  const [angleId, setAngleId] = useState(PITCH_ANGLES[0]!.id);
  const [track, setTrack] = useState<Record<string, TrackEntry>>({});
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [importText, setImportText] = useState('');
  const [advLabel, setAdvLabel] = useState('');
  const [advAmount, setAdvAmount] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setBiz(load(LIST_KEY, SEED_BUSINESSES));
    setTrack(load(TRACK_KEY, {}));
    setAdvances(load(ADV_KEY, []));
  }, []);

  function persistTrack(next: Record<string, TrackEntry>) {
    setTrack(next);
    localStorage.setItem(TRACK_KEY, JSON.stringify(next));
  }
  function persistAdvances(next: Advance[]) {
    setAdvances(next);
    localStorage.setItem(ADV_KEY, JSON.stringify(next));
  }

  const current = biz[idx];
  const angle = useMemo(() => PITCH_ANGLES.find((a) => a.id === angleId) ?? PITCH_ANGLES[0]!, [angleId]);
  const message = current ? angle.template(current) : '';
  const waLink = current ? waLinkFor(current.phone, message) : '#';
  const currentStatus: TrackStatus = (current && track[current.phone]?.status) || 'new';

  const total = advances.reduce((s, a) => s + a.amount, 0) + trackerTotal(track);
  const pct = Math.min(100, Math.round((total / GOAL) * 100));
  const dealsLeft = Math.max(0, Math.ceil((GOAL - total) / 8000));

  const pipeline = useMemo(() => {
    const base: Record<TrackStatus, number> = { new: 0, sent: 0, replied: 0, call: 0, won: 0, lost: 0 };
    for (const b of biz) base[track[b.phone]?.status ?? 'new'] += 1;
    return base;
  }, [biz, track]);

  function setStatus(status: TrackStatus) {
    if (!current) return;
    persistTrack({ ...track, [current.phone]: { ...track[current.phone], status } });
  }

  function addAdvance() {
    const amount = parseInt(advAmount.replace(/\D/g, ''), 10);
    if (amount > 0) {
      persistAdvances([...advances, { label: advLabel.trim() || 'Client', amount }]);
      setAdvLabel('');
      setAdvAmount('');
    }
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {}
    );
  }

  const input =
    'rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-brand';

  return (
    <div className="space-y-4">
      {/* Revenue tracker */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs text-zinc-500">Advances collected</div>
            <div className="text-2xl font-bold text-zinc-100">
              ₹{total.toLocaleString('en-IN')}{' '}
              <span className="text-sm font-normal text-zinc-500">/ ₹{GOAL.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <input className={input} value={advLabel} onChange={(e) => setAdvLabel(e.target.value)} placeholder="Client name" />
            <input
              className={`${input} w-28`}
              value={advAmount}
              inputMode="numeric"
              onChange={(e) => setAdvAmount(e.target.value)}
              placeholder="Amount ₹"
            />
            <button
              type="button"
              onClick={addAdvance}
              className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-brand-dark"
            >
              Add advance
            </button>
          </div>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          {pct}% to target • need ~{dealsLeft} more ₹8k deals
        </div>
        {advances.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {advances.map((a, i) => (
              <button
                key={i}
                type="button"
                title="Remove"
                onClick={() => persistAdvances(advances.filter((_, j) => j !== i))}
                className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs text-emerald-300 hover:border-rose-500/40 hover:text-rose-300"
              >
                {a.label}: ₹{a.amount.toLocaleString('en-IN')} ✕
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Pipeline summary */}
      <section className="flex flex-wrap gap-2">
        {TRACK_STATUSES.map((s) => (
          <span key={s} className={`rounded-md border px-2.5 py-1 text-xs ${STATUS_STYLE[s]}`}>
            {TRACK_LABELS[s]} · {pipeline[s]}
          </span>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        {/* Business list */}
        <aside className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">Businesses ({biz.length})</h2>
            <span className="text-xs text-zinc-500">
              {Object.values(track).filter((t) => t.status && t.status !== 'new').length} touched
            </span>
          </div>
          <div className="mt-3 max-h-80 space-y-1 overflow-y-auto">
            {biz.map((b, i) => {
              const st = track[b.phone]?.status ?? 'new';
              return (
                <button
                  key={`${b.phone}-${i}`}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                    i === idx ? 'bg-brand/10 text-brand' : 'text-zinc-300 hover:bg-zinc-800/60'
                  }`}
                >
                  <span>
                    <span className="font-medium">{b.name}</span>
                    <span className="block text-xs text-zinc-500">
                      {b.category} • {b.area}
                    </span>
                  </span>
                  <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase ${STATUS_STYLE[st]}`}>
                    {TRACK_LABELS[st]}
                  </span>
                </button>
              );
            })}
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-zinc-400">Import your ICP (CSV)</summary>
            <p className="mt-2 text-xs text-zinc-500">One per line: name,category,area,phone</p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={3}
              className={`${input} mt-2 w-full font-mono text-xs`}
              placeholder="Smile Dental,dental,Geeta Colony,9811…"
            />
            <button
              type="button"
              onClick={() => {
                const parsed = parseProspectCsv(importText);
                if (parsed.length) {
                  setBiz(parsed);
                  setIdx(0);
                  localStorage.setItem(LIST_KEY, JSON.stringify(parsed));
                }
              }}
              className="mt-2 w-full rounded-md border border-zinc-700 py-1.5 text-xs font-medium text-zinc-300 hover:border-brand hover:text-brand"
            >
              Replace list with {parseProspectCsv(importText).length || 0} rows
            </button>
          </details>
        </aside>

        {/* Composer */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          {current ? (
            <>
              <div className="text-xs text-zinc-500">Pitch angle</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {PITCH_ANGLES.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAngleId(a.id)}
                    title={a.description}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      a.id === angleId
                        ? 'border-brand bg-brand text-zinc-950'
                        : 'border-zinc-700 text-zinc-300 hover:border-brand'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 text-sm text-zinc-400">
                To <span className="font-medium text-zinc-100">{current.name}</span> ({current.phone}) ·{' '}
                {current.category} · {current.area}
              </div>
              <textarea
                readOnly
                value={message}
                rows={6}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-200"
              />

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-95"
                >
                  Open in WhatsApp →
                </a>
                <button
                  type="button"
                  onClick={() => copy(message)}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-brand hover:text-brand"
                >
                  {copied ? 'Copied ✓' : 'Copy message'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatus('sent');
                    setIdx((i) => Math.min(biz.length - 1, i + 1));
                  }}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-sky-500/60 hover:text-sky-300"
                >
                  Mark sent → next
                </button>
              </div>

              <div className="mt-4 border-t border-zinc-800 pt-3">
                <div className="text-xs text-zinc-500">Pipeline status</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TRACK_STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`rounded-md border px-2.5 py-1 text-xs ${
                        currentStatus === s ? STATUS_STYLE[s] + ' bg-zinc-800/60' : 'border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {TRACK_LABELS[s]}
                    </button>
                  ))}
                </div>
                <input
                  className={`${input} mt-3 w-full`}
                  placeholder="Notes (optional)"
                  value={track[current.phone]?.notes ?? ''}
                  onChange={(e) =>
                    persistTrack({ ...track, [current.phone]: { ...track[current.phone], status: currentStatus, notes: e.target.value } })
                  }
                />
              </div>
            </>
          ) : (
            <p className="text-zinc-500">Import a list to begin.</p>
          )}
        </section>
      </div>
    </div>
  );
}
