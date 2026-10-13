import test from 'node:test';
import assert from 'node:assert/strict';
import { activityLevel, mostRecent, relativeTime } from './bot-shared';

test('mostRecent picks the latest valid ISO and ignores nulls', () => {
  assert.equal(
    mostRecent([null, '2026-10-01T00:00:00.000Z', '2026-10-03T00:00:00.000Z', undefined, 'bad']),
    '2026-10-03T00:00:00.000Z'
  );
  assert.equal(mostRecent([null, undefined]), null);
});

test('activityLevel thresholds: active ≤15m, idle ≤24h, quiet beyond', () => {
  const now = Date.parse('2026-10-13T12:00:00.000Z');
  assert.equal(activityLevel('2026-10-13T11:55:00.000Z', now), 'active');
  assert.equal(activityLevel('2026-10-13T06:00:00.000Z', now), 'idle');
  assert.equal(activityLevel('2026-10-10T06:00:00.000Z', now), 'quiet');
  assert.equal(activityLevel(null, now), 'none');
});

test('relativeTime renders friendly buckets', () => {
  const now = Date.parse('2026-10-13T12:00:00.000Z');
  assert.equal(relativeTime('2026-10-13T11:59:30.000Z', now), 'just now');
  assert.equal(relativeTime('2026-10-13T11:30:00.000Z', now), '30m ago');
  assert.equal(relativeTime('2026-10-13T09:00:00.000Z', now), '3h ago');
  assert.equal(relativeTime('2026-10-11T12:00:00.000Z', now), '2d ago');
  assert.equal(relativeTime(null, now), '—');
});
