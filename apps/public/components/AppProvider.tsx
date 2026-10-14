'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  formatPrice,
  getCountry,
  isRtl,
  isCountryCode,
  type Country,
  type CountryCode,
  type Locale,
  type Prices,
} from '../lib/countries';
import { getDictionary, interpolate, type Dictionary } from '../lib/i18n';

interface AppContextValue {
  country: Country;
  locale: Locale;
  dir: 'ltr' | 'rtl';
  t: Dictionary;
  prices: Prices;
  format: (amount: number) => string;
  tr: (template: string, vars?: Record<string, string | number>) => string;
  setCountry: (code: CountryCode) => void;
  setLocale: (locale: Locale) => void;
  selectorOpen: boolean;
  openSelector: () => void;
  closeSelector: () => void;
  geo: CountryCode | null;
}

const AppContext = createContext<AppContextValue | null>(null);

const YEAR = 60 * 60 * 24 * 365;

function writeCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${YEAR}; samesite=lax`;
}

function writeStorage(name: string, value: string): void {
  try {
    localStorage.setItem(name, value);
  } catch {
    /* private mode */
  }
}

export function AppProvider({
  initialCountry,
  initialLocale,
  initialChosen,
  geoCountry,
  children,
}: {
  initialCountry: CountryCode;
  initialLocale: Locale;
  initialChosen: boolean;
  geoCountry?: CountryCode | null;
  children: React.ReactNode;
}) {
  const [countryCode, setCountryCode] = useState<CountryCode>(initialCountry);
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [selectorOpen, setSelectorOpen] = useState(!initialChosen);

  const country = useMemo(() => getCountry(countryCode), [countryCode]);
  const t = useMemo(() => getDictionary(locale), [locale]);
  const dir: 'ltr' | 'rtl' = isRtl(locale) ? 'rtl' : 'ltr';
  const geo: CountryCode | null = isCountryCode(geoCountry) ? geoCountry : null;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const setCountry = useCallback((code: CountryCode) => {
    const next = getCountry(code);
    setCountryCode(code);
    setLocaleState(next.locale);
    writeCookie('akra_country', code);
    writeCookie('akra_locale', next.locale);
    writeCookie('akra_chosen', '1');
    writeStorage('akra_country', code);
    writeStorage('akra_locale', next.locale);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writeCookie('akra_locale', next);
    writeStorage('akra_locale', next);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      country,
      locale,
      dir,
      t,
      prices: country.prices,
      format: (amount: number) => formatPrice(amount, country.currency, locale),
      tr: (template: string, vars: Record<string, string | number> = {}) => interpolate(template, vars),
      setCountry,
      setLocale,
      selectorOpen,
      openSelector: () => setSelectorOpen(true),
      closeSelector: () => {
        setSelectorOpen(false);
        writeCookie('akra_chosen', '1');
      },
      geo,
    }),
    [country, locale, dir, t, setCountry, setLocale, selectorOpen, geo]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
