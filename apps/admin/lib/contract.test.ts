import test from 'node:test';
import assert from 'node:assert/strict';
import { PACKAGES, advanceOf, buildContract } from './contract';

test('packages are well-formed with positive amounts', () => {
  assert.ok(PACKAGES.length >= 4);
  for (const p of PACKAGES) {
    assert.ok(p.id && p.label);
    assert.ok(p.amount > 0);
  }
});

test('advanceOf is a rounded 50%', () => {
  assert.equal(advanceOf(8000), 4000);
  assert.equal(advanceOf(7001), 3501);
});

test('buildContract fills client, package, advance and the no-guarantee note', () => {
  const msg = buildContract({ client: 'Glow Salon', bizType: 'salon', pkgId: 'qualifier', amount: 8000 });
  assert.ok(msg.includes('Glow Salon'));
  assert.ok(msg.includes('(salon)'));
  assert.ok(msg.includes('AI WhatsApp Lead Qualifier + CRM'));
  assert.ok(msg.includes('₹8,000'));
  assert.ok(msg.includes('Advance: ₹4,000 (50%) to start'));
  assert.ok(msg.includes('12 hours'));
  assert.ok(msg.includes('do not guarantee'));
});

test('buildContract falls back to placeholder for empty client', () => {
  const msg = buildContract({ client: '', bizType: '', pkgId: 'custom', amount: 12000 });
  assert.ok(msg.includes('[client name]'));
  assert.ok(msg.includes('Custom AI Setup'));
});
