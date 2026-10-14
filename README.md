# WhatsApp AI Kit

A reusable, free-tier delivery kit for selling **AI WhatsApp assistants** to local businesses
(salons, clinics, gyms, tuition centres, real-estate agents). Clone it, point it at a client,
and hand over a working system the same day.

> **Stack (100% free):** Baileys (WhatsApp Web) · Groq (GPT-OSS) · Supabase or JSON · Google Sheets ·
> Next.js on Vercel. No paid APIs, no official WhatsApp Business API.

---

## What's inside

| App | What it does |
|---|---|
| `apps/bot` | The WhatsApp AI agent: greeting → qualification questions → auto reply → push lead → reminders. |
| `apps/public` | Public marketing site (landing, `/offer`). Static, holds **no** Supabase key or secret. |
| `apps/admin` | Gated admin cockpit (leads CRM, outreach, contract, pay, push, bot status). Server-side only. |
| `config/*.json` | One file per client: business info, personality, questions, guardrails. |
| `docs/` | Deploy, onboarding, demo script, Apps Script sheet sink, tracker template. |
| `tools/outreach` | Generates personalized first messages from a CSV of businesses. |

```
whatsapp-ai-kit/
├── apps/
│   ├── bot/                     # Node + Baileys + Groq
│   │   ├── src/
│   │   │   ├── index.ts         # bootstrap
│   │   │   ├── config.ts        # loads config/<CLIENT>.json
│   │   │   ├── env.ts           # loads + validates .env
│   │   │   ├── flow.ts          # conversation engine (qualification)
│   │   │   ├── whatsapp.ts      # Baileys connect / QR / reconnect / send
│   │   │   ├── reminders.ts     # cron follow-ups
│   │   │   ├── leads.ts         # Google Sheet sink
│   │   │   ├── lib/ai.ts        # Groq/OpenAI-compatible client
│   │   │   ├── lib/ratelimit.ts # anti-spam pacing
│   │   │   └── store/           # local JSON or Supabase
│   │   └── supabase/schema.sql
│   ├── public/                  # Next.js marketing site (no secrets)
│   │   ├── app/page.tsx         # landing page
│   │   └── app/offer/page.tsx   # one-page offer/demo site
│   └── admin/                   # Next.js admin cockpit (gated, server-side only)
│       ├── middleware.ts        # secret-path gate (byte-identical 404 when locked)
│       ├── app/enter/route.ts   # /enter?key=<ADMIN_KEY> sets the session cookie
│       ├── app/page.tsx         # leads CRM
│       ├── app/{outreach,contract,pay,push,status}/page.tsx
│       └── app/api/{leads,bot-status,push/subscribe,push/send}/route.ts
├── config/
│   ├── client.example.json
│   └── salon.example.json
├── docs/
│   ├── DEPLOY.md
│   ├── ONBOARDING.md
│   ├── DEMO_SCRIPT.md
│   ├── tracker-template.csv
│   └── apps-script/Code.gs
├── tools/outreach/gen-messages.mjs
├── scripts/setup.mjs
├── .env.example
└── package.json
```

---

## Quick start (local, 3 commands)

```bash
node scripts/setup.mjs      # creates .env + config/client.json from examples
npm install                 # installs all workspaces
npm run dev:bot             # builds + starts the bot; scan the QR with WhatsApp
```

Then in another terminal:

```bash
npm run dev:public          # http://localhost:3000  (marketing site)
npm run dev:admin           # http://localhost:3000  (gated admin — set ADMIN_KEY first)
```

### 0. Ship to GitHub (before deploying)

```bash
# 0a. Sanity check before pushing
npm run typecheck && npm run build

# 0b. Create the repo (once)
gh repo create whatsapp-ai-kit --public --source . --push
# (no `gh` CLI? create an empty repo on github.com, then:)
git remote add origin git@github.com:<you>/whatsapp-ai-kit.git

# 0c. Push
git push -u origin main
```

> Set your Git identity once so commits link to your GitHub account:
> `git config user.name "You" && git config user.email "you@example.com"`
> (use your GitHub noreply email from Settings → Emails). The repo keeps this
> kit's `.gitignore` — **.env, auth_state/, config/*.json, and data/** never leave your machine.

---

### 1. Connect a WhatsApp number
Run `npm run dev:bot`. On first run a **QR code** prints in the terminal.
On the phone: **WhatsApp → Settings → Linked devices → Link a device → scan**.
Credentials are saved to `auth_state/` — the bot reconnects automatically after restarts.

### 2. Change the personality / questions
Edit `config/client.json` (copy from `client.example.json`). No code changes needed.
Set `CLIENT=salon` in `.env` to load `config/salon.json`.

### 3. Send leads to your Google Sheet
Deploy the script in `docs/apps-script/Code.gs` (5 min, see `docs/DEPLOY.md`),
then paste its Web App URL into `.env` as `GOOGLE_SHEET_WEBHOOK_URL`.

---

## Configuration reference (`config/<CLIENT>.json`)

| Key | Meaning |
|---|---|
| `business` | Name, about, hours, location — used in replies and the AI prompt. |
| `persona` | Assistant name, role, tone, language. |
| `greeting` | First message. Supports `{{business_name}}`, `{{persona_name}}`. |
| `qualification.fields` | Ordered questions. `type: text` or `choice` (+ `options`). |
| `qualify_rule` | `min_answers`, and `disqualify_if` rules like `"timeline=Abhi bas pata kar raha hoon"`. |
| `post_qualify_message` | Sent after a qualified lead. Supports `{{name}}`. |
| `faqs` | Keyword-matched quick answers. |
| `handoff` | Where to notify on a qualified lead (`human_phone`). |
| `reminders` | Auto follow-up after N hours, max count. |
| `guardrails` | Rate limits, opt-out words, banned phrases. |

---

## Honest operational notes (read before selling)

- **Unofficial API risk.** Baileys uses WhatsApp Web. It is not the official Business API.
  Sending **high volumes of cold/unsolicited messages gets numbers banned.** Use the bot to
  *respond* to inbound enquiries and to serve the client's **own opted-in customers**. Keep
  volume human-like (the built-in rate limiter helps). Never bulk-blast strangers.
- **Hosting a 24/7 socket on free tiers is flaky** (free tiers sleep). The most reliable free
  option is a small always-on box, an Oracle Cloud "Always Free" VM, or the client's own PC.
  See `docs/DEPLOY.md`.
- **No guarantees.** The offer page and scripts deliberately promise *process*, not results.

---

## Commands

| Command | Does |
|---|---|
| `node scripts/setup.mjs` | First-run setup |
| `npm run dev:bot` | Build + run the WhatsApp bot |
| `npm run dev:public` | Run the public marketing site |
| `npm run dev:admin` | Run the gated admin app (needs `ADMIN_KEY` + `ADMIN_SESSION_SECRET`) |
| `npm run build` | Build all workspaces (bot, public, admin) |
| `npm run typecheck` | Type-check all workspaces |
| `npm run start:bot` / `start:public` / `start:admin` | Run built output |

---

## Deploy — two Vercel projects from one repo

The split is a security boundary: the public site is static and secret-free, the admin
holds the Supabase service-role key and is gated.

| Project | Root Directory | Env (Production) |
|---|---|---|
| public site | `apps/public` | `NEXT_PUBLIC_SITE_URL` only — **no** Supabase key |
| admin (name it something unguessable) | `apps/admin` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_KEY`, `ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_UPI_ID`, `NEXT_PUBLIC_UPI_NAME`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` |

**Entering the admin:** open it once with the secret key in the URL —
`https://<admin-host>/enter?key=<ADMIN_KEY>`. That sets an `HttpOnly` HMAC-signed cookie
and redirects to `/`. Without a valid key, `/enter` itself returns a **byte-identical 404**,
and every other path/method returns the same 404 — the app is invisible until unlocked.

- Generate the secrets with `openssl rand -hex 24` (`ADMIN_KEY`) and `openssl rand -hex 32`
  (`ADMIN_SESSION_SECRET`). Keep them in your password manager; never commit them.
- The VAPID **private** key stays server-side (bot sender + `/api/push/send`); only
  `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is embedded in the browser.
- Apply `apps/bot/supabase/schema.sql` in Supabase → SQL Editor before first use, so the
  `push_subscriptions` table and `leads.status` column exist.
