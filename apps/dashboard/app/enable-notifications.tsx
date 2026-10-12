'use client';

import { useCallback, useEffect, useState } from 'react';

type State = 'checking' | 'idle' | 'working' | 'on' | 'unsupported' | 'denied' | 'error';

const LABELS: Record<State, string> = {
  checking: 'Checking notifications…',
  idle: 'Enable notifications',
  working: 'Enabling…',
  on: 'Notifications on ✓',
  unsupported: 'Not supported in this browser',
  denied: 'Notifications blocked',
  error: 'Retry enable notifications',
};

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output.buffer;
}

/** Button that subscribes this device to lead push notifications. */
export default function EnableNotifications() {
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
  const [state, setState] = useState<State>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        if (alive) setState('unsupported');
        return;
      }
      if (!vapid) {
        if (alive) {
          setState('error');
          setMessage('VAPID public key is not configured.');
        }
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (alive) setState(existing ? 'on' : 'idle');
      } catch {
        if (alive) setState('idle');
      }
    })();
    return () => {
      alive = false;
    };
  }, [vapid]);

  async function enable(): Promise<void> {
    setState('working');
    setMessage('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('denied');
        setMessage('Notifications were blocked. Enable them for this site in browser settings.');
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapid),
        });
      }

      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error(`subscribe failed (${res.status})`);

      setState('on');
      setMessage('This device will now get lead alerts.');
    } catch (err) {
      setState('error');
      setMessage(err instanceof Error ? err.message : 'Could not enable notifications.');
    }
  }

  const busy = state === 'working' || state === 'checking';
  const done = state === 'on' || state === 'unsupported' || state === 'denied';

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={enable}
        disabled={busy || done}
        className="rounded-lg border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === 'working' ? 'Enabling…' : state === 'checking' ? 'Enable notifications' : buttonLabel(state)}
      </button>
      {message && (
        <span className={state === 'error' || state === 'denied' ? 'text-xs text-red-600' : 'text-xs text-slate-500'}>
          {message}
        </span>
      )}
    </div>
  );
}

function buttonLabel(state: State): string {
  switch (state) {
    case 'on':
      return 'Notifications on ✓';
    case 'unsupported':
      return 'Notifications unsupported';
    case 'denied':
      return 'Notifications blocked';
    case 'error':
      return 'Retry enable notifications';
    default:
      return 'Enable notifications';
  }
}
