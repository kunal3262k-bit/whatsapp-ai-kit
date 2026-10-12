import { env } from '../env';

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
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

const VIBRATE = [500, 200, 500, 200, 900, 200, 900];

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
