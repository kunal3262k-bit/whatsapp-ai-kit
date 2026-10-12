# Public / Admin Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the single public `apps/dashboard` into a secret-free public marketing site (`apps/public`) and a gated private cockpit (`apps/admin`), close all public Supabase access, and fold the unmerged `lead-push` work into the admin app.

**Architecture:** Two Vercel projects from one monorepo, each with its own Root Directory. `apps/public` is static marketing with zero Supabase secrets. `apps/admin` is a Next.js app whose `middleware.ts` gates every path/method with a secret-path + HMAC-signed `HttpOnly` cookie; unauthenticated requests get a byte-identical 404. Admin reads Supabase with the service-role key server-only.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind 3, TypeScript, npm workspaces, `@supabase/supabase-js`, `node:test`, Vercel Hobby, Supabase free.

**Spec:** `docs/superpowers/specs/2026-10-12-public-admin-split-design.md`

## Global Constraints

- Free tiers only. Never add a paid key/service or a Vercel Pro feature.
- Node >= 20. Next.js `14.2.35`, React `^18.3.1`, Tailwind `^3.4.13`, `@supabase/supabase-js` `^2.45.4`.
- Public "WhatsApp us" CTA = `https://wa.me/919717745568`.
- The public bundle must contain **no** Supabase key (neither anon nor service-role) and no admin code.
- Admin reads data with `SUPABASE_SERVICE_ROLE_KEY` server-side only; `NEXT_PUBLIC_SUPABASE_ANON_KEY` is removed from both apps.
- Unauthenticated access to the admin host returns a 404 for **all** paths and methods (incl. `OPTIONS`), with no `Set-Cookie` and no `WWW-Authenticate`.
- Admin env is fail-closed: missing `ADMIN_KEY` or `ADMIN_SESSION_SECRET` ⇒ everything 404s.
- The bot pushes notifications itself; the VAPID private key never lives on Vercel.
- Do not commit the admin host name, `ADMIN_KEY`, or `ADMIN_SESSION_SECRET` to the repo.

## Review Focus

Failure modes the spec implies but no single test name states, most likely first:

1. **Public host leaks a secret.** Someone loads the public site and its JS bundle contains an anon/service key or admin route. Task 3 pins `grep` over `apps/public/.next/static`.
2. **Unauthenticated admin request that is not a plain page GET gets through** (a POST to `/api/subscribe`, a GET of `/sw.js`, an `OPTIONS` preflight). Task 4 pins a per-method/per-path 404 test.
3. **Fail-open on missing/invalid env.** `ADMIN_KEY`/`ADMIN_SESSION_SECRET` unset serves the app. Task 4 pins `isAuthorized` returning false with an undefined secret.
4. **Cookie tampering.** Editing `exp` or the signature still authenticates. Task 4 pins `verifySession` rejecting a mutated value and an expired one.
5. **Public marketing pages break** (`/offer`, `/demo` 404 or lose styling) after the rename. Task 3 pins a build + a fetch of each public route.

---

### Task 1: Base branch with `lead-push` merged and the DB lockdown in the schema

**Files:**
- Modify: `apps/bot/supabase/schema.sql`
- Merge: branch `lead-push` (worktree at `.worktrees/lead-push`, tip `f68c879`)

**Interfaces:**
- Consumes: nothing.
- Produces: `main`-based branch `public-admin-split` containing the bot push code, dashboard PWA code, and a locked-down `schema.sql`. Later tasks start from this branch.

- [ ] **Step 1: Create the working branch**

Run: `git checkout -b public-admin-split`
Expected: `Switched to a new branch 'public-admin-split'`

- [ ] **Step 2: Merge the reviewed `lead-push` branch**

Run: `git merge --no-ff lead-push -m "merge: lead-push notifications"`
Expected: merge completes. Conflict expected in `apps/bot/supabase/schema.sql` only.

- [ ] **Step 3: Resolve `schema.sql` to the locked-down posture**

In `apps/bot/supabase/schema.sql`, keep the `push_subscriptions` table and `contacts.handoff_at` column from the merge, and take the **locked** RLS block from `public-admin-split` (no `create policy ... to anon`; instead):

```sql
alter table contacts  enable row level security;
alter table messages  enable row level security;
alter table leads     enable row level security;
alter table reminders enable row level security;
drop policy if exists "read contacts"  on contacts;
drop policy if exists "read messages"  on messages;
drop policy if exists "read leads"     on leads;
drop policy if exists "read reminders" on reminders;
revoke all on contacts, messages, leads, reminders from anon, authenticated;
```

- [ ] **Step 4: Verify the schema is locked**

Run: `grep -n 'to anon' apps/bot/supabase/schema.sql`
Expected: no output (no anon policies remain).

- [ ] **Step 5: Verify the bot builds and its tests pass**

Run: `npm run build -w apps/bot && npm test -w apps/bot`
Expected: build clean; `node --test` reports all tests passing (17 tests).

- [ ] **Step 6: Verify the dashboard still builds**

Run: `npm run build -w apps/dashboard`
Expected: `Compiled successfully` / route table printed.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "merge: lead-push notifications + lock down Supabase RLS"
```

---

### Task 2: Rename `apps/dashboard` → `apps/public` and strip every secret/admin asset

**Files:**
- Move: `apps/dashboard/` → `apps/public/` (`git mv`)
- Delete: `apps/public/app/api/leads/`, `apps/public/lib/supabase.ts`, `apps/public/lib/outreach.ts`, `apps/public/app/outreach/`, `apps/public/app/contract/`, `apps/public/app/pay/`, `apps/public/app/register-sw.tsx`, `apps/public/app/enable-notifications.tsx`, `apps/public/public/sw.js`, `apps/public/public/manifest.webmanifest`, `apps/public/public/icons/`
- Modify: `apps/public/package.json`, `apps/public/app/layout.tsx`, root `package.json`

**Interfaces:**
- Consumes: Task 1 branch.
- Produces: `apps/public` that imports `@supabase/supabase-js` nowhere.

- [ ] **Step 1: Move the directory**

Run: `git mv apps/dashboard apps/public`
Expected: rename staged for all files under `apps/public/`.

- [ ] **Step 2: Delete admin-only and secret files**

These files are not lost — their content is recovered from the still-existing `lead-push` branch in Tasks 5–7.

Run:
```bash
git rm -r apps/public/app/api apps/public/app/outreach apps/public/app/contract apps/public/app/pay
git rm apps/public/app/page.tsx apps/public/lib/supabase.ts apps/public/lib/outreach.ts apps/public/app/register-sw.tsx apps/public/app/enable-notifications.tsx
git rm apps/public/public/sw.js apps/public/public/manifest.webmanifest apps/public/public/icons/*.png
```

- [ ] **Step 2b: Add a placeholder home page so the build passes**

Create `apps/public/app/page.tsx`:
```tsx
export default function HomePage() {
  return <main className="p-8"><h1 className="text-2xl font-bold">Akra AI Automations</h1></main>;
}
```
Task 3 replaces this with the real landing page.

- [ ] **Step 3: Update `apps/public/package.json`**

Change `"name": "@kit/dashboard"` to `"name": "@kit/public"`. Leave scripts as `next dev/build/start -p 3000` and `tsc --noEmit`.

- [ ] **Step 4: Revert `apps/public/app/layout.tsx` to a plain shell**

Remove the `manifest` metadata field, the `viewport` export, and the `RegisterSw` import/render. Keep `import './globals.css'` and `Nav`. Set `metadata.title` to `Akra AI Automations` and `metadata.description` to `AI automation for growing businesses — WhatsApp assistants, booking, and content, set up in a day.`

- [ ] **Step 5: Update root `package.json` workspace scripts**

Replace the dashboard scripts with (bot + public only for now — `apps/admin` does not exist until Task 4):
```json
"dev:public": "npm run dev -w apps/public",
"build:public": "npm run build -w apps/public",
"start:public": "npm run start -w apps/public",
"typecheck": "npm run typecheck -w apps/bot && npm run typecheck -w apps/public",
"build": "npm run build -w apps/bot && npm run build -w apps/public"
```
Task 5 appends the `apps/admin` workspace to `typecheck`/`build` and adds `dev:admin`/`start:admin`.

- [ ] **Step 6: Verify no Supabase reference remains in public source**

Run: `grep -rn 'supabase\|SERVICE_ROLE\|ANON_KEY' apps/public --include='*.ts' --include='*.tsx'`
Expected: no output. (If any hit appears, remove it before continuing.)

- [ ] **Step 7: Build and commit**

Run: `npm run build -w apps/public`
Expected: success.
```bash
git add -A && git commit -m "refactor(public): rename dashboard to public, strip admin/secret assets"
```

---

### Task 3: Public landing page, public Nav, SEO files, rebrand

**Files:**
- Modify: `apps/public/app/page.tsx` (new landing), `apps/public/app/layout.tsx` (metadata), `apps/public/components/Nav.tsx`, `apps/public/app/offer/page.tsx`, `apps/public/app/demo/page.tsx`
- Create: `apps/public/app/robots.ts`, `apps/public/app/sitemap.ts`, `apps/public/app/not-found.tsx`

**Interfaces:**
- Consumes: `apps/public` from Task 2.
- Produces: public routes `/`, `/offer`, `/demo`, `/robots.txt`, `/sitemap.xml`. Nav links only to public routes.

- [ ] **Step 1: Replace the Nav with public-only links**

`apps/public/components/Nav.tsx`: `LINKS = [{ href: '/', label: 'Home' }, { href: '/offer', label: 'Services' }, { href: '/demo', label: 'Live Demo' }]` plus a right-aligned `<a href="https://wa.me/919717745568" ...>WhatsApp us</a>`. Brand text `Akra AI Automations`. No link may point to `/outreach`, `/contract`, `/pay`, or `/api/*`.

- [ ] **Step 2: Write the landing page**

`apps/public/app/page.tsx`: a static server component (no imports from `lib/`) with sections in order — Hero ("Never lose a customer who messages you after hours." + WhatsApp CTA `https://wa.me/919717745568` + `<Link href="/demo">` Try the live demo), trust strip (Delhi SMBs · ~24h delivery · one setup fee), three problem/what-we-do cards, a three-step "How it works", a live-demo link, pricing text block (starting-at, 50% advance, "we guarantee a working system, not sales"), FAQ, contact (WhatsApp, Delhi, email). Footer: brand only.

- [ ] **Step 3: Fix the offer page WhatsApp number and remove the placeholder**

`apps/public/app/offer/page.tsx`: set `const WHATSAPP = 'https://wa.me/919717745568?text=...'` (encode `Hi, I want the AI assistant for my business`) and delete the `91XXXXXXXXXX` value. Change the top label to `Akra AI Automations`.

- [ ] **Step 4: Strip internal wording from the demo page**

`apps/public/app/demo/page.tsx`: change the copy "This is what gets pushed to Google Sheets / Supabase." to "This is what the assistant captures for you.", and "exactly like the real bot writes to your CRM" to "exactly like our assistant does." Keep all behavior.

- [ ] **Step 5: Add SEO files**

`apps/public/app/robots.ts`:
```ts
import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' } };
}
```
`apps/public/app/sitemap.ts`: return entries for `/`, `/offer`, `/demo` with a `metadataBase`-relative `baseUrl` from `process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'`.
`apps/public/app/not-found.tsx`: a branded 404 with a link to `/`.

- [ ] **Step 6: Build and verify every public route resolves**

Run: `npm run build -w apps/public && npm run start -w apps/public &` then
`for p in / /offer /demo /robots.txt /sitemap.xml; do curl -s -o /dev/null -w "$p %{http_code}\n" http://localhost:3000$p; done`
Expected: all `200`.

- [ ] **Step 7: Verify the built public bundle carries no secret**

Run: `grep -rIl 'service_role\|SERVICE_ROLE\|supabase.co\|ANON_KEY' apps/public/.next/static apps/public/.next/server || echo CLEAN`
Expected: `CLEAN`.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(public): landing page, public nav, SEO, rebrand to Akra"
```

---

### Task 4: `apps/admin` skeleton, HMAC auth, and the fail-closed 404 gate

**Files:**
- Create: `apps/admin/package.json`, `apps/admin/next.config.mjs`, `apps/admin/postcss.config.mjs`, `apps/admin/tailwind.config.ts`, `apps/admin/tsconfig.json`, `apps/admin/app/globals.css`, `apps/admin/app/layout.tsx`, `apps/admin/app/not-found.tsx`
- Create: `apps/admin/lib/auth.ts`, `apps/admin/lib/auth.test.ts`, `apps/admin/app/enter/route.ts`, `apps/admin/middleware.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `SESSION_COOKIE: string` = `'admin_session'`; `SESSION_TTL_MS: number` = `90 * 24 * 60 * 60 * 1000`.
  - `signSession(exp: number, secret: string): Promise<string>` → `"<exp>.<hex hmac-sha256 of String(exp)>"`.
  - `verifySession(value: string | undefined, secret: string, nowMs?: number): Promise<boolean>`.
  - `isAuthorized(cookieValue: string | undefined, secret: string | undefined, nowMs?: number): Promise<boolean>`.
  - `timingSafeEqualStr(a: string, b: string): boolean`.
  - `middleware.ts` is the gate; `app/enter/route.ts` sets the cookie.
  - Auth uses **Web Crypto** (`crypto.subtle`) and async functions, because Next middleware runs on the Edge runtime where `node:crypto` is unavailable.

- [ ] **Step 1: Create `apps/admin/package.json`**

```json
{
  "name": "@kit/admin",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "test": "tsc -p tsconfig.json --outDir dist && node --test dist/**/*.test.js",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": { "@supabase/supabase-js": "^2.45.4", "next": "14.2.35", "react": "^18.3.1", "react-dom": "^18.3.1" },
  "devDependencies": { "@types/node": "^22.7.4", "@types/react": "^18.3.11", "@types/react-dom": "^18.3.0", "autoprefixer": "^10.4.20", "postcss": "^8.4.47", "tailwindcss": "^3.4.13", "typescript": "^5.6.3" }
}
```

- [ ] **Step 2: Copy the four config files, unchanged, from `apps/public`**

`next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts` (keep `@apply bg-slate-50` and the `brand` color), and `tsconfig.json` → identical copies into `apps/admin/`.

- [ ] **Step 3: Write the failing auth test**

`apps/admin/lib/auth.test.ts`:
```ts
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
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm test -w apps/admin`
Expected: FAIL — `Cannot find module './auth'`.

- [ ] **Step 5: Implement `apps/admin/lib/auth.ts`**

```ts
export const SESSION_COOKIE = 'admin_session';
export const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000;

const enc = new TextEncoder();

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function signSession(exp: number, secret: string): Promise<string> {
  return `${exp}.${await hmacHex(secret, String(exp))}`;
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifySession(value: string | undefined, secret: string, nowMs = Date.now()): Promise<boolean> {
  if (!value || !secret) return false;
  const dot = value.indexOf('.');
  if (dot <= 0) return false;
  const exp = Number(value.slice(0, dot));
  if (!Number.isFinite(exp) || exp < nowMs) return false;
  return timingSafeEqualStr(await signSession(exp, secret), value);
}

export async function isAuthorized(cookieValue: string | undefined, secret: string | undefined, nowMs = Date.now()): Promise<boolean> {
  if (!secret) return false;
  return verifySession(cookieValue, secret, nowMs);
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -w apps/admin`
Expected: all 6 tests pass. (`crypto` is the global Web Crypto, available in Node 18+ and on the Edge runtime.)

- [ ] **Step 7: Implement the gate `apps/admin/middleware.ts`**

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { isAuthorized, SESSION_COOKIE } from './lib/auth';

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  if (pathname === '/enter') return NextResponse.next();

  const secret = process.env.ADMIN_SESSION_SECRET;
  const authed = await isAuthorized(req.cookies.get(SESSION_COOKIE)?.value, secret);
  if (authed) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/__not_found__';
  return NextResponse.rewrite(url);
}

export const config = { matcher: ['/:path*'] };
```

- [ ] **Step 8: Implement `apps/admin/app/enter/route.ts`**

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { signSession, timingSafeEqualStr, SESSION_COOKIE, SESSION_TTL_MS } from '../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const key = req.nextUrl.searchParams.get('key') ?? '';
  const expected = process.env.ADMIN_KEY;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!expected || !secret || !timingSafeEqualStr(key, expected)) {
    return new NextResponse('Not Found', { status: 404 });
  }
  const res = NextResponse.redirect(new URL('/', req.url));
  res.cookies.set(SESSION_COOKIE, await signSession(Date.now() + SESSION_TTL_MS, secret), {
    httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: SESSION_TTL_MS / 1000,
  });
  return res;
}
```

- [ ] **Step 9: Add `apps/admin/app/not-found.tsx` and `app/layout.tsx`**

`not-found.tsx`: a plain `<main><h1>404</h1><p>This page could not be found.</p></main>` so rewritten requests look like a genuine not-found page. `layout.tsx`: imports `./globals.css`, `metadata.title = 'Admin'`, renders `<Nav />` from `components/Nav.tsx` (create with the admin links `/`, `/outreach`, `/contract`, `/pay`) and `{children}`. Also create a minimal `app/page.tsx` placeholder (`export default function Page() { return <main className="p-8">Admin</main>; }`) so the build has a root page; Task 5 replaces it with the CRM.

- [ ] **Step 10: Verify the gate end-to-end against a production start**

Run:
```bash
npm run build -w apps/admin
ADMIN_KEY=k ADMIN_SESSION_SECRET=s npm run start -w apps/admin &
sleep 3
curl -s -o /dev/null -w "unauth / %{http_code}\n" http://localhost:3000/
curl -s -o /dev/null -w "bad key %{http_code}\n" "http://localhost:3000/enter?key=wrong"
curl -s -i -o /tmp/enter.txt -w "good key %{http_code}\n" "http://localhost:3000/enter?key=k"
grep -i '^set-cookie' /tmp/enter.txt
curl -s -o /dev/null -w "OPTIONS /api/subscribe %{http_code}\n" -X OPTIONS http://localhost:3000/api/subscribe
```
Expected: `unauth / 404`, `bad key 404`, `good key 302`, a `Set-Cookie: admin_session=...` line, `OPTIONS ... 404`.

- [ ] **Step 11: Commit**

```bash
git add -A && git commit -m "feat(admin): secret-path gate with HMAC cookie and 404 parity"
```

---

### Task 5: Admin data layer, Leads CRM, and gated `/api/leads`

**Files:**
- Create: `apps/admin/lib/supabase.ts`, `apps/admin/app/api/leads/route.ts`
- Move/adapt: `apps/public/app/page.tsx` (old leads dashboard) → `apps/admin/app/page.tsx`
- Modify: `apps/admin/lib/auth.ts` (add `requireAdmin()`), root `package.json`, `apps/admin/components/Nav.tsx`

**Interfaces:**
- Consumes: `SESSION_COOKIE`, `verifySession` (Task 4).
- Produces: `getServiceClient(): SupabaseClient | null` (server-only); `requireAdmin(): Promise<void>` (server-only, throws/redirects when unauthenticated — defense-in-depth beneath middleware).

- [ ] **Step 1: Add `getServiceClient` (server-only)**

`apps/admin/lib/supabase.ts`:
```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

/** Server-only service-role client. Never import into a client component. */
export function getServiceClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!cached) cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
```

- [ ] **Step 2: Add `requireAdmin` to `apps/admin/lib/auth.ts`**

```ts
import { cookies } from 'next/headers';
/** Defense-in-depth check for server components/handlers; middleware is the primary gate. */
export async function requireAdmin(): Promise<boolean> {
  const store = await cookies();
  return isAuthorized(store.get(SESSION_COOKIE)?.value, process.env.ADMIN_SESSION_SECRET);
}
```

- [ ] **Step 3: Port the Leads CRM page**

Recover the source from the still-existing `lead-push` branch and adapt it:

Run: `mkdir -p apps/admin/app && git show lead-push:apps/dashboard/app/page.tsx > apps/admin/app/page.tsx`

Then in `apps/admin/app/page.tsx`: replace `getAdminClient()` with `getServiceClient()`; keep the existing `.select('id,name,phone,fields,qualified,created_at')` and `export const dynamic = 'force-dynamic'`; in the not-configured branch tell the reader to set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Do not import anything from `NEXT_PUBLIC_*`.

- [ ] **Step 4: Port and gate `/api/leads`**

`apps/admin/app/api/leads/route.ts`: same JSON shape as before (`{ count, leads }`) but using `getServiceClient()`. At the top of `GET`, if `!(await requireAdmin())` return `new NextResponse('Not Found', { status: 404 })`.

- [ ] **Step 5: Add the admin workspace scripts to root `package.json`**

Set `build`/`typecheck` to include `apps/admin`, and add `"dev:admin": "npm run dev -w apps/admin"`, `"start:admin": "npm run start -w apps/admin"`.

- [ ] **Step 6: Build and verify gated access**

Run:
```bash
npm run build -w apps/admin
ADMIN_KEY=k ADMIN_SESSION_SECRET=s SUPABASE_URL=x SUPABASE_SERVICE_ROLE_KEY=y npm run start -w apps/admin &
sleep 3
curl -s -o /dev/null -w "unauth /api/leads %{http_code}\n" http://localhost:3000/api/leads
```
Expected: `unauth /api/leads 404`.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(admin): service-role CRM and gated /api/leads"
```

---

### Task 6: Move the private tools (`/outreach`, `/contract`, `/pay`) into `apps/admin`

**Files:**
- Create (from `lead-push` branch source): `apps/admin/app/outreach/page.tsx`, `apps/admin/app/contract/page.tsx`, `apps/admin/app/pay/page.tsx`, `apps/admin/lib/outreach.ts`

**Interfaces:**
- Consumes: `apps/admin` from Tasks 4–5.
- Produces: admin routes `/outreach`, `/contract`, `/pay`, all behind the Task 4 gate.

- [ ] **Step 1: Recreate the tools in `apps/admin` from the `lead-push` branch**

Run:
```bash
mkdir -p apps/admin/app/outreach apps/admin/app/contract apps/admin/app/pay apps/admin/lib
git show lead-push:apps/dashboard/app/outreach/page.tsx > apps/admin/app/outreach/page.tsx
git show lead-push:apps/dashboard/app/contract/page.tsx > apps/admin/app/contract/page.tsx
git show lead-push:apps/dashboard/app/pay/page.tsx   > apps/admin/app/pay/page.tsx
git show lead-push:apps/dashboard/lib/outreach.ts    > apps/admin/lib/outreach.ts
```
The `../../lib/outreach` import in `outreach/page.tsx` stays valid from `app/outreach/`.

- [ ] **Step 2: Confirm `pay` still reads the UPI id from a server-safe env**

`pay/page.tsx` reads `process.env.NEXT_PUBLIC_UPI_VPA ?? '9717745568@ptsbi'`. Confirm the VPA is not rendered anywhere in `apps/public`.

Run: `grep -rn 'ptsbi\|UPI' apps/public --include='*.tsx'`
Expected: no output.

- [ ] **Step 3: Build and verify the tools 404 when unauthenticated**

Run:
```bash
npm run build -w apps/admin
ADMIN_KEY=k ADMIN_SESSION_SECRET=s npm run start -w apps/admin &
sleep 3
for p in /outreach /contract /pay; do curl -s -o /dev/null -w "$p %{http_code}\n" http://localhost:3000$p; done
```
Expected: each prints `404`.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(admin): move outreach, contract, and pay behind the gate"
```

---

### Task 7: Fold the `lead-push` PWA + subscribe work into `apps/admin`

**Files:**
- Create (from `lead-push` branch source) in `apps/admin`: `app/api/subscribe/route.ts`, `app/register-sw.tsx`, `app/enable-notifications.tsx`, `public/sw.js`, `public/manifest.webmanifest`, `public/icons/*.png`
- Modify: `apps/admin/app/layout.tsx` (manifest + viewport + `RegisterSw`), `apps/admin/app/page.tsx` (mount `EnableNotifications`)

**Interfaces:**
- Consumes: `getServiceClient` (Task 5), the gate (Task 4).
- Produces: `POST/DELETE /api/subscribe` (service-role write, gate-protected), `/sw.js`, `/manifest.webmanifest`, `/icons/*` all served only to authenticated clients.

- [ ] **Step 1: Restore the PWA assets and components into `apps/admin`**

Run:
```bash
mkdir -p apps/admin/app/api/subscribe apps/admin/public/icons
git show lead-push:apps/dashboard/app/api/subscribe/route.ts         > apps/admin/app/api/subscribe/route.ts
git show lead-push:apps/dashboard/app/register-sw.tsx                > apps/admin/app/register-sw.tsx
git show lead-push:apps/dashboard/app/enable-notifications.tsx       > apps/admin/app/enable-notifications.tsx
git show lead-push:apps/dashboard/public/sw.js                       > apps/admin/public/sw.js
git show lead-push:apps/dashboard/public/manifest.webmanifest        > apps/admin/public/manifest.webmanifest
for i in icon-192 icon-512 maskable-512; do git show "lead-push:apps/dashboard/public/icons/$i.png" > "apps/admin/public/icons/$i.png"; done
```
In `app/api/subscribe/route.ts`, change the import to `../../../lib/supabase` and add, at the top of `POST` and `DELETE`, a `requireAdmin()` guard returning `new NextResponse('Not Found', { status: 404 })` when false. `getServiceClient` already reads `process.env.SUPABASE_URL` (Task 5).

- [ ] **Step 2: Wire the layout**

`apps/admin/app/layout.tsx`: add `metadata.manifest = '/manifest.webmanifest'`, `export const viewport: Viewport = { themeColor: '#0d9488' }`, import and render `<RegisterSw />` inside `<body>`.

- [ ] **Step 3: Mount the notifications button on the CRM**

`apps/admin/app/page.tsx`: import `EnableNotifications` from `./enable-notifications` and render it in the page header row. It reads `process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY`.

- [ ] **Step 4: Build and verify the gate covers the new surface**

Run:
```bash
npm run build -w apps/admin
ADMIN_KEY=k ADMIN_SESSION_SECRET=s npm run start -w apps/admin &
sleep 3
curl -s -o /dev/null -w "unauth POST /api/subscribe %{http_code}\n" -X POST -H 'content-type: application/json' -d '{}' http://localhost:3000/api/subscribe
curl -s -o /dev/null -w "unauth GET /sw.js %{http_code}\n" http://localhost:3000/sw.js
curl -s -o /dev/null -w "unauth GET /manifest.webmanifest %{http_code}\n" http://localhost:3000/manifest.webmanifest
```
Expected: all three print `404` (a `400` for the POST would mean the gate leaked).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(admin): fold lead-push PWA and gated /api/subscribe into admin"
```

---

### Task 8: Docs, deploy configuration, and the human Supabase/Vercel steps

**Files:**
- Modify: `README.md`, `SYNC.md`, `.env.example`
- Create: `docs/superpowers/plans/2026-10-12-public-admin-split.md` (this file — already created)

**Interfaces:**
- Consumes: all prior tasks.
- Produces: documented two-project deployment and rotations.

- [ ] **Step 1: Update `.env.example`**

Document, for `apps/admin`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_KEY`, `ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `NEXT_PUBLIC_UPI_VPA`. For `apps/public`: `NEXT_PUBLIC_SITE_URL` only. State that no Supabase key belongs in the public app.

- [ ] **Step 2: Update `README.md` / `SYNC.md`**

Describe the two apps, the secret-path entry URL shape (`https://<admin-host>/enter?key=<ADMIN_KEY>`), and that `/enter` 404s without the key. Do not paste the real host or key.

- [ ] **Step 3: Generate the admin secrets (local, keep in a private note)**

Run: `openssl rand -hex 24` (ADMIN_KEY) and `openssl rand -hex 32` (ADMIN_SESSION_SECRET)
Expected: two hex strings. Record them privately; never commit.

- [ ] **Step 4: Human — apply the schema lockdown in Supabase**

Open Supabase → SQL Editor → Run the current `apps/bot/supabase/schema.sql`. Then confirm the anon key can no longer read leads — grab the anon key from Supabase → Project Settings → API and run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://uvczyygolwpsvmcmcxha.supabase.co/rest/v1/leads?select=id" -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>"
```
Expected: `401` (previously `200`/`[]`-with-policy). This step is a human action; no CLI/psql is available to the agent.

- [ ] **Step 5b: Human — confirm the old dashboard no longer shows leads**

Reload the existing `whatsapp-ai-kit` deployment's home page. Expected: the lead list is empty (the anon read was the leak).

- [ ] **Step 5: Human — rotate the anon key and remove it from the public app**

Supabase → Project Settings → API → rotate the anon key; remove `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the `whatsapp-ai-kit` Vercel project entirely.

- [ ] **Step 6: Human — create the admin Vercel project**

New Vercel project, Root Directory `apps/admin`, name not resembling the public site, env = the five admin vars from Step 1. Point the existing `whatsapp-ai-kit` project's Root Directory at `apps/public` and remove all Supabase env vars from it.

- [ ] **Step 7: Verify and commit**

Run: `npm run typecheck && npm run build`
Expected: both succeed for bot, public, and admin.
```bash
git add -A && git commit -m "docs: two-project deploy guide and rotated-secret steps"
```
