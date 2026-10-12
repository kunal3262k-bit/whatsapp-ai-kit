# Public / Admin Split — Design

Date: 2026-10-12
Status: Draft for approval
Author: opencode (with Kunal)
Decided by agent team: software-architect, security-architect, product-manager (synthesized)

## Intent & why

Today one Vercel app (`apps/dashboard`) serves **everything publicly with no
auth**: client sales pages, Kunal's private cockpit (lead PII, the 110051
outreach list, pricing, UPI, contract), and unauthenticated JSON
(`/api/leads`). Anyone with the URL can read all of it, and the Supabase
tables are *also* readable directly with the public anon key (wide-open `anon`
SELECT policies in `apps/bot/supabase/schema.sql`).

We split the single app into a **public marketing site** and a **private admin
app**, so internal assets are never publicly reachable and the public site
gives **no hint** that an admin exists.

## Goals

- Public site: clean, client-facing, Akra AI Automations branded, converts.
- Private admin: leads, outreach, contract, payments, notifications —
  reachable only by Kunal.
- Unauthenticated access to admin returns a **plain 404** (no redirect, no
  401/`WWW-Authenticate`, no login hint).
- Remove **all** unauthenticated Supabase access (app *and* direct REST).

## Non-goals

- Multi-user accounts, roles, teams, SSO.
- Paid Vercel/Supabase features (Pro password protection, etc.).
- A native mobile app.

## Anti-goals (failure, even if it works)

- Any admin/PII bytes or secrets present on the public host.
- A login page or 401 that reveals the admin exists.
- Supabase tables readable with the anon key.
- Breaking the existing public `/offer`, `/demo`, `/pay` pages.

## Constraints

- Free tiers only (Vercel Hobby, Supabase free, Groq free).
- Next.js 14 App Router, Tailwind, npm-workspaces monorepo.
- Bot stays on Termux and sends pushes itself (VAPID private key never on Vercel).

## Decisions

### D1 — Two apps, two Vercel projects

- `apps/public` — rename of `apps/dashboard`; **static marketing site; zero
  Supabase secrets** (not even the anon key).
- `apps/admin` — new; private cockpit.
- Two Vercel projects, each with its own Root Directory. The existing
  `whatsapp-ai-kit` project points at `apps/public`; a new, non-obvious admin
  project points at `apps/admin`.
- Rationale: "no trace" becomes a **structural property** (the public host
  contains zero admin code/creds) instead of a promise kept by middleware
  discipline. Also matches the "re-skin per client" business model.
- **Fallback (documented, not chosen):** one app with route groups + a secret
  admin path and strict middleware. Meets the observable 404 rule but keeps
  admin code and the service-role key on the client-visited project. Kept only
  as a fallback.

### D2 — Page partition

| Current route | Goes to | Notes |
|---|---|---|
| `/` (leads dashboard) | **Admin** | Becomes Leads CRM; public `/` becomes a real landing page |
| `/api/leads` | **Admin** | Auth-gated JSON (currently a live PII leak) |
| `/outreach` | **Admin** | 110051 list, pitch angles, ₹30k tracker |
| `/contract` | **Admin** | Per-client scope/terms generator |
| `/pay` | **Admin** | UPI link/QR sent to clients; public shows pricing text only |
| `/offer` | **Public** | Services/offer page (rebranded Akra) |
| `/demo` | **Public** | Live simulator; strip internal wording |
| `/` (new) | **Public** | Landing: hero → how it works → live demo → pricing → FAQ → WhatsApp CTA |

- Public CTA button opens the bot's WhatsApp number (real number TBD by Kunal;
  bot currently runs as **91 97177 45568**).
- Public site gets its own `Nav`/`Footer`, `robots.txt`, `sitemap.xml`; it
  never links to admin and never mentions "WhatsApp AI Kit".

### D3 — Admin auth: secret path + signed cookie, unauth → 404

- Only reachable surface: the admin host. Auth by visiting
  `https://<admin-host>/enter?key=<ADMIN_KEY>` (high-entropy key from env);
  this validates the key constant-time, sets an `HttpOnly; Secure;
  SameSite=Strict` **HMAC-signed** cookie (`admin_session`, ~90-day expiry),
  and redirects to `/`. No `?key` / no cookie → 404.
- `apps/admin/middleware.ts` is the single gate (pages, APIs, `sw.js`,
  manifest, icons). Unauthenticated → **rewrite to a known-nonexistent path**
  so the response is byte-identical to a genuine 404 (correct status, no
  `Set-Cookie`, no `WWW-Authenticate`, all methods incl. `OPTIONS`).
- Fail closed: missing `ADMIN_KEY`/`ADMIN_SESSION_SECRET` → everything 404s.
- `requireAdmin()` re-check inside admin server components/handlers
  (defense-in-depth).
- Rejected: **Basic Auth** (401 challenge reveals a protected resource),
  **Vercel Password Protection** (Pro-only, shows a gate page), **Vercel
  Authentication** (redirects to SSO → reveals existence).

### D4 — Data exposure fix (do this first; it is the urgent one)

- Admin reads Supabase with the **service-role key, server-only**. Remove
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the browser entirely.
- `apps/bot/supabase/schema.sql`: **drop all `anon` SELECT policies**; keep RLS
  enabled with **no** public policies (default deny); `REVOKE ALL ... FROM
  anon, authenticated`.
- Optional hardening: move tables to a non-exposed schema.
- Rotate the anon key afterwards (it was public alongside open policies).
- `/api/subscribe` (from the unmerged `lead-push` branch) is currently an
  unauthenticated service-role **write**; it must land inside `apps/admin`
  behind the gate.

### D5 — Payments / UPI

- `/pay` is admin-only; Kunal sends the payment link/QR to a client.
- Public site shows **pricing text** only (starting-at, 50% advance), not the
  UPI VPA/QR.
- If public self-serve payment is wanted later, use a dedicated business VPA.

## Public landing outline

1. Hero — "Never lose a customer who messages you after hours." + WhatsApp CTA + "Try the live demo".
2. Trust strip — built for Delhi SMBs; ~24h delivery; one setup fee.
3. Problem — missed / after-hours enquiries leak revenue.
3. What we do — WhatsApp AI qualifier · booking + reminders · content engine · tools (+ agency breadth).
5. How it works — talk (10 min) → build on your number → you take leads.
6. Live demo — link `/demo`.
7. Pricing — starting-at, 50% advance, "we guarantee a working system, not sales".
8. FAQ.
9. Contact — WhatsApp button, Delhi, email.
10. Footer — brand + legal; no internal links.

## File-level change list (paths only)

Rename `apps/dashboard` → `apps/public`. New `apps/admin`. Both in the
`apps/*` workspace; root `package.json` unchanged.

Public: `app/{page,layout,offer,demo,robots,sitemap,not-found}.tsx`,
`components/Nav.tsx` (public links only); remove `app/api/leads`,
`lib/supabase.ts`, `lib/outreach.ts`, `app/outreach`, `app/contract`, `app/pay`.

Admin: `middleware.ts`, `app/{layout,page,outreach,contract,pay}.tsx`,
`app/api/{leads,subscribe}.tsx`, `app/enter/route.ts`, `app/register-sw.tsx`,
`app/enable-notifications.tsx`, `lib/{auth,supabase}.ts`, `public/{sw.js,
manifest.webmanifest,icons/*}`, `components/Nav.tsx`, `app/not-found.tsx`.

Other: `apps/bot/supabase/schema.sql` (RLS/policy changes), `.env.example`,
`docs/*`, and reconcile the `lead-push` branch into `apps/admin`.

## Vercel configuration

- Public project (`whatsapp-ai-kit`): Root Directory → `apps/public`; remove
  Supabase env; add `NEXT_PUBLIC_SITE_URL`.
- Admin project (new, non-obvious name): Root Directory `apps/admin`; env:
  `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_KEY`,
  `ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
- Do not commit the admin URL or `ADMIN_KEY` anywhere in the repo (repo is
  public on GitHub).

## Risks

1. Admin middleware is the single gate on the admin host → `requireAdmin()`
   defense-in-depth + fail-closed + a 404-parity smoke test.
2. Two Vercel roots from one monorepo can trip builds → no shared workspace
   package; duplicate the two small config files; build both locally first.
3. The DB lockdown and the app's service-role switch must deploy together, or
   the dashboard breaks.
4. Public `/` stops being the leads page (that is the point); bookmarks update
   once.

## Open questions for Kunal (only he can answer)

1. Confirm **two separate deployments** (recommended) vs one app with a hidden
   admin path.
2. Public "WhatsApp us" button should point to the bot number
   **91 97177 45568**?
3. Admin secret: shall we generate the passcode/key and put it in the admin
   Vercel env (you keep it in a private note)?
