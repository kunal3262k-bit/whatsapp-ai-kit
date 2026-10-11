'use client';

import { useMemo, useState } from 'react';

const PILLS = [5000, 7000, 10000, 15000];

export default function PayPage() {
  const upiId = process.env.NEXT_PUBLIC_UPI_ID || 'yourname@upi';
  const name = process.env.NEXT_PUBLIC_UPI_NAME || 'AI Automation Studio';

  const [amount, setAmount] = useState(8000);
  const [note, setNote] = useState('');

  const q = useMemo(() => {
    const params = new URLSearchParams({
      pa: upiId,
      pn: name,
      am: String(amount),
      cu: 'INR',
    });
    if (note.trim()) params.set('tn', note.trim());
    return params.toString();
  }, [upiId, name, amount, note]);

  const upiUri = `upi://pay?${q}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiUri)}`;

  const apps = [
    { label: 'GPay', href: `gpay://upi/pay?${q}`, color: 'bg-white border-slate-300 text-slate-800' },
    { label: 'PhonePe', href: `phonepe://pay?${q}`, color: 'bg-[#5f259f] text-white' },
    { label: 'Paytm', href: `paytmmp://pay?${q}`, color: 'bg-[#00baf2] text-white' },
    { label: 'Any UPI app', href: upiUri, color: 'bg-brand text-white' },
  ];

  return (
    <main className="mx-auto max-w-md px-6 py-12 text-center">
      <h1 className="text-2xl font-bold">Collect payment</h1>
      <p className="mt-1 text-slate-600">Quick UPI QR + one-tap app links.</p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {PILLS.map((p) => (
          <button
            key={p}
            onClick={() => setAmount(p)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
              amount === p ? 'border-brand bg-brand text-white' : 'border-slate-300 hover:border-brand'
            }`}
          >
            ₹{p.toLocaleString('en-IN')}
          </button>
        ))}
        <input
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)}
          className="w-24 rounded-full border border-slate-300 px-3 py-1.5 text-center text-sm"
        />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrSrc} alt="UPI QR code" width={260} height={260} className="mx-auto rounded-xl" />
        <div className="mt-4 text-sm text-slate-500">Pay to</div>
        <div className="text-lg font-semibold">{upiId}</div>
        <div className="text-sm text-slate-500">₹{amount.toLocaleString('en-IN')}</div>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (client name)"
          className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />

        <div className="mt-4 grid grid-cols-2 gap-2">
          {apps.map((a) => (
            <a
              key={a.label}
              href={a.href}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold ${a.color}`}
            >
              {a.label}
            </a>
          ))}
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        After paying, send the screenshot on WhatsApp. Work starts immediately. No results are
        guaranteed — you receive a working setup and a tracked report.
      </p>
    </main>
  );
}
