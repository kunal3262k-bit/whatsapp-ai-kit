import test from 'node:test';
import assert from 'node:assert/strict';
import { signSession, verifySession, isAuthorized, timingSafeEqualStr } from './auth';

const SECRET = 'test-secret';
const NOW = 1_000_000_000_000;

test('accepts a freshly signed, unexpired session', async () => {
  const v = await signSession(NOW + 1000, SECRET);
  assert.equal(await verifySession(v, SECRET, NOW), true);
});

test('rejects an expired session', async () => {
  const v = await signSession(NOW - 1, SECRET);
  assert.equal(await verifySession(v, SECRET, NOW), false);
});

test('rejects a tampered expiry (signature no longer matches)', async () => {
  const v = (await signSession(NOW + 1000, SECRET)).replace(/^\d+/, String(NOW + 999999));
  assert.equal(await verifySession(v, SECRET, NOW), false);
});

test('rejects a wrong secret', async () => {
  assert.equal(await verifySession(await signSession(NOW + 1000, SECRET), 'other', NOW), false);
});

test('fail closed when the secret is missing', async () => {
  assert.equal(await isAuthorized(await signSession(NOW + 1000, SECRET), undefined, NOW), false);
  assert.equal(await isAuthorized(undefined, SECRET, NOW), false);
});

test('timingSafeEqualStr compares equal and unequal strings', () => {
  assert.equal(timingSafeEqualStr('abc', 'abc'), true);
  assert.equal(timingSafeEqualStr('abc', 'abd'), false);
  assert.equal(timingSafeEqualStr('abc', 'ab'), false);
});
