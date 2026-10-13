import test from 'node:test';
import assert from 'node:assert/strict';
import { PAY_PILLS, buildUpiQuery, payApps, qrSrcFor, upiUri } from './pay';

test('PAY_PILLS are ascending positive amounts', () => {
  assert.ok(PAY_PILLS.length >= 3);
  assert.ok(PAY_PILLS.every((p) => p > 0));
});

test('buildUpiQuery encodes payee, amount and currency', () => {
  const q = buildUpiQuery({ upiId: '9717745568@ptsbi', name: 'Kunal Sharma', amount: 8000 });
  assert.ok(q.includes('pa=9717745568%40ptsbi'));
  assert.ok(q.includes('am=8000'));
  assert.ok(q.includes('cu=INR'));
  assert.ok(!q.includes('tn='));
});

test('buildUpiQuery includes note when provided', () => {
  const q = buildUpiQuery({ upiId: 'a@b', name: 'X', amount: 1, note: 'Glow Salon' });
  assert.ok(q.includes('tn=Glow+Salon'));
});

test('upiUri and qrSrcFor embed the intent', () => {
  const uri = upiUri({ upiId: 'a@b', name: 'X', amount: 500 });
  assert.ok(uri.startsWith('upi://pay?'));
  assert.ok(qrSrcFor(uri).includes(encodeURIComponent(uri)));
});

test('payApps exposes four deep links reusing the query', () => {
  const apps = payApps('pa=a%40b&am=1');
  assert.equal(apps.length, 4);
  assert.equal(apps[0]!.href, 'gpay://upi/pay?pa=a%40b&am=1');
  assert.ok(apps.some((a) => a.label === 'Any UPI app'));
});
