#!/usr/bin/env node
/**
 * Outreach accelerator — generate personalized first WhatsApp messages from a CSV.
 *
 * Usage:
 *   node tools/outreach/gen-messages.mjs input.csv [output.csv]
 *
 * Input CSV headers (any order, case-insensitive):
 *   name, category, area, phone, observation
 *
 * Output: a CSV with the personalized message for each row, ready to paste into WhatsApp.
 * Nothing is sent automatically — you copy/paste and send manually. That is intentional.
 */
import fs from 'node:fs';
import path from 'node:path';

const input = process.argv[2];
const output = process.argv[3] || 'tools/outreach/outbox.csv';

if (!input) {
  console.error('Usage: node tools/outreach/gen-messages.mjs input.csv [output.csv]');
  process.exit(1);
}

function parseCsv(text) {
  const rows = [];
  let cur = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { cur.push(field); field = ''; }
    else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows.filter((r) => r.some((x) => x.trim() !== ''));
}

function toObjects(rows) {
  const header = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => {
    const o = {};
    header.forEach((h, i) => (o[h] = (r[i] ?? '').trim()));
    return o;
  });
}

const CATEGORY_HOOK = {
  salon: 'salon ke WhatsApp enquiries',
  beauty: 'salon ke WhatsApp enquiries',
  gym: 'gym membership enquiries',
  clinic: 'clinic appointment enquiries',
  dental: 'dental appointment enquiries',
  physio: 'physiotherapy appointment enquiries',
  tuition: 'tuition admission enquiries',
  realestate: 'property lead enquiries',
  'real estate': 'property lead enquiries',
  boutique: 'customer enquiries',
};

function hook(category) {
  const c = (category || '').toLowerCase();
  for (const k of Object.keys(CATEGORY_HOOK)) if (c.includes(k)) return CATEGORY_HOOK[k];
  return 'customer enquiries';
}

function messageFor(row) {
  const name = row.name || 'ji';
  const h = hook(row.category);
  const obs = row.observation ? ` (${row.observation})` : '';
  return (
    `Namaste ${name}${obs} 🙏 Main Kunal. Main ${h} ke liye ek AI assistant banata hoon — ` +
    `jo customers ko turant reply karta hai aur har lead aapke Google Sheet mein save karta hai. ` +
    `Aapke WhatsApp number par, ek din mein set ho jaata hai. ` +
    `Kya main ek 90-second demo bhej sakta hoon? ` +
    `Interest na ho toh bas "No" likh dijiye, dobara message nahi karunga.`
  );
}

const text = fs.readFileSync(input, 'utf8');
const rows = toObjects(parseCsv(text));
const out = rows.map((row) => ({ ...row, message: messageFor(row) }));

const header = [...Object.keys(rows[0] || {}), 'message'];
const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const csv = [header.join(','), ...out.map((o) => header.map((k) => esc(o[k])).join(','))].join('\n');

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, csv, 'utf8');

console.log(`✓ Generated ${out.length} messages -> ${output}`);
console.log('\nExamples:\n');
out.slice(0, 3).forEach((o, i) => console.log(`${i + 1}. ${o.name}: ${o.message}\n`));
console.log('⚠️  Send these MANUALLY, max ~15-20/day, one follow-up max. Never bulk-blast.');
