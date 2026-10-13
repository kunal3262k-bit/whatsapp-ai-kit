export function mostRecent(dates: Array<string | null | undefined>): string | null {
  let best: number | null = null;
  let bestIso: string | null = null;
  for (const d of dates) {
    if (!d) continue;
    const t = Date.parse(d);
    if (Number.isNaN(t)) continue;
    if (best === null || t > best) {
      best = t;
      bestIso = d;
    }
  }
  return bestIso;
}

export type ActivityLevel = 'active' | 'idle' | 'quiet' | 'none';

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  active: 'Active',
  idle: 'Idle',
  quiet: 'Quiet',
  none: 'No data',
};

/** Active ≤15m, idle ≤24h, else quiet. */
export function activityLevel(lastIso: string | null, nowMs = Date.now()): ActivityLevel {
  if (!lastIso) return 'none';
  const t = Date.parse(lastIso);
  if (Number.isNaN(t)) return 'none';
  const mins = (nowMs - t) / 60000;
  if (mins <= 15) return 'active';
  if (mins <= 24 * 60) return 'idle';
  return 'quiet';
}

export function relativeTime(iso: string | null, nowMs = Date.now()): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  const secs = Math.max(0, Math.round((nowMs - t) / 1000));
  if (secs < 45) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
