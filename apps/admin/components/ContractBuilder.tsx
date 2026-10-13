'use client';

import { useMemo, useState } from 'react';
import { PACKAGES, advanceOf, buildContract } from '../lib/contract';

export default function ContractBuilder() {
  const [client, setClient] = useState('');
  const [bizType, setBizType] = useState('salon');
  const [pkgId, setPkgId] = useState('qualifier');
  const [amount, setAmount] = useState(8000);
  const [copied, setCopied] = useState(false);

  const message = useMemo(
    () => buildContract({ client, bizType, pkgId, amount }),
    [client, bizType, pkgId, amount]
  );
  const advance = advanceOf(amount);
  const balanced = advance * 2;

  const input =
    'mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-brand';

  function copy() {
    navigator.clipboard?.writeText(message).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {}
    );
  }

  function download() {
    const blob = new Blob([message], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scope-${(client || 'client').replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <label className="text-sm text-zinc-400">Client name</label>
        <input className={input} value={client} onChange={(e) => setClient(e.target.value)} placeholder="e.g. Glow Salon" />

        <label className="mt-4 block text-sm text-zinc-400">Business type</label>
        <input
          className={input}
          value={bizType}
          onChange={(e) => setBizType(e.target.value)}
          placeholder="salon / clinic / gym / tuition"
        />

        <label className="mt-4 block text-sm text-zinc-400">Package</label>
        <select
          className={input}
          value={pkgId}
          onChange={(e) => {
            setPkgId(e.target.value);
            setAmount(PACKAGES.find((p) => p.id === e.target.value)!.amount);
          }}
        >
          {PACKAGES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} — ₹{p.amount.toLocaleString('en-IN')}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-sm text-zinc-400">Amount (₹)</label>
        <input
          className={input}
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)}
        />

        <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-400">
          Advance (50%): <span className="font-semibold text-zinc-100">₹{advance.toLocaleString('en-IN')}</span>
          <br />
          Balance on delivery: <span className="font-semibold text-zinc-100">₹{balanced.toLocaleString('en-IN')}</span>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200">WhatsApp scope</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copy}
              className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-brand-dark"
            >
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={download}
              className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:border-brand hover:text-brand"
            >
              Download
            </button>
          </div>
        </div>
        <pre className="mt-3 max-h-[440px] overflow-auto whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-200">
          {message}
        </pre>
      </section>
    </div>
  );
}
