'use client';

import { useApp } from '../AppProvider';
import { cn } from '../../lib/cn';
import { Eyebrow, SectionHead, PrimaryCta, WHATSAPP } from '../ui';
import Reveal from '../Reveal';
import {
  CheckIcon,
  ChatIcon,
  CalendarIcon,
  ContentIcon,
  WrenchIcon,
  SparkIcon,
} from '../icons';

const WHATSAPP_OFFER = `${WHATSAPP}?text=Hi%2C%20I%20want%20the%20AI%20assistant%20for%20my%20business`;

const serviceIcons = [ChatIcon, CalendarIcon, ContentIcon, WrenchIcon];

export default function OfferContent() {
  const { t } = useApp();

  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b border-zinc-200">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="max-w-3xl py-16 lg:py-24">
            <Reveal>
              <Eyebrow>{t.offer.eyebrow}</Eyebrow>
            </Reveal>
            <Reveal delay={60}>
              <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
                {t.offer.title}
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-zinc-500">
                {t.offer.subtitle}
              </p>
            </Reveal>
            <Reveal delay={180}>
              <div className="mt-8">
                <PrimaryCta href={WHATSAPP_OFFER}>{t.finalCta.cta}</PrimaryCta>
              </div>
            </Reveal>
            <Reveal delay={240}>
              <p className="mt-6 font-mono text-xs uppercase tracking-widest text-zinc-400">
                {t.common.payOnce}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Services ──────────────────────────────────────────── */}
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
          <Reveal>
            <SectionHead index="01" title={t.offer.servicesTitle} />
          </Reveal>
          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 sm:grid-cols-2">
            {t.offer.services.map((o, i) => {
              const Icon = serviceIcons[i] ?? SparkIcon;
              return (
                <Reveal key={o.title} delay={(i % 2) * 80} className="bg-white">
                  <div className="flex h-full flex-col p-7">
                    <div className="flex items-start justify-between gap-4">
                      <span className="grid h-11 w-11 place-items-center rounded-lg border border-zinc-200 bg-paper text-ink">
                        <Icon className="h-5 w-5" />
                      </span>
                      {o.tag && (
                        <span className="inline-flex items-center rounded-md bg-success/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-success">
                          {o.tag}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-6 text-lg font-semibold tracking-tight text-ink">{o.title}</h3>
                    <p className="mt-2 text-pretty text-sm leading-relaxed text-zinc-500">{o.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Process ───────────────────────────────────────────── */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
          <Reveal className="max-w-2xl">
            <Eyebrow className="text-white/40">02</Eyebrow>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight lg:text-4xl">
              {t.how.title}
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-white/60 lg:text-lg">
              {t.how.subtitle}
            </p>
          </Reveal>
          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {t.how.steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 80} className="bg-ink">
                <div className="h-full p-6">
                  <div className="font-mono text-xs text-white/40">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="mt-5 text-[15px] font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing promise ───────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
        <Reveal>
          <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-xs sm:p-12">
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-success" />
              <Eyebrow>{t.pricing.title}</Eyebrow>
            </div>
            <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-ink lg:text-4xl">
              {t.common.payOnce}
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-zinc-500 lg:text-lg">
              {t.pricing.subtitle}
            </p>
            <div className="mt-9">
              <PrimaryCta href={WHATSAPP_OFFER}>{t.common.whatsappCta}</PrimaryCta>
            </div>
            <p className="mt-7 border-t border-zinc-200 pt-5 text-sm text-zinc-500">{t.hero.trust}</p>
          </div>
        </Reveal>
      </section>
    </main>
  );
}