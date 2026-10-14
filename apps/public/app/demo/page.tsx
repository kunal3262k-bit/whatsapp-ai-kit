'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { resolveDemoSet, type DemoPreset } from '../../lib/demo-presets';
import { useApp } from '../../components/AppProvider';
import { cn } from '../../lib/cn';
import { Eyebrow } from '../../components/ui';
import { CheckIcon } from '../../components/icons';

interface Msg {
  role: 'bot' | 'user';
  text: string;
}

function questionFor(preset: DemoPreset, index: number): string {
  const f = preset.fields[index]!;
  let text = f.question;
  if (f.type === 'choice' && f.options?.length) {
    text += '\n' + f.options.map((o, i) => `${i + 1}. ${o}`).join('\n');
  }
  return text;
}

function initMsgs(preset: DemoPreset): Msg[] {
  return [
    { role: 'bot', text: preset.greeting },
    { role: 'bot', text: preset.intro },
    { role: 'bot', text: questionFor(preset, 0) },
  ];
}

export default function DemoPage() {
  const { t, country, locale } = useApp();
  const set = useMemo(() => resolveDemoSet(country.code, locale), [country.code, locale]);

  const [presetId, setPresetId] = useState(set.presets[0]!.id);
  const preset = useMemo(
    () => set.presets.find((p) => p.id === presetId) ?? set.presets[0]!,
    [set, presetId]
  );

  const [msgs, setMsgs] = useState<Msg[]>(() => initMsgs(preset));
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [input, setInput] = useState('');
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMsgs(initMsgs(preset));
    setStep(0);
    setAnswers({});
    setDone(false);
    setInput('');
  }, [preset]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [msgs]);

  function send() {
    const text = input.trim();
    if (!text || done) return;
    const field = preset.fields[step]!;
    let value = text;
    if (field.type === 'choice' && field.options?.length) {
      const n = parseInt(text, 10);
      if (!Number.isNaN(n) && n >= 1 && n <= field.options.length) value = field.options[n - 1]!;
    }
    const nextAnswers = { ...answers, [field.key]: value };
    const nextStep = step + 1;
    const next: Msg[] = [...msgs, { role: 'user', text }];

    if (nextStep < preset.fields.length) {
      next.push({ role: 'bot', text: questionFor(preset, nextStep) });
    } else {
      next.push({ role: 'bot', text: preset.handoff });
    }

    setMsgs(next);
    setAnswers(nextAnswers);
    setStep(nextStep);
    setInput('');
    if (nextStep >= preset.fields.length) setDone(true);
  }

  function reset() {
    setMsgs(initMsgs(preset));
    setStep(0);
    setAnswers({});
    setDone(false);
    setInput('');
  }

  const filled = preset.fields.filter((f) => answers[f.key]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-14 lg:px-8 lg:py-20">
      <div className="max-w-2xl">
        <Eyebrow>{t.demoSection.eyebrow}</Eyebrow>
        <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {t.demo.title}
        </h1>
        <p className="mt-4 text-pretty text-base leading-relaxed text-zinc-500 lg:text-lg">
          {t.demo.subtitle}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {set.presets.map((p) => (
          <button
            key={p.id}
            onClick={() => setPresetId(p.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors',
              p.id === preset.id
                ? 'border-ink bg-ink text-white'
                : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-ink'
            )}
          >
            <span aria-hidden>{p.emoji}</span>
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Chat window */}
        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
          <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-base">
              <span aria-hidden>{preset.emoji}</span>
            </div>
            <div>
              <div className="text-sm font-semibold">{preset.business}</div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-white/60">
                {t.demo.online}
              </div>
            </div>
          </div>

          <div ref={scroller} className="h-[420px] space-y-2 overflow-y-auto bg-[#ece5dd] p-4">
            {msgs.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm text-zinc-800 shadow-sm',
                    m.role === 'user' ? 'rounded-br-sm bg-[#dcf8c6]' : 'rounded-bl-sm bg-white'
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-zinc-200 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              disabled={done}
              placeholder={done ? t.demo.donePlaceholder : t.demo.inputPlaceholder}
              className="h-11 flex-1 rounded-lg border border-zinc-200 bg-white px-4 text-sm outline-none transition-colors focus:border-ink disabled:bg-zinc-50"
            />
            <button
              onClick={send}
              disabled={done}
              className="h-11 rounded-lg bg-wa px-5 text-sm font-semibold text-white transition-colors hover:bg-wa-deep disabled:opacity-40"
            >
              {t.demo.send}
            </button>
          </div>
        </section>

        {/* Lead extraction panel */}
        <aside className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-semibold tracking-tight text-ink">{t.demo.leadPanel}</h2>
          <p className="mt-1 text-xs text-zinc-500">{t.demo.leadPanelNote}</p>

          <div className="mt-5 space-y-3.5 border-t border-zinc-200 pt-5">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
                {t.demo.businessLabel}
              </div>
              <div className="mt-0.5 text-sm font-medium text-ink">{preset.business}</div>
            </div>
            {preset.fields.map((f) => (
              <div key={f.key}>
                <div className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
                  {f.label}
                </div>
                {answers[f.key] ? (
                  <div className="mt-0.5 text-sm font-medium text-ink">{answers[f.key]}</div>
                ) : (
                  <div className="mt-0.5 text-sm text-zinc-300">{t.demo.waiting}</div>
                )}
              </div>
            ))}
            <div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
                {t.demo.status}
              </div>
              {done ? (
                <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-success/10 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-widest text-success">
                  <CheckIcon className="h-3 w-3" />
                  {t.demo.qualified}
                </span>
              ) : (
                <span className="mt-1 inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                  {t.demo.inProgress} ({filled.length}/{preset.fields.length})
                </span>
              )}
            </div>
          </div>

          <button
            onClick={reset}
            className="mt-6 h-10 w-full rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:text-ink"
          >
            {t.demo.reset}
          </button>
        </aside>
      </div>
    </main>
  );
}