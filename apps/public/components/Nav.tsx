import Link from 'next/link';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/offer', label: 'Services' },
  { href: '/demo', label: 'Live Demo' },
];

const WHATSAPP = 'https://wa.me/919717745568';

export default function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-6 py-3">
        <Link href="/" className="font-semibold text-brand">
          Akra AI Automations
        </Link>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand">
              {l.label}
            </Link>
          ))}
        </div>
        <a
          href={WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          WhatsApp us
        </a>
      </nav>
    </header>
  );
}
