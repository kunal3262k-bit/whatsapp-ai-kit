import test from 'node:test';
import assert from 'node:assert/strict';
import {
  digitsOnly,
  isLeadStatus,
  statusOf,
  toCsv,
  toLeadView,
  waLink,
  type RawLead,
} from './leads';

function lead(overrides: Partial<RawLead> = {}): RawLead {
  return {
    id: 1,
    name: 'Asha',
    phone: '+91 97177 45568',
    fields: { name: 'Asha', need: 'bridal makeup', when: 'Iss hafte' },
    qualified: true,
    status: 'new',
    created_at: '2026-10-13T05:00:00.000Z',
    ...overrides,
  };
}

test('isLeadStatus accepts known values only', () => {
  assert.equal(isLeadStatus('contacted'), true);
  assert.equal(isLeadStatus('bogus'), false);
  assert.equal(isLeadStatus(null), false);
  assert.equal(isLeadStatus(3), false);
});

test('statusOf falls back to qualified when status is missing', () => {
  assert.equal(statusOf({ qualified: true, status: null }), 'qualified');
  assert.equal(statusOf({ qualified: false, status: undefined }), 'new');
  assert.equal(statusOf({ qualified: false, status: 'human' }), 'human');
});

test('digitsOnly strips punctuation and spaces', () => {
  assert.equal(digitsOnly('+91 97177-45568'), '919717745568');
  assert.equal(digitsOnly(null), '');
});

test('waLink encodes the prefilled message and rejects empty phones', () => {
  assert.equal(waLink('+91 97177 45568'), 'https://wa.me/919717745568');
  assert.equal(
    waLink('919717745568', 'Hi there & welcome'),
    'https://wa.me/919717745568?text=Hi%20there%20%26%20welcome'
  );
  assert.equal(waLink('   '), null);
});

test('toLeadView maps common field keys and collects extras', () => {
  const view = toLeadView(
    lead({ fields: { name: 'Asha', business: 'Glow Salon', service: 'facial', timeline: 'Aaj', budget: '10k' } })
  );
  assert.equal(view.business, 'Glow Salon');
  assert.equal(view.need, 'facial');
  assert.equal(view.callTime, 'Aaj');
  assert.deepEqual(view.extras, [{ key: 'budget', value: '10k' }]);
  assert.equal(view.wa, 'https://wa.me/919717745568?text=Hi!%20Thanks%20for%20your%20enquiry.');
});

test('toLeadView tolerates null fields and missing name', () => {
  const view = toLeadView(lead({ fields: null, name: null }));
  assert.equal(view.business, null);
  assert.equal(view.need, null);
  assert.equal(view.callTime, null);
  assert.deepEqual(view.extras, []);
});

test('toCsv escapes commas and quotes', () => {
  const view = toLeadView(lead({ name: 'Asha, "The" Bride', fields: { need: 'facial' } }));
  const csv = toCsv([view]);
  const [header, row] = csv.split('\n');
  assert.equal(header, 'Created At,Name,Phone,Business,Need,Call Time,Status');
  assert.ok(row.includes('"Asha, ""The"" Bride"'));
});
