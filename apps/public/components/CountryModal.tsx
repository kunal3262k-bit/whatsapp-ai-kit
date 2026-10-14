'use client';

import { useEffect, useState } from 'react';
import { useApp } from './AppProvider';
import { cn } from '../lib/cn';
import { COUNTRIES, LOCALE_NAMES, type CountryCode } from '../lib/countries';
import { CheckIcon, CloseIcon } from './icons';

export default function CountryModal() {
  const { selectorOpen, closeSelector, setCountry, setLocale, country, locale, t, geo } = useApp();
  const [render, setRender] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (selectorOpen) {
      setRender(true);
      setClosing(false);
      return;
    }
    setClosing(true);
    const timer = setTimeout(() => setRender(false), 200);
    return () => clearTimeout(timer);
  }, [selectorOpen]);

  useEffect(() => {
    if (!render) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSelector();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [render, closeSelector]);

  if (!render) return null;

  const languages = country.locales;
  const geoCountry = geo ? COUNTRIES.find((c) => c.code === geo) : undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.countryModal.title}
      onClick={closeSelector}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 transition-opacity duration-200 ease-smooth',
        closing ? 'opacity-0' : 'opacity-100'
      )}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-md transition-[transform,opacity] duration-200 ease-smooth',
          closing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-5">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">
              {t.countryModal.title}
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">{t.countryModal.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={closeSelector}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-ink"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {geoCountry && geoCountry.code !== country.code && (
            <button
              type="button"
              onClick={() => setCountry(geoCountry.code as CountryCode)}
              className="mb-4 flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-paper p-3.5 text-start transition-colors hover:border-zinc-300"
            >
              <span className="text-xl leading-none" aria-hidden>
                {geoCountry.flag}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">
                  {geoCountry.name}
                </span>
                <span className="font-mono text-xs text-zinc-400">{t.countryModal.detected}</span>
              </span>
              <CheckIcon className="h-4 w-4 text-success" />
            </button>
          )}

          <div className="mb-2 font-mono text-xs uppercase tracking-widest text-zinc-400">
            {t.common.country}
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {COUNTRIES.map((c) => {
              const active = c.code === country.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCountry(c.code as CountryCode)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-start transition-colors',
                    active
                      ? 'border-ink bg-ink/[0.03]'
                      : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                  )}
                >
                  <span className="text-lg leading-none" aria-hidden>
                    {c.flag}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{c.name}</span>
                    <span className="font-mono text-[11px] text-zinc-400">{c.currency}</span>
                  </span>
                  {active && <CheckIcon className="h-4 w-4 shrink-0 text-success" />}
                </button>
              );
            })}
          </div>

          {languages.length > 1 && (
            <div className="mt-6">
              <div className="mb-2 font-mono text-xs uppercase tracking-widest text-zinc-400">
                {t.countryModal.chooseLanguage}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {languages.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLocale(l)}
                    className={cn(
                      'rounded-md border px-3.5 py-1.5 text-sm transition-colors',
                      l === locale
                        ? 'border-ink bg-ink text-white'
                        : 'border-zinc-200 text-zinc-700 hover:border-zinc-300'
                    )}
                  >
                    {LOCALE_NAMES[l]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-200 px-6 py-4">
          <button
            type="button"
            onClick={closeSelector}
            className="h-11 w-full rounded-lg bg-wa text-sm font-semibold text-white transition-[transform,box-shadow,background-color] duration-200 ease-smooth hover:scale-[1.02] hover:bg-wa-deep hover:shadow-cta"
          >
            {t.countryModal.continue}
          </button>
        </div>
      </div>
    </div>
  );
}