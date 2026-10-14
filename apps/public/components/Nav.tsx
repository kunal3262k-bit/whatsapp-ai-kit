'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useApp } from './AppProvider';
import { cn } from '../lib/cn';
import { WhatsAppIcon, GlobeIcon, MenuIcon, CloseIcon } from './icons';
import { WHATSAPP } from './ui';

export default function Nav() {
  const { t, openSelector, country } = useApp();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/#how', label: t.nav.home },
    { href: '/offer', label: t.nav.services },
    { href: '/demo', label: t.nav.demo },
    { href: '/#pricing', label: t.nav.pricing },
    { href: '/#faq', label: t.nav.faq },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-paper/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ink"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-ink text-[13px] font-bold text-white">
            A
          </span>
          Akra<span className="text-zinc-400">AI</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-zinc-600 transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="ms-auto flex items-center gap-2">
          <button
            type="button"
            onClick={openSelector}
            className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 px-3 text-sm text-zinc-600 transition-colors hover:border-zinc-300 hover:text-ink"
            aria-label={t.common.changeCountry}
          >
            <span aria-hidden className="text-base leading-none">
              {country.flag}
            </span>
            <span className="hidden font-mono text-xs sm:inline">{country.code}</span>
            <GlobeIcon className="h-3.5 w-3.5 text-zinc-400" />
          </button>

          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-9 items-center gap-2 rounded-md bg-wa px-3.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,15,15,0.08)] transition-[transform,box-shadow,background-color] duration-200 ease-smooth hover:scale-[1.02] hover:bg-wa-deep hover:shadow-cta sm:inline-flex"
          >
            <WhatsAppIcon className="h-4 w-4" />
            {t.common.whatsappShort}
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-md border border-zinc-200 text-zinc-600 transition-colors hover:text-ink md:hidden"
            aria-expanded={open}
            aria-label="Menu"
          >
            {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-zinc-200 bg-paper md:hidden">
          <div className="mx-auto max-w-6xl px-6">
            <div className="divide-y divide-zinc-200">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-4 text-[15px] font-medium text-zinc-700 transition-colors hover:text-ink"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-3 py-5">
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center justify-center gap-2 rounded-lg bg-wa text-sm font-semibold text-white"
              >
                <WhatsAppIcon className="h-4 w-4" />
                {t.common.whatsappShort}
              </a>
              <button
                type="button"
                onClick={openSelector}
                className="flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700"
              >
                <span aria-hidden>{country.flag}</span>
                {country.name}
                <span className="font-mono text-xs text-zinc-400">{country.currency}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}