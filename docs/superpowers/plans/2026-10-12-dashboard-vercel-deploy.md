# Dashboard → Vercel Deploy (akra-ai-dashboard) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the existing Next.js dashboard to Vercel under the new project/link `akra-ai-dashboard`, protected by a password gate and wired to Supabase.

**Architecture:** The dashboard is a Next.js 14 App Router app in the `apps/dashboard` workspace of an npm-workspaces monorepo. Pages render server-side (`force-dynamic`) and read Supabase with the public anon key. We add an edge `middleware.ts` enforcing HTTP Basic Auth on every route, then deploy with the Vercel CLI from `apps/dashboard` (Vercel project root directory = `apps/dashboard`), with Supabase and auth env vars set on the Vercel project.

**Tech Stack:** Next.js 14.2, React 18, TypeScript, Tailwind, `@supabase/supabase-js` ^2.45, Vercel CLI (`npx vercel`).

**Spec:** `docs/superpowers/specs/2026-10-12-akra-ai-bot-design.md` (sections 8, "Deployment targets", "Access control").

## Global Constraints

- Free tier only (Vercel Hobby); nothing added may require a paid service.
- New project/link name: **`akra-ai-dashboard`** (NOT `whatsapp-ai-kit`).
- Vercel project **Root Directory = `apps/dashboard`**.
- Node **>= 20**.
- Required env (Vercel, Production): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DASHBOARD_USER`, `DASHBOARD_PASSWORD`.
- Never commit secrets; `.env` is gitignored. `.vercel/` must be gitignored too.
- Keep all existing routes working: `/`, `/demo`, `/outreach`, `/pay`, `/offer`, `/contract`, `/api/leads`.

## Review Focus

1. **Public PII exposure** — any visitor listing all leads. Expected: `401` without credentials for pages and `/api/leads`.
2. **Missing Supabase env** — dashboard shows the amber "Supabase not configured" hint, never a 500.
3. **Monorepo install** — install/build must resolve from the workspace root; a wrong root directory fails the build.
4. **Auth coverage** — once authenticated, all routes and assets still load (middleware matcher includes them).
5. **No hard-coded credentials** — auth values come only from env.

---

### Task 1: Basic Auth password gate

**Files:**
- Create: `apps/dashboard/middleware.ts`
- Modify: `.gitignore` (ignore `.vercel/`)

**Interfaces:**
- Consumes: env `DASHBOARD_USER`, `DASHBOARD_PASSWORD`.
- Produces: `middleware(request: NextRequest): NextResponse` (default export named `middleware`) + `config.matcher` covering all routes except Next internals; returns `401` with `WWW-Authenticate: Basic` when credentials are missing/wrong, otherwise `NextResponse.next()`.

- [ ] **Step 1: Demonstrate the failing state**

Run: `npm run dev:dashboard` (in another shell), then:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
```

Expected: `200` — the dashboard is currently fully public (this is the insecure behavior the gate must remove).

- [ ] **Step 2: Create `apps/dashboard/middleware.ts`**

Implement HTTP Basic Auth: parse the `Authorization` header, decode base64 `user:pass`, and compare against `DASHBOARD_USER` / `DASHBOARD_PASSWORD` using a constant-time compare (`crypto.timingSafeEqual`). On failure return `new NextResponse('Auth required', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="akra"' } })`. On success `return NextResponse.next()`. If either env var is unset, fail closed (401). Export `config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }`.

- [ ] **Step 3: Verify the gate (unauthenticated vs authenticated)**

Restart `npm run dev:dashboard`, then:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code}\n" -u "$DASHBOARD_USER:$DASHBOARD_PASSWORD" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/leads
```

Expected: `401`, `200`, `401`.

- [ ] **Step 4: Ignore `.vercel/`**

Add `.vercel/` to `.gitignore` under the build-output section.

- [ ] **Step 5: Commit**

```bash
git add apps/dashboard/middleware.ts .gitignore
git commit -m "feat(dashboard): basic-auth gate for public deploy"
```

---

### Task 2: Link the Vercel project and set env vars

**Files:**
- Create (generated, gitignored): `apps/dashboard/.vercel/`

**Interfaces:**
- Consumes: `VERCEL_TOKEN` (provided out-of-band by the user), values from root `.env`.
- Produces: linked Vercel project `akra-ai-dashboard` with Root Directory `apps/dashboard` and Production env vars set.

- [ ] **Step 1: Confirm authentication**

Run (from `apps/dashboard`):

```bash
npx vercel@latest whoami --token "$VERCEL_TOKEN"
```

Expected: prints the Vercel account/team username. If it errors, stop and request a valid token.

- [ ] **Step 2: Link/create the project**

Run (from `apps/dashboard`):

```bash
npx vercel@latest link --yes --project akra-ai-dashboard --token "$VERCEL_TOKEN"
```

Expected: writes `apps/dashboard/.vercel/project.json` and reports the project `akra-ai-dashboard`. Confirm the project's Root Directory is `apps/dashboard` (if the link reports a different root, set it in the Vercel dashboard and re-link).

- [ ] **Step 3: Set Production env vars**

Run (from `apps/dashboard`), piping the values from root `.env`:

```bash
for k in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY; do
  printf '%s' "$(grep -E "^$k=" ../../.env | cut -d= -f2-)" | npx vercel@latest env add "$k" production --token "$VERCEL_TOKEN"
done
printf '%s' 'akra'    | npx vercel@latest env add DASHBOARD_USER production --token "$VERCEL_TOKEN"
printf '%s' "$(openssl rand -hex 12)" | tee /tmp/dash_pw | npx vercel@latest env add DASHBOARD_PASSWORD production --token "$VERCEL_TOKEN"
```

Expected: four "Added … to production" confirmations. `DASHBOARD_PASSWORD` value is echoed to `/tmp/dash_pw` for the verification step.

- [ ] **Step 4: Confirm**

Run (from `apps/dashboard`):

```bash
npx vercel@latest env ls production --token "$VERCEL_TOKEN"
```

Expected: lists all four variables.

---

### Task 3: Production deploy, verify, and document

**Files:**
- Modify: `README.md` (append a "Live dashboard" section with the link + redeploy command)

**Interfaces:**
- Consumes: linked project + env from Task 2.
- Produces: a live `https://akra-ai-dashboard.vercel.app` URL.

- [ ] **Step 1: Deploy to production**

Run (from `apps/dashboard`):

```bash
npx vercel@latest deploy --prod --token "$VERCEL_TOKEN"
```

Expected: prints `Production: https://akra-ai-dashboard.vercel.app` (or the assigned alias). Capture the URL.

- [ ] **Step 2: Verify the gate and content**

Run, using the URL from Step 1 and the password from `/tmp/dash_pw`:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://akra-ai-dashboard.vercel.app/
curl -s -u "akra:$(cat /tmp/dash_pw)" https://akra-ai-dashboard.vercel.app/ | grep -c "Leads Dashboard"
```

Expected: `401`, then `1` (the authenticated page renders). If the amber "Supabase not configured" panel shows instead of the table, the Supabase env vars were missing at build — re-run Task 2 Step 3, then redeploy.

- [ ] **Step 3: Document in `README.md`**

Append a "Live dashboard" section: the URL, the Basic Auth requirement (`DASHBOARD_USER`/`DASHBOARD_PASSWORD`), and the redeploy command `npx vercel deploy --prod` from `apps/dashboard`.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: live dashboard URL + redeploy steps"
```

---

## NOTES (not part of the deliverable)

- This plan is **sub-project 1 of N**. Remaining plans (written after this ships): (2) Socket.IO relay + dashboard notifications/controls; (3) bot core features (Akra config, any-language, talk-to-human, 8am–11pm bands); (4) voice notes; (5) nurture/reminders; (6) Termux one-tap widget.
- `VERCEL_TOKEN` is required before Task 2. Add it to `.env` as `VERCEL_TOKEN=…` (gitignored) or export it.
