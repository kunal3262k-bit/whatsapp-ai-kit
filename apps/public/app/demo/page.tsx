'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { DEMO_PRESETS, type DemoPreset } from '../../lib/presets';

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

export default function DemoPage() {
  const [presetId, setPresetId] = useState(DEMO_PRESETS[0]!.id);
  const preset = useMemo(
    () => DEMO_PRESETS.find((p) => p.id === presetId) ?? DEMO_PRESETS[0]!,
    [presetId]
  );

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [input, setInput] = useState('');
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMsgs([{ role: 'bot', text: preset.greeting }, { role: 'bot', text: preset.intro }, { role: 'bot', text: questionFor(preset, 0) }]);
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

  const filled = preset.fields.filter((f) => answers[f.key]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-bold">Interactive Demo</h1>
      <p className="mt-1 text-slate-600">
        Try it live — pick an industry and chat. The lead panel fills in real time, exactly like the
        real bot writes to your CRM.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {DEMO_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPresetId(p.id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              p.id === presetId
                ? 'border-brand bg-brand text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:border-brand'
            }`}
          >
            {p.emoji} {p.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Chat window */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-[#075e54] px-4 py-3 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              {preset.emoji}
            </div>
            <div>
              <div className="text-sm font-semibold">{preset.business}</div>
              <div className="text-xs text-white/70">online • replies instantly</div>
            </div>
          </div>

          <div ref={scroller} className="h-[420px] space-y-2 overflow-y-auto bg-[#ece5dd] p-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    m.role === 'user'
                      ? 'rounded-br-sm bg-[#dcf8c6] text-slate-800'
                      : 'rounded-bl-sm bg-white text-slate-800'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              disabled={done}
              placeholder={done ? 'Conversation complete' : 'Type a message (or a number 1-5)…'}
              className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm outline-none focus:border-brand disabled:bg-slate-50"
            />
            <button
              onClick={send}
              disabled={done}
              className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </section>

        {/* Lead extraction panel */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Lead extraction (live)</h2>
          <p className="mt-1 text-xs text-slate-500">
            This is what gets pushed to Google Sheets / Supabase.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Business</div>
              <div className="text-sm font-medium">{preset.business}</div>
            </div>
            {preset.fields.map((f) => (
              <div key={f.key}>
                <div className="text-xs uppercase tracking-wide text-slate-400">{f.key}</div>
                {answers[f.key] ? (
                  <div className="text-sm font-medium text-slate-800">{answers[f.key]}</div>
                ) : (
                  <div className="text-sm text-slate-300">— waiting —</div>
                )}
              </div>
            ))}
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">status</div>
              {done ? (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  QUALIFIED
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  in progress ({filled.length}/{preset.fields.length})
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setMsgs([{ role: 'bot', text: preset.greeting }, { role: 'bot', text: preset.intro }, { role: 'bot', text: questionFor(preset, 0) }]);
              setStep(0);
              setAnswers({});
              setDone(false);
              setInput('');
            }}
            className="mt-5 w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand"
          >
            Reset chat
          </button>
        </aside>
      </div>
    </main>
  );
}
