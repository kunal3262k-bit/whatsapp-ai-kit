'use client';

import { useCallback, useEffect, useState } from 'react';
import { urlBase64ToUint8Array } from '../lib/push-shared';

interface Sub {
  id: string;
  endpoint: string;
  created_at: string;
}

type Support = 'checking' | 'ready' | 'unsupported';

export default function PushNotifications({
  publicKey,
  serverReady,
}: {
  publicKey: string;
  serverReady: boolean;
}) {
  const [support, setSupport] = useState<Support>('checking');
  const [subs, setSubs] = useState<Sub[]>([]);
  const [browserSub, setBrowserSub] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/push/subscribe', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok) setSubs(json.subscriptions ?? []);
      else setNote({ kind: 'err', text: json.hint || json.error || 'Failed to load subscriptions' });
    } catch {
      setNote({ kind: 'err', text: 'Failed to load subscriptions' });
    }
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setSupport('unsupported');
      return;
    }
    setSupport('ready');
    load();
    navigator.serviceWorker
      .getRegistration('/sw.js')
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setBrowserSub(sub?.endpoint ?? null))
      .catch(() => {});
  }, [load]);

  async function enable() {
    setBusy(true);
    setNote(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setNote({ kind: 'err', text: 'Notification permission was not granted.' });
        return;
      }
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.hint || json.error || 'Subscribe failed');
      setBrowserSub(sub.endpoint);
      setNote({ kind: 'ok', text: 'This device is now subscribed.' });
      await load();
    } catch (err) {
      setNote({ kind: 'err', text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function remove(endpoint: string) {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.hint || json.error || 'Remove failed');
      }
      if (browserSub === endpoint) {
        const reg = await navigator.serviceWorker.getRegistration('/sw.js');
        const sub = await reg?.pushManager.getSubscription();
        await sub?.unsubscribe();
        setBrowserSub(null);
      }
      setNote({ kind: 'ok', text: 'Subscription removed.' });
      await load();
    } catch (err) {
      setNote({ kind: 'err', text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Akra Admin', body: 'Test notification', url: '/status' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.hint || json.error || 'Send failed');
      setNote({ kind: 'ok', text: `Sent to ${json.sent} device(s), pruned ${json.pruned}.` });
    } catch (err) {
      setNote({ kind: 'err', text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  if (!serverReady || !publicKey) {
    return (
      <section className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-5 text-sm text-amber-200">
        <div className="font-semibold">Push not configured yet</div>
        <p className="mt-1 text-amber-200/80">
          Generate VAPID keys and set them on the admin project, then redeploy:
        </p>
        <pre className="mt-3 overflow-auto rounded-lg border border-amber-500/30 bg-zinc-950 p-3 text-xs text-zinc-300">
{`npx web-push generate-vapid-keys

NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public>
VAPID_PRIVATE_KEY=<private>
VAPID_SUBJECT=mailto:support@selixes.com`}
        </pre>
        <p className="mt-3 text-amber-200/80">
          Then run the <code>push_subscriptions</code> DDL from <code>apps/bot/supabase/schema.sql</code>.
        </p>
      </section>
    );
  }

  if (support === 'unsupported') {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 text-sm text-zinc-400">
        This browser does not support Web Push notifications.
      </section>
    );
  }

  const firstName = (endpoint: string) => {
    try {
      return new URL(endpoint).host;
    } catch {
      return endpoint.slice(0, 40);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-zinc-200">
              {browserSub ? 'This device is subscribed' : 'This device is not subscribed'}
            </div>
            <div className="text-xs text-zinc-500">
              Permission: {typeof Notification !== 'undefined' ? Notification.permission : '—'}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || support !== 'ready'}
              onClick={enable}
              className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-brand-dark disabled:opacity-50"
            >
              Enable notifications
            </button>
            <button
              type="button"
              disabled={busy || subs.length === 0}
              onClick={sendTest}
              className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:border-brand hover:text-brand disabled:opacity-50"
            >
              Send test
            </button>
          </div>
        </div>
      </section>

      {note && (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            note.kind === 'ok'
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
              : 'border-red-500/40 bg-red-950/20 text-red-300'
          }`}
        >
          {note.text}
        </div>
      )}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-200">
          Subscriptions <span className="text-zinc-500">({subs.length})</span>
        </h2>
        {subs.length === 0 ? (
          <p className="text-sm text-zinc-500">No devices subscribed yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {subs.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm text-zinc-200">{firstName(s.endpoint)}</div>
                  <div className="truncate text-xs text-zinc-600">
                    {browserSub === s.endpoint ? 'this device · ' : ''}
                    {new Date(s.created_at).toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(s.endpoint)}
                  className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:border-red-500/60 hover:text-red-300 disabled:opacity-50"
                >
                  Prune
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
