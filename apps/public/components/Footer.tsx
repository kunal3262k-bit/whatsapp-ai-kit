'use client';

import Link from 'next/link';
import { useApp } from './AppProvider';
import { WhatsAppIcon, GlobeIcon } from './icons';
import { WHATSAPP } from './ui';

export default function Footer() {
  const { t, openSelector, country } = useApp();
  const year = new Date().getFullYear();

  const links = [
    { href: '/#how', label: t.nav.home },
    { href: '/offer', label: t.nav.services },
    { href: '/demo', label: t.nav.demo },
    { href: '/#pricing', label: t.nav.pricing },
    { href: '/#faq', label: t.nav.faq },
  ];

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-white text-[13px] font-bold text-ink">
                A
              </span>
              Akra<span className="text-white/40">AI</span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/50">{t.footer.tagline}</p>
          </div>

          <div className="md:col-span-4 md:col-start-7">
            <div className="font-mono text-xs uppercase tracking-widest text-white/40">
              {t.footer.contact}
            </div>
            <ul className="mt-4 space-y-3">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <div className="font-mono text-xs uppercase tracking-widest text-white/40">
              {t.footer.whatsapp}
            </div>
            <div className="mt-4 space-y-3">
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
              >
                <WhatsAppIcon className="h-4 w-4" />
                {t.footer.whatsapp}
              </a>
              <button
                type="button"
                onClick={openSelector}
                className="flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
              >
                <GlobeIcon className="h-4 w-4" />
                {country.flag} {country.code}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-white/40">
            © {year} Akra AI Automations. {t.footer.rights}
          </p>
          <p className="font-mono text-xs uppercase tracking-widest text-white/40">
            {t.common.payOnce}
          </p>
        </div>
      </div>
    </footer>
  );
}