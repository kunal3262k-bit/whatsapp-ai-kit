import test from 'node:test';
import assert from 'node:assert/strict';
import { isPushSubscriptionLike, urlBase64ToUint8Array } from './push-shared';

test('urlBase64ToUint8Array decodes url-safe base64 without padding', () => {
  const bytes = urlBase64ToUint8Array('AQAB'); // 1,0,1 in base64
  assert.deepEqual(Array.from(bytes), [1, 0, 1]);
  // URL-safe chars (- and _) are handled.
  const urlSafe = urlBase64ToUint8Array('-_8');
  assert.equal(urlSafe.length, 2);
});

test('isPushSubscriptionLike validates endpoint + keys', () => {
  const good = { endpoint: 'https://push.example/x', keys: { p256dh: 'abc', auth: 'def' } };
  assert.equal(isPushSubscriptionLike(good), true);
  assert.equal(isPushSubscriptionLike({ endpoint: 'ftp://x', keys: { p256dh: 'a', auth: 'b' } }), false);
  assert.equal(isPushSubscriptionLike({ endpoint: 'https://x' }), false);
  assert.equal(isPushSubscriptionLike({ endpoint: 'https://x', keys: { p256dh: '', auth: 'b' } }), false);
  assert.equal(isPushSubscriptionLike(null), false);
});
