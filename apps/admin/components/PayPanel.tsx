'use client';

import { useMemo, useState } from 'react';
import { PAY_PILLS, buildUpiQuery, payApps, qrSrcFor, upiUri } from '../lib/pay';

const APP_STYLE: Record<string, string> = {
  GPay: 'bg-white text-zinc-900',
  PhonePe: 'bg-[#5f259f] text-white',
  Paytm: 'bg-[#00baf2] text-zinc-950',
  'Any UPI app': 'bg-brand text-zinc-950',
};

export default function PayPanel() {
  const upiId = process.env.NEXT_PUBLIC_UPI_ID || '9717745568@ptsbi';
  const name = process.env.NEXT_PUBLIC_UPI_NAME || 'Kunal Sharma';

  const [amount, setAmount] = useState(8000);
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const query = useMemo(() => buildUpiQuery({ upiId, name, amount, note }), [upiId, name, amount, note]);
  const uri = upiUri({ upiId, name, amount, note });
  const qr = qrSrcFor(uri);

  function copy(value: string, key: string) {
    navigator.clipboard?.writeText(value).then(
      () => {
        setCopied(key);
        setTimeout(() => setCopied(null), 1500);
      },
      () => {}
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="flex flex-wrap justify-center gap-2">
        {PAY_PILLS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAmount(p)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
              amount === p ? 'border-brand bg-brand text-zinc-950' : 'border-zinc-700 text-zinc-300 hover:border-brand'
            }`}
          >
            ₹{p.toLocaleString('en-IN')}
          </button>
        ))}
        <input
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)}
          className="w-24 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-center text-sm text-zinc-100 outline-none focus:border-brand"
        />
      </div>

      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="UPI QR code" width={260} height={260} className="mx-auto rounded-xl bg-white p-2" />
        <div className="mt-4 text-sm text-zinc-500">Pay to</div>
        <button
          type="button"
          onClick={() => copy(upiId, 'vpa')}
          className="text-lg font-semibold text-zinc-100 hover:text-brand"
          title="Copy UPI ID"
        >
          {upiId} {copied === 'vpa' ? '✓' : ''}
        </button>
        <div className="text-sm text-zinc-400">
          {name} · ₹{amount.toLocaleString('en-IN')}
        </div>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (client name)"
          className="mt-4 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-brand"
        />

        <div className="mt-4 grid grid-cols-2 gap-2">
          {payApps(query).map((a) => (
            <a
              key={a.label}
              href={a.href}
              className={`rounded-xl px-4 py-3 text-sm font-semibold ${APP_STYLE[a.label] ?? 'bg-zinc-800 text-zinc-100'}`}
            >
              {a.label}
            </a>
          ))}
        </div>

        <button
          type="button"
          onClick={() => copy(uri, 'link')}
          className="mt-3 w-full rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-brand hover:text-brand"
        >
          {copied === 'link' ? 'Copied UPI link ✓' : 'Copy UPI payment link'}
        </button>
      </div>

      <p className="mt-5 text-xs text-zinc-500">
        After paying, send the screenshot on WhatsApp. Work starts immediately. No results are guaranteed —
        the client receives a working setup and a tracked report.
      </p>
    </div>
  );
}
