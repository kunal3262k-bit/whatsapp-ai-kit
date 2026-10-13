import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PITCH_ANGLES,
  SEED_BUSINESSES,
  isTrackStatus,
  parseProspectCsv,
  toWaNumber,
  trackerTotal,
  waLinkFor,
} from './outreach';

test('seed list is populated and well-formed', () => {
  assert.ok(SEED_BUSINESSES.length >= 10);
  for (const b of SEED_BUSINESSES) {
    assert.ok(b.name && b.category && b.phone);
    assert.equal(b.phone.replace(/\D/g, '').length, 10);
  }
});

test('exposes five pitch angles and each fills a message', () => {
  assert.equal(PITCH_ANGLES.length, 5);
  for (const p of PITCH_ANGLES) {
    const msg = p.template(SEED_BUSINESSES[0]!);
    assert.ok(msg.includes(SEED_BUSINESSES[0]!.name));
    assert.ok(msg.includes('dobara message nahi karunga'));
  }
});

test('toWaNumber prefixes 91 for 10-digit locals, leaves others intact', () => {
  assert.equal(toWaNumber('9724514459'), '919724514459');
  assert.equal(toWaNumber('+91 97245 14459'), '919724514459');
  assert.equal(toWaNumber('919724514459'), '919724514459');
});

test('waLinkFor encodes the message', () => {
  assert.equal(
    waLinkFor('9724514459', 'Hi there & welcome'),
    'https://wa.me/919724514459?text=Hi%20there%20%26%20welcome'
  );
});

test('parseProspectCsv reads rows, skips headers and short lines', () => {
  const csv = ['name,category,area,phone', 'Smile Dental,dental,Geeta Colony,9811000000', 'bad,row', ''].join('\n');
  const rows = parseProspectCsv(csv);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], { name: 'Smile Dental', category: 'dental', area: 'Geeta Colony', phone: '9811000000' });
});

test('isTrackStatus and trackerTotal behave', () => {
  assert.equal(isTrackStatus('won'), true);
  assert.equal(isTrackStatus('maybe'), false);
  assert.equal(trackerTotal({ a: { status: 'won', advance: 5000 }, b: { status: 'new' } }), 5000);
});
