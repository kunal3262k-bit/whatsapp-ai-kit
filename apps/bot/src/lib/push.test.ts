import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPayload, isExpired, pushEnabled, toSubscription, qualifiedLeadPayload, stuckPayload, sendLeadPush } from './push';

test('buildPayload carries vibrate + requireInteraction and the tag', () => {
  const p = JSON.parse(buildPayload({ title: 't', body: 'b', url: 'u', tag: 'x' }));
  assert.equal(p.title, 't');
  assert.equal(p.body, 'b');
  assert.equal(p.url, 'u');
  assert.equal(p.tag, 'x');
  assert.deepEqual(p.vibrate, [500, 200, 500, 200, 900, 200, 900]);
  assert.equal(p.requireInteraction, true);
});

test('buildPayload defaults the tag when absent', () => {
  const p = JSON.parse(buildPayload({ title: 't', body: 'b', url: 'u' }));
  assert.equal(p.tag, 'lead');
});

test('qualifiedLeadPayload builds a wa.me url and jid tag', () => {
  const p = qualifiedLeadPayload({ name: 'Ravi', phone: '919812345678', jid: '919812345678@s.whatsapp.net', answers: { need: 'website' } });
  assert.equal(p.title, 'New qualified lead');
  assert.match(p.body, /Ravi/);
  assert.match(p.body, /website/);
  assert.equal(p.url, 'https://wa.me/919812345678');
  assert.equal(p.tag, 'lead-919812345678@s.whatsapp.net');
});

test('qualifiedLeadPayload strips non-digits from the phone', () => {
  const p = qualifiedLeadPayload({ phone: '+91 98123-45678', jid: 'x@s.whatsapp.net', answers: {} });
  assert.equal(p.url, 'https://wa.me/919812345678');
});

test('qualifiedLeadPayload falls back to Lead when name is missing', () => {
  const p = qualifiedLeadPayload({ phone: '919812345678', jid: 'x@s.whatsapp.net', answers: { need: 'website' } });
  assert.equal(p.body, 'Lead - website');
});

test('isExpired only for 404/410', () => {
  assert.equal(isExpired({ statusCode: 410 }), true);
  assert.equal(isExpired({ statusCode: 404 }), true);
  assert.equal(isExpired({ statusCode: 400 }), false);
  assert.equal(isExpired(new Error('boom')), false);
  assert.equal(isExpired(null), false);
});

test('toSubscription rejects incomplete rows', () => {
  assert.deepEqual(toSubscription({ endpoint: 'e', p256dh: 'p', auth: 'a' }), { endpoint: 'e', p256dh: 'p', auth: 'a' });
  assert.equal(toSubscription({ endpoint: 'e', p256dh: 'p' }), null);
  assert.equal(toSubscription({ endpoint: 'e', auth: 'a' }), null);
  assert.equal(toSubscription({}), null);
  assert.equal(toSubscription({ endpoint: '', p256dh: 'p', auth: 'a' }), null);
});

test('pushEnabled is false without VAPID keys, true with them', () => {
  assert.equal(pushEnabled({ VAPID_PUBLIC_KEY: '', VAPID_PRIVATE_KEY: '', SUPABASE_URL: 'u', SUPABASE_SERVICE_ROLE_KEY: 'k' }), false);
  assert.equal(pushEnabled({ VAPID_PUBLIC_KEY: 'pub', VAPID_PRIVATE_KEY: '', SUPABASE_URL: 'u', SUPABASE_SERVICE_ROLE_KEY: 'k' }), false);
  assert.equal(pushEnabled({ VAPID_PUBLIC_KEY: 'pub', VAPID_PRIVATE_KEY: 'priv', SUPABASE_URL: 'u', SUPABASE_SERVICE_ROLE_KEY: 'k' }), true);
});

test('stuckPayload titles as Needs you and shows the message', () => {
  const p = stuckPayload({ phone: '919812345678', jid: 'j@s.whatsapp.net', message: 'do you do GST?' });
  assert.equal(p.title, 'Needs you');
  assert.match(p.body, /do you do GST\?/);
  assert.equal(p.url, 'https://wa.me/919812345678');
  assert.equal(p.tag, 'lead-j@s.whatsapp.net');
});

test('sendLeadPush sends to every sub and prunes the expired one', async () => {
  const sent: string[] = [];
  const expired: string[] = [];
  await sendLeadPush({ title: 't', body: 'b', url: 'u' }, {
    loadSubs: async () => [
      { endpoint: 'ok', p256dh: 'p', auth: 'a' },
      { endpoint: 'dead', p256dh: 'p', auth: 'a' },
    ],
    send: async (sub) => { sent.push(sub.endpoint); if (sub.endpoint === 'dead') throw { statusCode: 410 }; },
    markExpired: async (e) => { expired.push(e); },
  });
  assert.deepEqual(sent, ['ok', 'dead']);
  assert.deepEqual(expired, ['dead']);
});

test('sendLeadPush swallows non-expired send errors and continues', async () => {
  const sent: string[] = [];
  const expired: string[] = [];
  await sendLeadPush({ title: 't', body: 'b', url: 'u' }, {
    loadSubs: async () => [
      { endpoint: 'a', p256dh: 'p', auth: 'a' },
      { endpoint: 'b', p256dh: 'p', auth: 'a' },
    ],
    send: async (sub) => { sent.push(sub.endpoint); if (sub.endpoint === 'a') throw new Error('network'); },
    markExpired: async (e) => { expired.push(e); },
  });
  assert.deepEqual(sent, ['a', 'b']);
  assert.deepEqual(expired, []);
});

test('sendLeadPush is a no-op (does not throw) when VAPID is missing', async () => {
  await sendLeadPush(
    { title: 't', body: 'b', url: 'u' },
    undefined,
    { VAPID_PUBLIC_KEY: '', VAPID_PRIVATE_KEY: '', SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '' }
  );
});
