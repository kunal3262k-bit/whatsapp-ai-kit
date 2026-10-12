import { baseVars, config, fill } from './config';
import { env } from './env';
import { aiChat, aiEnabled } from './lib/ai';
import { shouldResume } from './lib/handoff';
import { qualifiedLeadPayload, sendLeadPush, stuckPayload } from './lib/push';
import { logger } from './logger';
import { pushLeadToSheet } from './leads';
import { scheduleFollowup } from './reminders';
import { getStore } from './store';
import type { Contact, LeadRow } from './types';

export interface FlowDeps {
  sendText: (jid: string, text: string) => Promise<void>;
  notifyOwner: (text: string) => Promise<void>;
}

const nowIso = () => new Date().toISOString();

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function looksLikeQuestion(text: string): boolean {
  const t = normalize(text);
  if (text.includes('?')) return true;
  return /\b(kya|kaise|kitna|kitne|kahan|kab|kaun|price|rate|cost|timing|time|address|location|open|khula|band|milega|available)\b/.test(
    t
  );
}

function tokenOverlap(a: string, b: string): number {
  const A = new Set(normalize(a).split(' ').filter((w) => w.length > 2));
  const B = new Set(normalize(b).split(' ').filter((w) => w.length > 2));
  let hit = 0;
  for (const w of B) if (A.has(w)) hit++;
  return hit;
}

function matchFaq(text: string): string | null {
  let best: { score: number; answer: string } | null = null;
  for (const faq of config.faqs) {
    const score = tokenOverlap(faq.q, text);
    if (score > 0 && (!best || score > best.score)) best = { score, answer: faq.a };
  }
  return best ? fill(best.answer, baseVars()) : null;
}

/** Block any phrase the client asked us never to say. */
function sanitize(text: string): string | null {
  const t = normalize(text);
  for (const bad of config.guardrails.never_say) {
    if (bad && t.includes(normalize(bad))) return null;
  }
  return text;
}

async function aiAnswer(text: string, history: { role: 'user' | 'assistant'; content: string }[]): Promise<string | null> {
  if (!aiEnabled()) return null;
  const sys = [
    `You are ${config.persona.name}, ${config.persona.role} for "${config.business.name}".`,
    `Tone: ${config.persona.tone}. Reply in the customer's language (Hinglish is fine).`,
    `Business info — about: ${config.business.about}. Hours: ${config.business.hours}. Location: ${config.business.location}.`,
    `Keep replies under 3 short lines. Never invent prices, promises, or guarantees. If unsure, say the team will confirm.`,
  ].join(' ');
  const reply = await aiChat([{ role: 'system', content: sys }, ...history, { role: 'user', content: text }], {
    temperature: 0.5,
    maxTokens: 220,
  });
  return reply ? sanitize(reply) : null;
}

function isDisqualified(answers: Record<string, string>): boolean {
  const answered = Object.values(answers).filter((v) => v && v.trim()).length;
  if (answered < config.qualify_rule.min_answers) return true;
  for (const rule of config.qualify_rule.disqualify_if) {
    const idx = rule.indexOf('=');
    if (idx === -1) continue;
    const key = rule.slice(0, idx).trim();
    const val = normalize(rule.slice(idx + 1));
    if (normalize(answers[key] ?? '') === val) return true;
  }
  return false;
}

function askQuestion(index: number): string {
  const f = config.qualification.fields[index]!;
  let msg = fill(f.question, baseVars());
  if (f.type === 'choice' && f.options?.length) {
    msg += '\n' + f.options.map((o, i) => `${i + 1}. ${o}`).join('\n');
  }
  return msg;
}

export async function handleIncoming(
  jid: string,
  phone: string,
  rawText: string,
  deps: FlowDeps,
  pushname?: string
): Promise<void> {
  const text = (rawText || '').trim();
  if (!text) return;
  const store = getStore();
  const norm = normalize(text);

  // --- opt-out always wins ---
  if (config.guardrails.opt_out_words.some((w) => w && norm.includes(normalize(w)))) {
    const existing = await store.getContact(jid);
    const c: Contact = existing ?? newContact(jid, phone);
    c.status = 'opted_out';
    c.updatedAt = nowIso();
    await store.upsertContact(c);
    await store.appendMessage({ jid, role: 'user', text, at: nowIso() });
    logger.info(`🚫 Opt-out from ${phone}`);
    return;
  }

  let contact = await store.getContact(jid);
  if (!contact) contact = newContact(jid, phone);
  if (!contact.name && pushname) contact.name = pushname;
  await store.appendMessage({ jid, role: 'user', text, at: nowIso() });
  contact.lastInboundAt = nowIso();

  // --- auto-resume a handed-off contact after it has been idle long enough ---
  if (shouldResume(contact, Date.now(), env.HANDOFF_IDLE_HOURS)) {
    contact.status = contact.step >= config.qualification.fields.length ? 'qualified' : 'qualifying';
    contact.handoffAt = undefined;
  }

  // --- human took over: stay silent ---
  if (contact.status === 'human') {
    await store.upsertContact(contact);
    return;
  }

  // --- already done qualifying: answer questions, else stay quiet ---
  if (contact.status === 'qualified' || contact.status === 'disqualified') {
    if (looksLikeQuestion(text)) {
      const ans = matchFaq(text) ?? (await aiAnswer(text, []));
      if (ans) {
        await deps.sendText(jid, ans);
        await store.appendMessage({ jid, role: 'assistant', text: ans, at: nowIso() });
      } else if (aiEnabled()) {
        await handleStuck(jid, phone, contact, text, deps);
      }
    }
    await store.upsertContact(contact);
    return;
  }

  // --- new conversation ---
  if (contact.status === 'new') {
    contact.status = 'qualifying';
    contact.step = 0;
    const greeting = fill(config.greeting, baseVars());
    await deps.sendText(jid, greeting);
    await store.appendMessage({ jid, role: 'assistant', text: greeting, at: nowIso() });
    if (config.qualification.intro) {
      const intro = fill(config.qualification.intro, baseVars());
      await deps.sendText(jid, intro);
      await store.appendMessage({ jid, role: 'assistant', text: intro, at: nowIso() });
    }
    const q0 = askQuestion(0);
    await deps.sendText(jid, q0);
    await store.appendMessage({ jid, role: 'assistant', text: q0, at: nowIso() });
    contact.updatedAt = nowIso();
    await store.upsertContact(contact);
    return;
  }

  // --- mid-qualification ---
  // If it's a question rather than an answer, answer it and re-ask. If we
  // can't answer it and the AI is up, hand off instead of looping the question.
  if (looksLikeQuestion(text)) {
    const ans = matchFaq(text) ?? (await aiAnswer(text, []));
    if (ans) {
      await deps.sendText(jid, ans);
      await store.appendMessage({ jid, role: 'assistant', text: ans, at: nowIso() });
    }
    if (!ans && aiEnabled()) {
      await handleStuck(jid, phone, contact, text, deps);
      return;
    }
    const requeue = askQuestion(contact.step);
    await deps.sendText(jid, requeue);
    await store.appendMessage({ jid, role: 'assistant', text: requeue, at: nowIso() });
    await store.upsertContact(contact);
    return;
  }

  // treat as the answer to the current field
  const field = config.qualification.fields[contact.step]!;
  let value = text;
  if (field.type === 'choice' && field.options?.length) {
    const asNum = parseInt(text, 10);
    if (!Number.isNaN(asNum) && asNum >= 1 && asNum <= field.options.length) {
      value = field.options[asNum - 1]!;
    }
  }
  contact.answers[field.key] = value;
  if (field.key.toLowerCase() === 'name' && value) contact.name = value;

  contact.step += 1;

  if (contact.step < config.qualification.fields.length) {
    const q = askQuestion(contact.step);
    await deps.sendText(jid, q);
    await store.appendMessage({ jid, role: 'assistant', text: q, at: nowIso() });
    contact.updatedAt = nowIso();
    await store.upsertContact(contact);
    return;
  }

  // --- finished: qualify or disqualify ---
  const qualified = !isDisqualified(contact.answers);
  contact.status = qualified ? 'qualified' : 'disqualified';
  contact.updatedAt = nowIso();
  await store.upsertContact(contact);

  const closing = qualified
    ? fill(config.post_qualify_message, baseVars({ name: contact.name ?? '' })) ||
      'Dhanyavaad! Hamari team aapse sampark karegi.'
    : 'Samajh gaya, koi baat nahi. Jab bhi zarurat ho, humein message kar dijiye 🙏';
  await deps.sendText(jid, closing);
  await store.appendMessage({ jid, role: 'assistant', text: closing, at: nowIso() });

  const lead: LeadRow = {
    jid,
    name: contact.name,
    phone,
    fields: contact.answers,
    qualified,
    createdAt: nowIso(),
  };
  await store.addLead(lead);
  await pushLeadToSheet(lead);

  if (qualified) {
    if (config.handoff.notify) {
      await sendLeadPush(qualifiedLeadPayload({ name: contact.name, phone, jid, answers: contact.answers }));
    }
    if (config.reminders.enabled && contact.followupsSent < config.reminders.max_followups) {
      await scheduleFollowup(jid, contact.name, config.reminders.followup_after_hours);
      contact.followupsSent += 1;
      await store.upsertContact(contact);
    }
  }
  logger.info(`✅ ${qualified ? 'QUALIFIED' : 'disqualified'} lead: ${phone}`);
}

async function handleStuck(
  jid: string,
  phone: string,
  contact: Contact,
  text: string,
  deps: FlowDeps
): Promise<void> {
  contact.status = 'human';
  contact.handoffAt = nowIso();
  contact.updatedAt = nowIso();
  await getStore().upsertContact(contact);
  await deps.sendText(jid, 'Ek second, main team se confirm karke batata hoon');
  await sendLeadPush(stuckPayload({ name: contact.name, phone, jid, message: text }));
}

function newContact(jid: string, phone: string): Contact {
  const at = nowIso();
  return {
    jid,
    phone,
    status: 'new',
    step: 0,
    answers: {},
    followupsSent: 0,
    createdAt: at,
    updatedAt: at,
  };
}
