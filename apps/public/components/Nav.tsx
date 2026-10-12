import Link from 'next/link';

const LINKS = [
  { href: '/', label: 'Leads' },
  { href: '/demo', label: 'Demo' },
  { href: '/outreach', label: 'Outreach' },
  { href: '/contract', label: 'Contract' },
  { href: '/pay', label: 'Pay' },
  { href: '/offer', label: 'Offer' },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-6 py-3">
        <Link href="/" className="font-semibold text-brand">
          WhatsApp AI Kit
        </Link>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
          {LINKS.slice(1).map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand">
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
