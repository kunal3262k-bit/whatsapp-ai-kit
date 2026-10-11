#!/usr/bin/env node
// One-command setup: creates .env and config/client.json from examples if missing.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function copyIfMissing(from, to, label) {
  if (fs.existsSync(to)) {
    console.log(`• ${label} already exists — leaving it alone.`);
    return;
  }
  fs.copyFileSync(from, to);
  console.log(`✓ Created ${label} from example.`);
}

console.log('\n=== WhatsApp AI Kit setup ===\n');

copyIfMissing(path.join(root, '.env.example'), path.join(root, '.env'), '.env');
copyIfMissing(
  path.join(root, 'config', 'client.example.json'),
  path.join(root, 'config', 'client.json'),
  'config/client.json'
);

console.log(`
Next steps:
  1. Edit .env         -> add AI_API_KEY (free Groq key: https://console.groq.com/keys)
  2. Edit config/client.json -> set business name, questions, and personality
  3. Run:  npm install
  4. Run:  npm run dev:bot
  5. Scan the QR with the client's WhatsApp (Linked devices)

Optional:
  • Google Sheet leads -> follow docs/apps-script/Code.gs, then set GOOGLE_SHEET_WEBHOOK_URL
  • Dashboard          -> cd apps/dashboard && npm run dev
  • Cloud storage      -> set STORAGE=supabase + Supabase keys, run supabase/schema.sql
`);
