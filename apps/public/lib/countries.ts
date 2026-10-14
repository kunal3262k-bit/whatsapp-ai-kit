export const LOCALES = ['en', 'hi', 'es', 'ar', 'pt'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  es: 'Español',
  ar: 'العربية',
  pt: 'Português',
};

export const INTL_TAG: Record<Locale, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  es: 'es-ES',
  ar: 'ar-AE',
  pt: 'pt-BR',
};

export interface Prices {
  starter: number;
  pro: number;
  premium: number;
}

export type CountryCode = 'IN' | 'US' | 'GB' | 'AE' | 'SA' | 'BR' | 'XX';

export interface Country {
  code: CountryCode;
  flag: string;
  name: string;
  currency: string;
  locale: Locale;
  locales: Locale[];
  prices: Prices;
}

export const DEFAULT_COUNTRY: CountryCode = 'XX';

export const COUNTRIES: Country[] = [
  { code: 'IN', flag: '🇮🇳', name: 'India', currency: 'INR', locale: 'en', locales: ['en', 'hi'], prices: { starter: 8999, pro: 14999, premium: 19999 } },
  { code: 'US', flag: '🇺🇸', name: 'United States', currency: 'USD', locale: 'en', locales: ['en'], prices: { starter: 99, pro: 179, premium: 249 } },
  { code: 'GB', flag: '🇬🇧', name: 'United Kingdom', currency: 'GBP', locale: 'en', locales: ['en'], prices: { starter: 79, pro: 149, premium: 199 } },
  { code: 'AE', flag: '🇦🇪', name: 'United Arab Emirates', currency: 'AED', locale: 'en', locales: ['en', 'ar'], prices: { starter: 365, pro: 659, premium: 915 } },
  { code: 'SA', flag: '🇸🇦', name: 'Saudi Arabia', currency: 'SAR', locale: 'ar', locales: ['ar', 'en'], prices: { starter: 375, pro: 675, premium: 935 } },
  { code: 'BR', flag: '🇧🇷', name: 'Brazil', currency: 'BRL', locale: 'pt', locales: ['pt'], prices: { starter: 499, pro: 899, premium: 1249 } },
  { code: 'XX', flag: '🌍', name: 'Global / Other', currency: 'USD', locale: 'en', locales: ['en'], prices: { starter: 99, pro: 179, premium: 249 } },
];

const byCode = new Map<string, Country>(COUNTRIES.map((c) => [c.code, c]));

export function isCountryCode(value: string | null | undefined): value is CountryCode {
  return !!value && byCode.has(value);
}

export function getCountry(code: string | null | undefined): Country {
  return (isCountryCode(code) ? byCode.get(code) : undefined) ?? byCode.get(DEFAULT_COUNTRY)!;
}

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export function localeForCountry(code: string | null | undefined, preferred?: string | null): Locale {
  const country = getCountry(code);
  if (isLocale(preferred) && country.locales.includes(preferred)) return preferred;
  return country.locale;
}

export function isRtl(locale: Locale): boolean {
  return locale === 'ar';
}

export function formatPrice(amount: number, currency: string, locale: Locale): string {
  return new Intl.NumberFormat(INTL_TAG[locale], {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
