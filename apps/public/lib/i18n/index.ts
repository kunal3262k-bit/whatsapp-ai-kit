import enJson from './locales/en.json';
import hiJson from './locales/hi.json';
import esJson from './locales/es.json';
import arJson from './locales/ar.json';
import ptJson from './locales/pt.json';
import type { Locale } from '../countries';

type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer U)[]
        ? Widen<U>[]
        : T extends object
          ? { [K in keyof T]: Widen<T[K]> }
          : T;

export type Dictionary = Widen<typeof enJson>;

const en: Dictionary = enJson;
const hi: Dictionary = hiJson;
const es: Dictionary = esJson;
const ar: Dictionary = arJson;
const pt: Dictionary = ptJson;

export const dictionaries: Record<Locale, Dictionary> = { en, hi, es, ar, pt };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}

export function interpolate(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key: string) =>
    key in vars ? String(vars[key]) : ''
  );
}
