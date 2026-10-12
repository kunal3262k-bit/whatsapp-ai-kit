# Lead Push Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Buzz Kunal's Android phone (loud, long vibration, lock screen, Chrome closed) when a lead qualifies or the bot can't answer, and open that customer's WhatsApp chat on tap.

**Architecture:** The dashboard (`apps/dashboard`, Next.js on Vercel) becomes an installable PWA that registers a service worker and saves a Web Push subscription into Supabase. The bot (`apps/bot`, still running in Termux) reads those subscriptions with its service-role key and sends the push itself using VAPID keys — no relay, no extra server. Tapping the notification deep-links to `https://wa.me/<phone>`.

**Tech Stack:** TypeScript, Node 20+, `web-push`, Baileys bot, Next.js 14 App Router, Supabase, `node:test` (bot tests only).

**Spec:** `docs/superpowers/specs/2026-10-12-lead-push-notifications-design.md`

## Global Constraints

- Free tiers only. No paid service, ever.
- Target is **Android + Chrome**, on the same phone that runs the bot.
- Pushes only fire **while the bot process runs**.
- Web Push cannot set a custom sound; loudness is the phone's Chrome notification channel.
- One alert per event: these two events **replace** the WhatsApp self-message (`handoff.notify`), not add to it.
- `@lid`-only chats are **out of scope** (the current bot drops them entirely).
- Dashboard stays **public**; no auth is added.
- Vibration pattern is fixed: `[500,200,500,200,900,200,900]`; `requireInteraction: true`.
- Dedupe tag is keyed on the **jid**.
- Bot-stuck: send one holding line `"Ek second, main team se confirm karke batata hoon"`, then quiet; auto-resume that contact after **24h idle**.

## Review Focus

1. **Missing/odd phone number** — `qualifiedLeadPayload`/`stuckPayload` must produce a valid `wa.me` URL from a phone with non-digits stripped, and never `wa.me/` empty with a crashing throw.
2. **VAPID not configured** — the bot must keep running (no throw) when `VAPID_*` env is absent; `sendLeadPush` becomes a logged no-op.
3. **Dead subscription** — a `404`/`410` from the push service must disable that row, not crash the send loop, and must not stop the other sends.
4. **Idle-resume boundary** — a contact exactly at the threshold resumes; one under it does not; non-`human` contacts are untouched.
5. **Duplicate events** — two pushes for the same contact share the `lead-<jid>` tag so they collapse instead of stacking.

## File Structure

- `apps/bot/supabase/schema.sql` — add `push_subscriptions` + `contacts.handoff_at`.
- `apps/bot/src/env.ts` — add `VAPID_*` and `HANDOFF_IDLE_HOURS`.
- `apps/bot/src/lib/push.ts` (new) — payload builders, expiry check, subscription mapping, `sendLeadPush`.
- `apps/bot/src/lib/push.test.ts` (new) — `node:test` for the pure pieces.
- `apps/bot/src/lib/handoff.ts` (new) — `shouldResume`.
- `apps/bot/src/lib/handoff.test.ts` (new).
- `apps/bot/src/types.ts` — `Contact.handoffAt`.
- `apps/bot/src/store/supabase.ts` — map `handoff_at`.
- `apps/bot/src/flow.ts` — the two triggers + holding line + resume.
- `apps/bot/package.json` — `web-push` dep + `test` script.
- `apps/dashboard/public/manifest.webmanifest`, `public/sw.js`, `public/icons/*` (new).
- `apps/dashboard/app/layout.tsx` — manifest link + theme color + SW registration.
- `apps/dashboard/lib/supabase.ts` — add `getServiceClient()`.
- `apps/dashboard/app/api/subscribe/route.ts` (new).
- `apps/dashboard/app/enable-notifications.tsx` (new) — the button.
- `apps/dashboard/app/page.tsx` — mount the button.
- `.env.example` — document new keys.

---

### Task 1: Supabase schema — `push_subscriptions` + `contacts.handoff_at`

**Files:**
- Modify: `apps/bot/supabase/schema.sql`

**Interfaces:**
- Produces: table `push_subscriptions(id, endpoint, p256dh, auth, user_agent, enabled, created_at, last_seen_at)`, column `contacts.handoff_at timestamptz`.

- [ ] **Step 1: Append the DDL to `apps/bot/supabase/schema.sql`**

```sql
-- Web Push subscriptions (owner devices). Only the service role touches this.
create table if not exists push_subscriptions (
  id          bigint generated always as identity primary key,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
alter table push_subscriptions enable row level security;

-- Bot-stuck handoff timestamp (for auto-resume).
alter table contacts add column if not exists handoff_at timestamptz;
```

- [ ] **Step 2: Apply it in Supabase**

Run the whole `schema.sql` again in Supabase → SQL Editor. (Every statement is idempotent.)

- [ ] **Step 3: Verify the table exists**

Run against the project's REST endpoint (fill `$SVC` with the service-role key):
```bash
curl -s "https://uvczyygolwpsvmcmcxha.supabase.co/rest/v1/push_subscriptions?select=id&limit=1" \
  -H "apikey: $SVC" -H "Authorization: Bearer $SVC"
```
Expected: `[]` (HTTP 200), not an error.

- [ ] **Step 5: Commit**

```bash
git add apps/bot/supabase/schema.sql
git commit -m "feat(supabase): add push_subscriptions table and contacts.handoff_at"
```

---

### Task 1b — Bot dependencies and env

**Files:** `apps/bot/package.json`, `apps/bot/src/env.ts`

- [ ] **Step 1: Add `web-push` and the test script** to `apps/bot/package.json`:

```json
"dependencies": { "web-push": "^3.6.7", "...": "keep existing" },
"devDependencies": { "@types/web-push": "^3.6.4", "...": "keep existing" },
"scripts": { "test": "tsc -p tsconfig.json && node --test dist", "...": "keep existing" }
```

- [ ] **Step 2: Install** — `cd /root/whatsapp-ai-kit && npm install` (slow on the phone; wait it out).

- [ ] **Step 3: Add env keys** to `apps/bot/src/env.ts` inside `EnvSchema`:

```ts
VAPID_PUBLIC_KEY: z.string().default(''),
VAPID_PRIVATE_KEY: z.string().default(''),
VAPID_SUBJECT: z.string().default('mailto:owner@example.com'),
HANDOFF_IDLE_HOURS: z.coerce.number().default(24),
```

- [ ] **Step 4: Verify the bot still builds** — `cd apps/bot && npm run build`. Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/bot/package.json apps/bot/package-lock.json apps/bot/src/env.ts package-lock.json
git commit -m "feat(bot): add web-push dependency and VAPID/idle env vars"
```

---

### Task 2 — `lib/push.ts` pure payload logic (TDD)

**Files:** create `apps/bot/src/lib/push.ts`, `apps/bot/src/lib/push.test.ts`.

**Interfaces (produced):**
```ts
export interface PushPayload { title: string; body: string; url: string; tag?: string }
export interface SubscriptionRow { endpoint: string; p256dh: string; auth: string }
export function pushEnabled(): boolean
export function buildPayload(p: PushPayload): string
export function isExpired(err: unknown): boolean
export function toSubscription(row: { endpoint?: string; p256dh?: string; auth?: string }): SubscriptionRow | null
export function qualifiedLeadPayload(a: { name?: string; phone: string; jid: string; answers: Record<string,string> }): PushPayload
export function stuckPayload(a: { name?: string; phone: string; jid: string; message: string }): PushPayload
```

- [ ] **Step 1: Write the failing tests** — `apps/bot/src/lib/push.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPayload, isExpired, toSubscription, qualifiedLeadPayload, stuckPayload } from './push';

test('buildPayload carries vibrate + requireInteraction and the tag', () => {
  const p = JSON.parse(buildPayload({ title: 't', body: 'b', url: 'u', tag: 'x' }));
  assert.equal(p.title, 't');
  assert.equal(p.tag, 'x');
  assert.deepEqual(p.vibrate, [500, 200, 500, 200, 900, 200, 900]);
  assert.equal(p.requireInteraction, true);
});

test('qualifiedLeadPayload builds a wa.me url and jid tag', () => {
  const p = qualifiedLeadPayload({ name: 'Ravi', phone: '919812345678', jid: '919812345678@s.whatsapp.net', answers: { need: 'website' } });
  assert.equal(p.title, 'New qualified lead');
  assert.match(p.body, /Ravi/);
  assert.equal(p.url, 'https://wa.me/919812345678');
  assert.equal(p.tag, 'lead-919812345678@s.whatsapp.net');
});

test('qualifiedLeadPayload strips non-digits from the phone', () => {
  const p = qualifiedLeadPayload({ phone: '+91 98123-45678', jid: 'x@s.whatsapp.net', answers: {} });
  assert.equal(p.url, 'https://wa.me/919812345678');
});

test('isExpired only for 404/410', () => {
  assert.equal(isExpired({ statusCode: 410 }), true);
  assert.equal(isExpired({ statusCode: 404 }), true);
  assert.equal(isExpired({ statusCode: 400 }), false);
  assert.equal(isExpired(new Error('boom')), false);
});

test('toSubscription rejects incomplete rows', () => {
  assert.ok(toSubscription({ endpoint: 'e', p256dh: 'p', auth: 'a' }));
  assert.equal(toSubscription({ endpoint: 'e', p256dh: 'p' }), null);
  assert.equal(toSubscription({}), null);
});

test('stuckPayload titles as Needs you', () => {
  const p = stuckPayload({ phone: '919812345678', jid: 'j@s.whatsapp.net', message: 'do you do GST?' });
  assert.equal(p.title, 'Needs you');
  assert.match(p.body, /website|GST|98123|/); // at least the message or name shows
});
```

- [ ] **Step 2: Run and watch it fail** — `cd /root/whatsapp-ai-kit/apps/bot && npm test`. Expected: FAIL (module not found / not exported).

- [ ] **Step 3: Implement** `apps/bot/src/lib/push.ts` with the interfaces above. `buildPayload` returns `JSON.stringify({ title, body, url, tag: p.tag ?? 'lead', vibrate: [...], requireInteraction: true })`. `qualifiedLeadPayload` title `"New qualified lead"`, body `${name ?? 'Lead'} - ${Object.values(answers).join(', ')}`. `stuckPayload` title `"Needs you"`, body `${name ?? phone}: ${message}`. Both set `url = 'https://wa.me/' + phone.replace(/\D/g, '')` and `tag = 'lead-' + jid`. `pushEnabled()` returns `!!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY)`. `toSubscription` returns `null` unless all three fields are non-empty strings. `isExpired` checks `statusCode === 404 || 410`.

- [ ] **Step 4: Run tests** — `cd apps/bot && npm test`. Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add apps/bot/src/lib/push.ts apps/bot/src/lib/push.test.ts
git commit -m "feat(bot): push payload builders and validators"
```

---

### Task 3 — `sendLeadPush` (load, send, prune) (TDD)

**Files:** extend `apps/bot/src/lib/push.ts`; extend `apps/bot/src/lib/push.test.ts`.

**Interfaces (produced):**
```ts
export interface PushDeps {
  loadSubs: () => Promise<SubscriptionRow[]>
  send: (sub: SubscriptionRow, payload: string) => Promise<void>
  markExpired: (endpoint: string) => Promise<void>
}
export async function sendLeadPush(p: PushPayload, deps?: Partial<PushDeps>): Promise<void>
```

- [ ] **Step 1: Write the failing tests** (append to `push.test.ts`):

```ts
import { sendLeadPush } from './push';

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

test('sendLeadPush is a no-op when VAPID is missing', async () => {
  const sent: string[] = [];
  await sendLeadPush({ title: 't', body: 'b', url: 'u' }, {
    loadSubs: async () => [{ endpoint: 'ok', p256dh: 'p', auth: 'a' }],
    send: async (s) => { sent.push(s.endpoint); },
    markExpired: async () => {},
  });
  assert.equal(sent.length, 0); // env has no VAPID keys in test
});
```

- [ ] **Step 2: Run** — `cd apps/bot && npm test`. Expected: FAIL (`sendLeadPush` not exported).

- [ ] **Step 3: Implement** `sendLeadPush`, merging overrides over defaults:
  - If `!pushEnabled()` **and** no explicit `deps` were passed → log a warning and return.
  - Default `loadSubs`: `createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)`, select `endpoint,p256dh,auth` from `push_subscriptions` where `enabled = true`, map through `toSubscription`, drop nulls.
  - Default `send`: `webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY)` once, then `webpush.sendNotification({ endpoint, keys: { p256dh, auth } }, buildPayload(p))`.
  - Default `markExpired`: update `push_subscriptions` set `enabled = false` where `endpoint = e`.
  - Loop the subs; `try { await send(...) } catch (err) { if (isExpired(err)) await markExpired(sub.endpoint); else logger.warn(...) }`.

- [ ] **Step 4: Run** — `cd apps/bot && npm test`. Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add apps/bot/src/lib/push.ts apps/bot/src/lib/push.test.ts
git commit -m "feat(bot): sendLeadPush with expired-subscription pruning"
```

---

### Task 4 — `shouldResume` + `contacts.handoff_at` mapping (TDD)

**Files:** create `apps/bot/src/lib/handoff.ts` + `handoff.test.ts`; edit `apps/bot/src/types.ts`; edit `apps/bot/src/store/supabase.ts`.

**Interfaces (produced):**
```ts
export function shouldResume(c: { status: string; handoffAt?: string }, nowMs: number, idleHours: number): boolean
```
`Contact` gains `handoffAt?: string`.

- [ ] **Step 1: Write the failing test** — `apps/bot/src/lib/handoff.test.ts`:

```ts
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
test('ignores non-human and missing handoffAt', () => {
  assert.equal(shouldResume({ status: 'qualified', handoffAt: ago(99) }, now, 24), false);
  assert.equal(shouldResume({ status: 'human' }, now, 24), false);
});
```

- [ ] **Step 2: Run** — `cd apps/bot && npm test`. Expected: FAIL.

- [ ] **Step 3: Implement** `shouldResume` = `c.status === 'human' && !!c.handoffAt && nowMs - Date.parse(c.handoffAt) > idleHours * 3600_000`. Add `handoffAt?: string` to `Contact` in `types.ts`. In `store/supabase.ts` map `handoff_at` in `getContact` (`handoffAt: data.handoff_at ?? undefined`) and write it in `upsertContact` (`handoff_at: c.handoffAt ?? null`).

- [ ] **Step 4: Run** — `cd apps/bot && npm test`. Expected: pass. Then `npm run build` — no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/bot/src/lib/handoff.ts apps/bot/src/lib/handoff.test.ts apps/bot/src/types.ts apps/bot/src/store/supabase.ts
git commit -m "feat(bot): handoff_at field and idle-resume decision"
```

---

### Task 5 — Wire the triggers into `flow.ts`

**Files:** edit `apps/bot/src/flow.ts`.

- [ ] **Step 1: Replace the owner WhatsApp notify with a push** in the finish branch (currently the `config.handoff.notify` block that awaits `deps.notifyOwner`):

```ts
if (qualified && config.handoff.notify) {
  await sendLeadPush(qualifiedLeadPayload({ name: contact.name, phone, jid, answers: contact.answers }));
}
```

- [ ] **Step 2: Add a `handleStuck` helper** and call it from the two branches where `looksLikeQuestion(text)` is true but `ans` is null:

```ts
async function handleStuck(jid: string, phone: string, contact: Contact, text: string, deps: FlowDeps): Promise<void> {
  contact.status = 'human';
  contact.handoffAt = nowIso();
  contact.updatedAt = nowIso();
  await getStore().upsertContact(contact);
  await deps.sendText(jid, 'Ek second, main team se confirm karke batata hoon');
  await sendLeadPush(stuckPayload({ name: contact.name, phone, jid, message: text }));
}
```
Only call it when `aiEnabled()` is true (per spec — don't page on an outage). In the mid-qualification branch, when stuck, **do not** re-ask the question (skip the requeue).

- [ ] **Step 3: Add auto-resume at the top of the handler**, right after the contact is loaded and before the `human` early-return:

```ts
if (shouldResume(contact, Date.now(), env.HANDOFF_IDLE_HOURS)) {
  contact.status = contact.step >= config.qualification.fields.length ? 'qualified' : 'qualifying';
  contact.handoffAt = undefined;
}
```

- [ ] **Step 4: Verify** — `cd apps/bot && npm run build`. Expected: no errors. (Flow is verified live in Task 8.)

- [ ] **Step 5: Commit**

```bash
git add apps/bot/src/flow.ts
git commit -m "feat(bot): push on qualified lead and on stuck, with idle auto-resume"
```

---

### Task 6 — Dashboard service-role client + `/api/subscribe`

**Files:** edit `apps/dashboard/lib/supabase.ts`; create `apps/dashboard/app/api/subscribe/route.ts`.

**Interfaces (produced):** `getServiceClient(): SupabaseClient | null` (uses server-only `SUPABASE_SERVICE_ROLE_KEY`); `POST /api/subscribe` accepts `{ endpoint, keys: { p256dh, auth } }` and upserts; `DELETE` removes by `endpoint`.

- [ ] **Step 1: Add `getServiceClient()`** to `lib/supabase.ts`:

```ts
export function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
```

- [ ] **Step 2: Create the route** `app/api/subscribe/route.ts`:
  - `export const dynamic = 'force-dynamic'`.
  - `POST`: parse JSON body; require non-empty `endpoint`, `keys.p256dh`, `keys.auth`; return `400` otherwise. Upsert into `push_subscriptions` with `{ endpoint, p256dh, auth, enabled: true, last_seen_at: new Date().toISOString() }` (on conflict `endpoint`). Return `201 { ok: true }`; `503` if `getServiceClient()` is null; `500` on error.
  - `DELETE`: accept `?endpoint=` and delete that row; `200 { ok: true }`.

- [ ] **Step 3: Verify build** — `cd /root/whatsapp-ai-kit/apps/dashboard && npm run build`. Expected: compiles.

- [ ] **Step 4: Verify validation** — `npm run dev` then:
  `curl -s -o /dev/null -w "%{http_code}" -X POST localhost:3000/api/subscribe -H 'content-type: application/json' -d '{}'` → `400`.

- [ ] **Step 5: Commit**

```bash
git add apps/dashboard/lib/supabase.ts apps/dashboard/app/api/subscribe/route.ts
git commit -m "feat(dashboard): /api/subscribe to store push subscriptions"
```

---

### Task 7 — PWA shell: manifest, icons, service worker, registration

**Files:** create `apps/dashboard/public/manifest.webmanifest`, `public/sw.js`, `public/icons/*`, `scripts/make-icons.mjs`; edit `apps/dashboard/app/layout.tsx`.

- [ ] **Step 1: Create `scripts/make-icons.mjs`** (writes solid-color PNGs; run from repo root):

```js
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const T = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = T[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
const png = (size, [r, g, b]) => {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0; for (let x = 0; x < size; x++) { const o = y * (size * 4 + 1) + 1 + x * 4; raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255; } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
};
mkdirSync('apps/dashboard/public/icons', { recursive: true });
for (const s of [192, 512]) writeFileSync(`apps/dashboard/public/icons/icon-${s}.png`, png(s, [13, 148, 136]));
writeFileSync('apps/dashboard/public/icons/maskable-512.png', png(512, [13, 148, 136]));
console.log('icons written');
```

- [ ] **Step 2: Generate** — `node scripts/make-icons.mjs`. Expected: three PNGs exist.

- [ ] **Step 3: Create `public/manifest.webmanifest`:**

```json
{
  "name": "WhatsApp AI Kit",
  "short_name": "AI Kit",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0d9488",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- [ ] **Step 4: Create `public/sw.js`:**

```js
self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = {}; }
  event.waitUntil(self.registration.showNotification(d.title || 'WhatsApp AI Kit', {
    body: d.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: d.tag,
    vibrate: d.vibrate || [500, 200, 500, 200, 900, 200, 900],
    requireInteraction: true,
    data: { url: d.url || '/' },
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const url = (event.notification.data && event.notification.data.url) || '/';
    for (const c of list) if (c.url === url && 'focus' in c) return c.focus();
    return clients.openWindow(url);
  }));
});
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(self.registration.pushManager.subscribe(event.oldSubscription.options).then((sub) =>
    fetch('/api/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(sub) })
  ));
});
```

- [ ] **Step 5: Register the SW + link the manifest** in `app/layout.tsx`: add `manifest: '/manifest.webmanifest'` and `themeColor: '#0d9488'` to the exported `metadata`, and add a small client `<Script>`/`useEffect` that runs `navigator.serviceWorker.register('/sw.js')` on load (a tiny `app/register-sw.tsx` client component is fine).

- [ ] **Step 6: Verify** — `cd apps/dashboard && npm run build`; run dev and confirm `curl -s -o /dev/null -w "%{http_code}" localhost:3000/manifest.webmanifest` → `200` and `localhost:3000/sw.js` → `200`.

- [ ] **Step 7: Commit**

```bash
git add apps/dashboard/public apps/dashboard/app/layout.tsx apps/dashboard/app/register-sw.tsx scripts/make-icons.mjs
git commit -m "feat(dashboard): PWA manifest, icons, service worker, registration"
```

---

### Task 8 — Enable-notifications button + device verification

**Files:** create `apps/dashboard/app/enable-notifications.tsx`; edit `apps/dashboard/app/page.tsx`; edit `.env.example`.

- [ ] **Step 1: Create the client component** `app/enable-notifications.tsx`:
  - Renders a button showing state. On click: `await navigator.serviceWorker.ready`; `Notification.requestPermission()`; if granted, `reg.pushManager.getSubscription()` or `reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) })`; `POST /api/subscribe` with `sub.toJSON()`. Include the standard `urlBase64ToUint8Array` helper.
  - If permission denied or the browser is unsupported, show that plainly.

- [ ] **Step 2: Render it** on `app/page.tsx` (top of the page, near the header).

- [ ] **Step 3: Update `.env.example`** with commented blocks:
  - Bot: `VAPID_PUBLIC_KEY=`, `VAPID_PRIVATE_KEY=`, `VAPID_SUBJECT=mailto:you@example.com`, `HANDOFF_IDLE_HOURS=24`.
  - Dashboard: `NEXT_PUBLIC_VAPID_PUBLIC_KEY=`, `SUPABASE_SERVICE_ROLE_KEY=` (server-only).

- [ ] **Step 4: Generate VAPID keys** — `npx web-push generate-vapid-keys`. Put the public key in Vercel's `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and both keys in the bot `.env`.

- [ ] **Step 5: Build** — `cd apps/dashboard && npm run build`. Expected: compiles.

- [ ] **Step 6: Live device test (the real acceptance test):**
  1. Deploy the dashboard (push to `main`; Vercel auto-deploys).
  2. On the phone, open the dashboard in Chrome, tap **Enable notifications**, allow.
  3. Restart the bot (`npm run dev` in `apps/bot`) with the VAPID env set.
  4. Message the bot from a **second number** and finish qualifying → confirm the locked phone buzzes loud with long vibration and tapping opens that WhatsApp chat.
  5. Exempt Chrome and Termux from Android battery optimization.
  6. Confirm the row landed in Supabase: `select endpoint,enabled from push_subscriptions`.

- [ ] **Step 7: Commit**

```bash
git add apps/dashboard/app/enable-notifications.tsx apps/dashboard/app/page.tsx .env.example
git commit -m "feat(dashboard): enable-notifications button; docs for VAPID env"
```

---

## Self-Review

**Spec coverage:** PWA shell (T7), subscribe flow + API (T6, T8), service worker push/click/vibrate (T7), `push_subscriptions` RLS (T1), bot sender + prune (T3), qualified-lead trigger (T5), stuck trigger + holding line (T5), 24h auto-resume (T4, T5), full-detail lock screen (T2 payload), jid dedupe tag (T2), public dashboard/no auth (T6 — no middleware added), wa.me deep link (T2/T7), env + onboarding (T1b, T8). All covered.

**Type consistency:** `PushPayload`, `SubscriptionRow`, `sendLeadPush`, `buildPayload`, `isExpired`, `toSubscription`, `pushEnabled`, `qualifiedLeadPayload`, `stuckPayload`, `shouldResume`, `Contact.handoffAt`, `HANDOFF_IDLE_HOURS` are used identically across tasks.

**Review Focus → tests:** #1 phone normalization (T2 test), #2 VAPID-missing no-op (T3 test), #3 prune on 410 (T3 test), #4 resume boundary (T4 tests), #5 tag dedupe (T2 test asserts `lead-<jid>`; actual browser collapse is verified live in T8).

**Proportion:** Tasks pin signatures, exact copy, and test assertions; only the icon writer and `sw.js` are given in full, because neither is derivable from a signature.

## Open risk carried from the spec

- `@lid`-only chats are dropped by the current bot, so they get no reply and no push. Tracked separately, not in this plan.
- `requireInteraction`/`vibrate` are best-effort on Android; T8 step 6 is where we learn the truth on the device.
