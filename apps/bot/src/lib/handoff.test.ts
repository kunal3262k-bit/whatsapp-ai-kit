import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldResume } from './handoff';

const now = Date.parse('2026-10-12T12:00:00Z');
const ago = (h: number) => new Date(now - h * 3600_000).toISOString();

test('resumes a human contact past the idle window', () => {
  assert.equal(shouldResume({ status: 'human', handoffAt: ago(25) }, now, 24), true);
});

test('does not resume before the window', () => {
  assert.equal(shouldResume({ status: 'human', handoffAt: ago(23) }, now, 24), false);
});

test('the boundary: exactly at the window does not resume (strictly past only)', () => {
  assert.equal(shouldResume({ status: 'human', handoffAt: ago(24) }, now, 24), false);
});

test('ignores non-human and missing handoffAt', () => {
  assert.equal(shouldResume({ status: 'qualified', handoffAt: ago(99) }, now, 24), false);
  assert.equal(shouldResume({ status: 'qualifying', handoffAt: ago(99) }, now, 24), false);
  assert.equal(shouldResume({ status: 'human' }, now, 24), false);
});
