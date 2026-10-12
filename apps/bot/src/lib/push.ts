import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { env } from '../env';
import { logger } from '../logger';

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
}

export interface SubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** The subset of env that gates real pushing; injectable for tests. */
export interface VapidConfig {
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT?: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

const VIBRATE = [500, 200, 500, 200, 900, 200, 900];
const DEFAULT_VAPID_SUBJECT = 'mailto:owner@example.com';

export function pushEnabled(cfg: VapidConfig = env): boolean {
  return !!(cfg.VAPID_PUBLIC_KEY && cfg.VAPID_PRIVATE_KEY && cfg.SUPABASE_URL && cfg.SUPABASE_SERVICE_ROLE_KEY);
}

export function buildPayload(p: PushPayload): string {
  return JSON.stringify({
    title: p.title,
    body: p.body,
    url: p.url,
    tag: p.tag ?? 'lead',
    vibrate: VIBRATE,
    requireInteraction: true,
  });
}

function waMe(phone: string): string {
  return 'https://wa.me/' + phone.replace(/\D/g, '');
}

export interface QualifiedLeadInput {
  name?: string;
  phone: string;
  jid: string;
  answers: Record<string, string>;
}

export function qualifiedLeadPayload(a: QualifiedLeadInput): PushPayload {
  return {
    title: 'New qualified lead',
    body: `${a.name ?? 'Lead'} - ${Object.values(a.answers).join(', ')}`,
    url: waMe(a.phone),
    tag: 'lead-' + a.jid,
  };
}

export interface StuckInput {
  name?: string;
  phone: string;
  jid: string;
  message: string;
}

export function stuckPayload(a: StuckInput): PushPayload {
  return {
    title: 'Needs you',
    body: `${a.name ?? a.phone}: ${a.message}`,
    url: waMe(a.phone),
    tag: 'lead-' + a.jid,
  };
}

export function isExpired(err: unknown): boolean {
  const code = (err as { statusCode?: number } | null | undefined)?.statusCode;
  return code === 404 || code === 410;
}

export function toSubscription(row: {
  endpoint?: string;
  p256dh?: string;
  auth?: string;
}): SubscriptionRow | null {
  if (!row || !row.endpoint || !row.p256dh || !row.auth) return null;
  return { endpoint: row.endpoint, p256dh: row.p256dh, auth: row.auth };
}

export interface PushDeps {
  loadSubs: () => Promise<SubscriptionRow[]>;
  send: (sub: SubscriptionRow, payload: string) => Promise<void>;
  markExpired: (endpoint: string) => Promise<void>;
}

let vapidReady = false;

function makeLoadSubs(cfg: VapidConfig): () => Promise<SubscriptionRow[]> {
  const sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  return async () => {
    const { data, error } = await sb
      .from('push_subscriptions')
      .select('endpoint,p256dh,auth')
      .eq('enabled', true);
    if (error) throw error;
    return (data ?? [])
      .map((row) => toSubscription(row as { endpoint?: string; p256dh?: string; auth?: string }))
      .filter((s): s is SubscriptionRow => s !== null);
  };
}

function makeSend(cfg: VapidConfig): PushDeps['send'] {
  return async (sub, payload) => {
    if (!vapidReady) {
      webpush.setVapidDetails(cfg.VAPID_SUBJECT || DEFAULT_VAPID_SUBJECT, cfg.VAPID_PUBLIC_KEY, cfg.VAPID_PRIVATE_KEY);
      vapidReady = true;
    }
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
  };
}

function makeMarkExpired(cfg: VapidConfig): PushDeps['markExpired'] {
  const sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  return async (endpoint) => {
    const { error } = await sb.from('push_subscriptions').update({ enabled: false }).eq('endpoint', endpoint);
    if (error) throw error;
  };
}

/**
 * Build a payload and push it to every enabled subscription.
 * Injected `deps` (test seam) bypass the VAPID/Supabase gate; the default
 * path logs and returns a no-op when push is not configured.
 */
export async function sendLeadPush(p: PushPayload, deps?: Partial<PushDeps>, cfg: VapidConfig = env): Promise<void> {
  if (!deps && !pushEnabled(cfg)) {
    logger.warn('push: not configured (VAPID/Supabase env missing); skipping notification');
    return;
  }

  const loadSubs = deps?.loadSubs ?? makeLoadSubs(cfg);
  const send = deps?.send ?? makeSend(cfg);
  const markExpired = deps?.markExpired ?? makeMarkExpired(cfg);

  let subs: SubscriptionRow[];
  try {
    subs = await loadSubs();
  } catch (err) {
    logger.warn(`push: failed to load subscriptions: ${String(err)}`);
    return;
  }

  const payload = buildPayload(p);
  for (const sub of subs) {
    try {
      await send(sub, payload);
    } catch (err) {
      if (isExpired(err)) {
        try {
          await markExpired(sub.endpoint);
        } catch (e) {
          logger.warn(`push: failed to disable expired sub ${sub.endpoint}: ${String(e)}`);
        }
      } else {
        logger.warn(`push: send to ${sub.endpoint} failed: ${String(err)}`);
      }
    }
  }
}
