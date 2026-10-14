'use client';

import { useMemo } from 'react';
import { useApp } from '../AppProvider';
import { cn } from '../../lib/cn';
import { resolveDemoSet, type DemoPreset } from '../../lib/demo-presets';
import type { Prices } from '../../lib/countries';
import { Eyebrow, SectionHead, PrimaryCta, GhostCta, WHATSAPP } from '../ui';
import Reveal from '../Reveal';
import { CheckIcon, ChevronIcon } from '../icons';

type TierKey = keyof Prices;

const TIER_ORDER: TierKey[] = ['starter', 'pro', 'premium'];

function ChatPreview({
  preset,
  onlineLabel,
  qualifiedLabel,
}: {
  preset: DemoPreset;
  onlineLabel: string;
  qualifiedLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md">
      <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-base">
          <span aria-hidden>{preset.emoji}</span>
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{preset.business}</div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-white/60">
            {onlineLabel}
          </div>
        </div>
      </div>
      <div className="space-y-2 bg-[#ece5dd] p-4">
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm">
            {preset.greeting}
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm">
            {preset.fields[0]!.question}
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-[70%] rounded-2xl rounded-br-sm bg-[#dcf8c6] px-3 py-2 text-sm text-zinc-800 shadow-sm">
            {preset.fields[0]!.options?.[0] ?? '…'}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-zinc-200 bg-white px-4 py-3">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-success/10 text-success">
          <CheckIcon className="h-3 w-3" />
        </span>
        <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          {qualifiedLabel}
        </span>
      </div>
    </div>
  );
}

export default function HomeContent() {
  const { t, prices, format, tr, country, locale } = useApp();
  const tiers = t.pricing.tiers;
  const trust = t.hero.trust
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean);

  const preview = useMemo(
    () => resolveDemoSet(country.code, locale).presets[0]!,
    [country.code, locale]
  );

  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b border-zinc-200">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid items-center gap-14 py-16 lg:grid-cols-12 lg:gap-12 lg:py-24">
            <div className="lg:col-span-7">
              <Reveal>
                <Eyebrow>{t.hero.badge}</Eyebrow>
              </Reveal>
              <Reveal delay={60}>
                <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                  {t.hero.headline}
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="mt-5 max-w-xl text-pretty text-lg font-medium tracking-tight text-zinc-700 lg:text-xl">
                  {t.hero.headline2}
                </p>
              </Reveal>
              <Reveal delay={180}>
                <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-zinc-500">
                  {t.hero.sub}
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <PrimaryCta>{t.common.whatsappCta}</PrimaryCta>
                  <GhostCta href="/demo">{t.hero.ctaSecondary}</GhostCta>
                </div>
              </Reveal>
              <Reveal delay={300}>
                <ul className="mt-10 grid gap-3 border-t border-zinc-200 pt-7 sm:grid-cols-3">
                  {trust.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-zinc-600">
                      <CheckIcon className="h-4 w-4 shrink-0 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>

            <div className="lg:col-span-5">
              <Reveal delay={160}>
                <ChatPreview
                  preset={preview}
                  onlineLabel={t.demo.online}
                  qualifiedLabel={t.demo.qualified}
                />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ───────────────────────────────────────── */}
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5 lg:px-8">
          <p className="text-center font-mono text-xs uppercase tracking-widest text-zinc-400">
            {t.social.text}
          </p>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section id="how" className="scroll-mt-20 border-b border-zinc-200">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
          <Reveal>
            <SectionHead index="01" title={t.how.title} subtitle={t.how.subtitle} />
          </Reveal>
          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 sm:grid-cols-2 lg:grid-cols-4">
            {t.how.steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 80} className="bg-white">
                <div className="h-full p-6">
                  <div className="font-mono text-xs text-zinc-400">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="mt-5 text-[15px] font-semibold tracking-tight text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live demo band ────────────────────────────────────── */}
      <section className="border-b border-zinc-200 bg-ink text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <Reveal className="lg:col-span-8">
              <Eyebrow className="text-white/40">02</Eyebrow>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight lg:text-4xl">
                {t.demoSection.title}
              </h2>
              <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-white/60 lg:text-lg">
                {t.demoSection.subtitle}
              </p>
            </Reveal>
            <Reveal delay={120} className="lg:col-span-4 lg:justify-self-end">
              <GhostCta href="/demo" dark>
                {t.demoSection.cta}
              </GhostCta>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────── */}
      <section id="pricing" className="scroll-mt-20 border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
          <Reveal>
            <SectionHead index="03" title={t.pricing.title} subtitle={t.pricing.subtitle} />
          </Reveal>
          <Reveal delay={80}>
            <p className="mt-6 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-paper px-3.5 py-1.5 text-sm font-medium text-ink">
              <CheckIcon className="h-4 w-4 text-success" />
              {t.common.payOnce}
            </p>
          </Reveal>

          <div className="mt-10 grid items-start gap-6 lg:grid-cols-3">
            {TIER_ORDER.map((key, i) => {
              const tier = tiers[key];
              const popular = key === 'pro';
              return (
                <Reveal key={key} delay={i * 80}>
                  <div
                    className={cn(
                      'flex h-full flex-col rounded-xl border p-7 transition-[transform,box-shadow] duration-200 ease-smooth hover:-translate-y-1',
                      popular
                        ? 'border-ink bg-ink text-white shadow-md hover:shadow-lift'
                        : 'border-zinc-200 bg-white shadow-xs hover:shadow-md'
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold tracking-tight">{tier.name}</h3>
                      {popular && (
                        <span className="font-mono text-[11px] uppercase tracking-widest text-wa">
                          {t.pricing.popular}
                        </span>
                      )}
                    </div>
                    <p className={cn('mt-1.5 text-sm', popular ? 'text-white/60' : 'text-zinc-500')}>
                      {tier.tagline}
                    </p>

                    <div className="mt-7 flex items-baseline gap-2">
                      <span className="text-4xl font-semibold tracking-tight tabular-nums">
                        {format(prices[key])}
                      </span>
                      <span className={cn('text-sm', popular ? 'text-white/40' : 'text-zinc-400')}>
                        / {t.common.oneTime}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'mt-2 font-mono text-xs uppercase tracking-widest',
                        popular ? 'text-white/40' : 'text-zinc-400'
                      )}
                    >
                      {tier.delivery}
                    </div>

                    <div className={cn('my-6 h-px', popular ? 'bg-white/10' : 'bg-zinc-200')} />

                    <ul className="flex-1 space-y-3">
                      {tier.features.map((f, fi) => (
                        <li key={fi} className="flex gap-3 text-sm">
                          <CheckIcon
                            className={cn(
                              'mt-0.5 h-4 w-4 shrink-0',
                              popular ? 'text-success' : 'text-zinc-400'
                            )}
                          />
                          <span className={popular ? 'text-white/80' : 'text-zinc-600'}>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <a
                      href={WHATSAPP}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'mt-8 inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold transition-[transform,background-color,border-color,box-shadow] duration-200 ease-smooth hover:scale-[1.02]',
                        popular
                          ? 'bg-wa text-white hover:bg-wa-deep hover:shadow-cta'
                          : 'border border-zinc-200 text-ink hover:bg-zinc-50'
                      )}
                    >
                      {t.pricing.cta}
                    </a>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={120}>
            <div className="mt-8 flex flex-col items-start gap-2 rounded-xl border border-zinc-200 bg-paper px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-ink">
                <CheckIcon className="h-4 w-4 shrink-0 text-success" />
                {t.pricing.guarantee}
              </span>
              <span className="font-mono text-xs text-zinc-400">
                {tr(t.pricing.faqNote, { currency: country.currency })}
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Comparison ────────────────────────────────────────── */}
      <section className="border-b border-zinc-200">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
          <Reveal>
            <SectionHead index="04" title={t.comparison.title} subtitle={t.comparison.subtitle} />
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-12 overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-paper">
                      <th className="px-6 py-4 text-start font-mono text-xs font-normal uppercase tracking-widest text-zinc-400">
                        &nbsp;
                      </th>
                      <th className="border-s border-zinc-200 px-6 py-4 text-start font-semibold text-ink">
                        {t.comparison.akra}
                      </th>
                      <th className="border-s border-zinc-200 px-6 py-4 text-start font-mono text-xs font-normal uppercase tracking-widest text-zinc-400">
                        {t.comparison.official}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {t.comparison.rows.map((row, i) => (
                      <tr key={i}>
                        <td className="px-6 py-3.5 text-zinc-600">{row.label}</td>
                        <td className="border-s border-zinc-200 px-6 py-3.5 font-medium text-ink">
                          <span className="flex items-start gap-2">
                            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                            {row.akra}
                          </span>
                        </td>
                        <td className="border-s border-zinc-200 px-6 py-3.5 text-zinc-400">
                          {row.official}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section id="faq" className="scroll-mt-20 border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-20 lg:py-28">
          <Reveal>
            <SectionHead index="05" title={t.faq.title} />
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-10 border-t border-zinc-200">
              {t.faq.items.map((f, i) => (
                <details key={i} className="group border-b border-zinc-200">
                  <summary className="flex cursor-pointer select-none items-center justify-between gap-6 py-5 text-[15px] font-medium text-ink">
                    {f.q}
                    <ChevronIcon className="h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ease-smooth group-open:rotate-180" />
                  </summary>
                  <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 ease-smooth group-open:grid-rows-[1fr]">
                    <div className="overflow-hidden">
                      <p className="pb-5 text-pretty text-[15px] leading-relaxed text-zinc-500">
                        {f.a}
                      </p>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
        <Reveal>
          <div className="rounded-2xl bg-ink px-6 py-16 text-center text-white sm:px-16">
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight lg:text-4xl">
              {t.finalCta.title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-white/60 lg:text-lg">
              {t.finalCta.body}
            </p>
            <div className="mt-8 flex justify-center">
              <PrimaryCta>{t.finalCta.cta}</PrimaryCta>
            </div>
            <p className="mt-6 font-mono text-xs uppercase tracking-widest text-white/40">
              {t.common.payOnce}
            </p>
          </div>
        </Reveal>
      </section>
    </main>
  );
}