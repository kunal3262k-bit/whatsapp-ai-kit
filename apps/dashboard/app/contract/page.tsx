'use client';

import { useMemo, useState } from 'react';

const PACKAGES = [
  { id: 'qualifier', label: 'WhatsApp AI Lead Qualifier + CRM', amount: 8000 },
  { id: 'booking', label: 'AI Appointment Booking + Reminders', amount: 10000 },
  { id: 'content', label: 'AI Content Engine (14-day posts)', amount: 7000 },
  { id: 'custom', label: 'Custom internal tool', amount: 12000 },
];

const DELIVERABLES: Record<string, string[]> = {
  qualifier: [
    'AI assistant on your own WhatsApp number',
    'Configurable qualifying questions',
    'Every lead auto-saved to Google Sheet / dashboard',
    'Owner alert on each qualified lead',
  ],
  booking: [
    'In-chat appointment booking',
    'Automatic reminders to cut no-shows',
    'Leads + bookings logged to your CRM',
    'Owner alert on each booking',
  ],
  content: ['14-day Instagram post plan', 'Captions + hashtags per post', 'Editable Google Sheet'],
  custom: ['Scoped after a short call', 'Delivered as a working bot or sheet tool'],
};

export default function ContractPage() {
  const [client, setClient] = useState('');
  const [bizType, setBizType] = useState('salon');
  const [pkgId, setPkgId] = useState('qualifier');
  const [amount, setAmount] = useState(8000);
  const [copied, setCopied] = useState(false);

  const pkg = PACKAGES.find((p) => p.id === pkgId)!;
  const advance = Math.round(amount / 2);

  const message = useMemo(() => {
    const lines = [
      `*Scope of Work — AI WhatsApp Setup*`,
      ``,
      `Client: ${client || '[client name]'} (${bizType})`,
      `Package: ${pkg.label}`,
      `Total: ₹${amount.toLocaleString('en-IN')}`,
      ``,
      `*What you get:*`,
      ...DELIVERABLES[pkgId]!.map((d) => `• ${d}`),
      ``,
      `*Timeline:* Built and connected on your WhatsApp number within *12 hours* of advance.`,
      ``,
      `*Payment:*`,
      `• Advance: ₹${advance.toLocaleString('en-IN')} (50%) to start`,
      `• Balance: ₹${advance.toLocaleString('en-IN')} on delivery`,
      ``,
      `*What I need from you:*`,
      `• A WhatsApp number to run the assistant on`,
      `• Your business details + the questions you want asked`,
      ``,
      `*Note:* I commit to a working system and a tracked report. I do not guarantee any specific`,
      `number of sales or results.`,
      ``,
      `Reply *"START"* and I'll send the UPI link. 🙏`,
    ];
    return lines.join('\n');
  }, [client, bizType, pkg, amount, advance, pkgId]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-bold">Contract / Scope Generator</h1>
      <p className="mt-1 text-slate-600">
        Fill in the deal, copy the ready-to-send WhatsApp scope. 12-hour SLA, 50% advance.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="text-sm font-medium text-slate-600">Client name</label>
          <input
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="e.g. Glow Salon"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />

          <label className="mt-4 block text-sm font-medium text-slate-600">Business type</label>
          <input
            value={bizType}
            onChange={(e) => setBizType(e.target.value)}
            placeholder="salon / clinic / gym / tuition"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />

          <label className="mt-4 block text-sm font-medium text-slate-600">Package</label>
          <select
            value={pkgId}
            onChange={(e) => {
              setPkgId(e.target.value);
              setAmount(PACKAGES.find((p) => p.id === e.target.value)!.amount);
            }}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {PACKAGES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} — ₹{p.amount.toLocaleString('en-IN')}
              </option>
            ))}
          </select>

          <label className="mt-4 block text-sm font-medium text-slate-600">Amount (₹)</label>
          <input
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />

          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            Advance (50%): <span className="font-semibold text-slate-800">₹{advance.toLocaleString('en-IN')}</span>
            <br />
            Balance on delivery: <span className="font-semibold text-slate-800">₹{advance.toLocaleString('en-IN')}</span>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">WhatsApp message</h2>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(message).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
          <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
            {message}
          </pre>
        </section>
      </div>
    </main>
  );
}
