export const metadata = {
  title: 'AI Automation for Your Business — Set up in a day',
  description: 'WhatsApp AI assistants, booking systems, and content engines for local businesses.',
};

const WHATSAPP = 'https://wa.me/91XXXXXXXXXX?text=Hi%2C%20I%20want%20the%20AI%20assistant%20for%20my%20business';

const offers = [
  {
    title: 'WhatsApp AI Lead Qualifier',
    body: 'Answers every enquiry instantly, asks your qualifying questions, and saves each lead to a Google Sheet / CRM.',
    tag: 'Most popular',
  },
  {
    title: 'Appointment Booking + Reminders',
    body: 'Lets customers book slots in chat and sends automatic reminders to cut no-shows.',
  },
  {
    title: 'AI Content Engine',
    body: 'Turns one business description into 7–14 days of posts, captions and hashtags.',
  },
  {
    title: 'Internal Tools',
    body: 'Fee reminders, order bots, inventory alerts — small bots that save hours every week.',
  },
];

const steps = [
  ['1. We talk (10 min)', 'You tell me what eats your time and loses you customers.'],
  ['2. I build it', 'A working AI assistant connected to YOUR WhatsApp number — same day.'],
  ['3. You take leads', 'Every enquiry is qualified and logged. You just close.'],
];

export default function OfferPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">AI Automation Studio</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-5xl">
          Stop losing customers who message you after hours.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          A custom AI assistant on your own WhatsApp number that replies instantly, qualifies leads,
          books appointments, and logs everything — delivered in under a day.
        </p>
        <a
          href={WHATSAPP}
          className="mt-6 inline-block rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
        >
          Get it on WhatsApp →
        </a>
      </header>

      <section className="mt-14 grid gap-5 sm:grid-cols-2">
        {offers.map((o) => (
          <div key={o.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {o.tag && (
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                {o.tag}
              </span>
            )}
            <h2 className="mt-2 text-lg font-semibold">{o.title}</h2>
            <p className="mt-1 text-slate-600">{o.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-14 grid gap-6 sm:grid-cols-3">
        {steps.map(([t, b]) => (
          <div key={t} className="rounded-2xl bg-slate-900 p-6 text-white">
            <div className="font-semibold">{t}</div>
            <p className="mt-2 text-sm text-slate-300">{b}</p>
          </div>
        ))}
      </section>

      <section className="mt-14 rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="text-2xl font-bold">Simple, honest pricing</h2>
        <p className="mt-2 text-slate-600">
          One setup fee, one day to deliver. No monthly lock-in, no guarantees of any specific result —
          just a working system you can use immediately.
        </p>
        <a
          href={WHATSAPP}
          className="mt-6 inline-block rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
        >
          Book a 10-minute call →
        </a>
        <p className="mt-4 text-xs text-slate-400">
          Replace the WhatsApp number in this page and in config/ with your own. No results are promised.
        </p>
      </section>
    </main>
  );
}
