import Link from 'next/link';

const WHATSAPP = 'https://wa.me/919717745568';

const problems = [
  {
    title: 'Missed messages = missed money',
    body: 'A customer messages at 10pm. You see it at 9am. By then they have already bought from someone who replied first.',
  },
  {
    title: 'Repetitive questions, all day',
    body: 'Price? Timing? Location? The same questions on repeat keep you busy instead of growing the business.',
  },
  {
    title: 'Leads get lost in the noise',
    body: 'Enquiries scattered across chats, notes and calls — no single place to see who asked what, and no follow-up.',
  },
];

const steps = [
  {
    n: '1',
    title: 'A 10-minute call',
    body: 'You tell us what eats your time and which customers you keep losing. We listen.',
  },
  {
    n: '2',
    title: 'We build it',
    body: 'A working AI assistant on your own WhatsApp number — replying, qualifying, and booking in under a day.',
  },
  {
    n: '3',
    title: 'You take the leads',
    body: 'Every chat is qualified and logged. You wake up to warm leads, not a backlog of unread messages.',
  },
];

const faqs = [
  {
    q: 'Do I need a new WhatsApp number?',
    a: 'No. We connect to a number you already use, or set up a fresh one if you prefer to keep things separate.',
  },
  {
    q: 'How long does setup take?',
    a: 'Most businesses are live in under 24 hours. We handle the setup — you just answer a few questions about your business.',
  },
  {
    q: 'What does it cost?',
    a: 'One setup fee, agreed upfront. No monthly lock-in. 50% advance to start, the rest when it is working.',
  },
  {
    q: 'What if it does not work for my business?',
    a: 'We guarantee a working system, not sales. If the assistant is not doing its job, we fix it — that is the commitment.',
  },
];

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-12 pt-16 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">
          Akra AI Automations
        </p>
        <h1 className="mt-3 text-3xl font-bold sm:text-5xl">
          Never lose a customer who messages you after hours.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          A custom AI assistant on your own WhatsApp number that replies instantly, qualifies leads,
          books appointments, and logs everything — set up in under a day.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
          >
            WhatsApp us →
          </a>
          <Link
            href="/demo"
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:border-brand hover:text-brand"
          >
            Try the live demo
          </Link>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-2 px-6 py-4 text-sm text-slate-600">
          <span>Delhi SMBs</span>
          <span aria-hidden className="text-slate-300">•</span>
          <span>~24h delivery</span>
          <span aria-hidden className="text-slate-300">·</span>
          <span>One setup fee</span>
        </div>
      </section>

      {/* Problems */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          The three problems every busy business knows
        </h2>
        <div className="mt-9 grid gap-5 sm:grid-cols-3">
          {problems.map((p) => (
            <div key={p.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-slate-600">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-center text-2xl font-bold">How it works</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl bg-slate-900 p-6 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold">
                {s.n}
              </div>
              <div className="mt-3 font-semibold">{s.title}</div>
              <p className="mt-2 text-sm text-slate-300">{s.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-slate-600">
          Want to see it in action first?{' '}
          <Link href="/demo" className="font-medium text-brand hover:underline">
            Try the live demo →
          </Link>
        </p>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold">Simple, honest pricing</h2>
          <p className="mt-3 text-slate-600">
            Starting at a single setup fee for your first automation. One fee, one day to deliver.
            50% advance to begin, the balance when it is working.
          </p>
          <p className="mt-4 text-slate-600">
            No monthly lock-in, no hidden charges — and we guarantee a working system, not sales.
          </p>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
          >
            Book a 10-minute call →
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="text-center text-2xl font-bold">Questions people ask</h2>
        <dl className="mt-8 space-y-6">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-slate-200 bg-white p-6">
              <dt className="font-semibold">{f.q}</dt>
              <dd className="mt-2 text-slate-600">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Contact */}
      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-2xl bg-slate-900 p-8 text-center text-white">
          <h2 className="text-2xl font-bold">Let&apos;s get you set up</h2>
          <p className="mt-3 text-slate-300">
            Message us on WhatsApp and we&apos;ll reply — usually within the hour.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-300">
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="hover:text-white">
              WhatsApp
            </a>
            <span>Delhi, India</span>
            <a href="mailto:hello@akra.ai" className="hover:text-white">
              hello@akra.ai
            </a>
          </div>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
          >
            Chat with us on WhatsApp →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        Akra AI Automations
      </footer>
    </main>
  );
}
