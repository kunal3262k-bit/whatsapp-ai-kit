import * as webPush from 'web-push';
import { getServiceClient } from './supabase';

export interface PushEnv {
  publicKey: string;
  privateKey: string;
  subject: string;
  configured: boolean;
}

export function pushEnv(): PushEnv {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  const privateKey = process.env.VAPID_PRIVATE_KEY || '';
  const subject = process.env.VAPID_SUBJECT || 'mailto:support@selixes.com';
  return { publicKey, privateKey, subject, configured: !!(publicKey && privateKey) };
}

export interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

function wp(): typeof webPush | null {
  const { publicKey, privateKey, subject, configured } = pushEnv();
  if (!configured) return null;
  webPush.setVapidDetails(subject, publicKey, privateKey);
  return webPush;
}

/** Hint shown to the operator when the subscriptions table hasn't been created yet. */
export function tableHint(message?: string): string | undefined {
  if (message && /relation|does not exist|schema cache|find the table/i.test(message)) {
    return 'Run the push_subscriptions DDL from apps/bot/supabase/schema.sql in the Supabase SQL editor.';
  }
  return undefined;
}

export async function listSubscriptions(): Promise<
  { ok: true; subscriptions: SubscriptionRow[] } | { ok: false; error: string }
> {
  const sb = getServiceClient();
  if (!sb) return { ok: false, error: 'Supabase not configured' };
  const { data, error } = await sb
    .from('push_subscriptions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, subscriptions: (data ?? []) as SubscriptionRow[] };
}

export async function saveSubscription(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<{ ok: true; subscription: SubscriptionRow } | { ok: false; error: string }> {
  const sb = getServiceClient();
  if (!sb) return { ok: false, error: 'Supabase not configured' };
  const { data, error } = await sb
    .from('push_subscriptions')
    .upsert(
      { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      { onConflict: 'endpoint' }
    )
    .select('*')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'Subscription was not saved' };
  return { ok: true, subscription: data as SubscriptionRow };
}

export async function removeSubscription(
  endpoint: string
): Promise<{ ok: true; removed: number } | { ok: false; error: string }> {
  const sb = getServiceClient();
  if (!sb) return { ok: false, error: 'Supabase not configured' };
  const { error } = await sb.from('push_subscriptions').delete().eq('endpoint', endpoint);
  if (error) return { ok: false, error: error.message };
  return { ok: true, removed: 1 };
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendToAll(
  payload: PushPayload
): Promise<{ ok: true; sent: number; pruned: number; errors: string[] } | { ok: false; error: string }> {
  const sender = wp();
  const sb = getServiceClient();
  if (!sender || !sb) return { ok: false, error: 'Push not configured (VAPID keys missing)' };

  const { data, error } = await sb.from('push_subscriptions').select('*');
  if (error) return { ok: false, error: error.message };

  let sent = 0;
  let pruned = 0;
  const errors: string[] = [];
  for (const row of (data ?? []) as SubscriptionRow[]) {
    try {
      await sender.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        JSON.stringify(payload)
      );
      sent += 1;
    } catch (err) {
      const status = (err as { statusCode?: number })?.statusCode;
      if (status === 404 || status === 410) {
        await sb.from('push_subscriptions').delete().eq('endpoint', row.endpoint);
        pruned += 1;
      } else {
        errors.push((err as { message?: string })?.message || String(err));
      }
    }
  }
  return { ok: true, sent, pruned, errors };
}
