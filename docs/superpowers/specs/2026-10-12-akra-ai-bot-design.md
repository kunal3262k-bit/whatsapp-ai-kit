# Akra AI Automations — WhatsApp Lead Bot (Design)

Date: 2026-10-12
Status: Draft for approval
Author: opencode (with Kunal)

## Intent & why

Kunal runs **Akra AI Automations**, a one-stop digital agency (websites,
apps, custom software, AI automations, digital marketing, Google/Meta
ads) whose promise is to "make businesses AI-ready."

Two jobs for this bot:

1. **Kunal's own WhatsApp line** — when a new number messages with a
   business need, they get an instant, useful reply, get qualified, and
   Kunal gets a callable lead.
2. **A live sales demo** — Kunal shows prospective clients that the same
   bot can be re-skinned for *their* business. The whole bot is one config
   file, so "for your business" means swapping that file.

## Goals

- Instant reply to any new inbound number, 24×7.
- Qualify: what is their business, what they need, when they're free for a
  quick call, their name. **No budget question** (removed).
- Confirm a call time in chat; the bot **only offers 8am–11pm** slots, and
  Kunal calls the client (no calendar integration in v1).
- Work in **any language** the lead writes in; Hinglish default.
- Handle **voice notes** (many Indian leads send voice).
- Let the lead **ask for a human**; ping Kunal and go quiet.
- **Nurture** unconverted leads (multi-touch follow-ups) and **remind** the
  lead before a booked call.
- **Owner controls** and **real-time lead notifications** through a local
  web app (Next.js + **Socket.IO**) opened in Chrome, with desktop pop-ups
  and **long vibration** on the phone.
- **Run on Kunal's phone (Termux)** with a **one-tap home-screen widget**
  that relaunches the bot after a phone restart — no commands to type.
- Be trivially re-brandable per client (config-only).

## Non-goals (v1)

- Google Calendar / real availability / slot booking.
- WhatsApp catalog / packages / portfolio assets (Kunal has none yet).
- Payments, invoices, contracts.
- Rich media replies (images/PDFs/brochures).

## Anti-goals (a failure even if it works)

- Getting the WhatsApp number flagged/banned (spam behavior, aggressive
  outreach). All sending stays within existing rate limits and opt-out.
- Replying in the wrong language or leaking Hinglish into a non-Hindi chat.
- The demo breaking when config is swapped (must run with any client file).
- Hallucinating prices/promises — guardrails must hold.

## Constraints

- Free-tier stack: Groq (OpenAI-compatible) for chat **and** Whisper for
  transcription (same `AI_API_KEY`), Supabase for storage, Baileys for WA,
  a Socket.IO **relay** on a free always-on host (Fly.io/Render), and
  **Vercel** for the dashboard.
- Existing architecture (reuse, don't rewrite):
  - `config.ts` — zod-validated client config; `config/<CLIENT>.json`.
  - `flow.ts` — deterministic state machine: greeting → fields → qualify →
    closing → lead push → notify → reminder.
  - `whatsapp.ts` — Baileys socket; `decideIncoming()` now handles `@lid`.
  - `reminders.ts` — cron(1min) + store-backed reminders (single follow-up).
  - `leads.ts` — Google Sheet webhook push (optional).
  - `store/` — `local` and `supabase` implementations of `Store`.
  - `apps/dashboard` — Next.js surface (`/demo`, `/outreach`, `/pay`,
    `/contract`) available for lead viewing / a future control panel.

## Current state

- LID bug fixed (uncommitted): bots now see `@lid` customer chats and
  resolve the phone from `senderPn`.
- Bot is stopped; `auth_state` deleted (phone unlinked).
- Running config is `client.example.json` (placeholder) — Akra config does
  not exist yet.

## Features & decisions

### 1. Akra client config (`config/akra.json`) + `.env CLIENT=akra`
Branding: name "Akra AI Automations"; about = one-stop AI-readiness
partner; location "Delhi"; hours "24×7"; phone +91 9717745568; no website.
Persona: a warm, confident Hinglish-speaking "AI & digital growth
consultant." Qualification fields (order): `business` → `need` → `call_time`
→ `name`. `qualify_rule.min_answers = 3`; **no disqualify rule** (no budget).
FAQs: what we do, how we price, what "AI-ready" means, timeline.
*Decision: config only, no code.*

### 2. Plain qualification (no scoring)
Qualify plainly: collect the fields, mark qualified when enough answers are
captured, and hand the lead to Kunal. **No** HOT/WARM/COLD tag, no AI
readiness score in v1.
*Decision: dropped scoring per Kunal ("just qualify plainly for now").
Files: `flow.ts`, `config.ts`.*

### 3. Any-language support
Detect the lead's language from their message; render every outbound
scripted message (greeting, questions, closing) in that language.
*Decision: keep the human-tuned Hinglish config strings as the source of
truth and AI-translate them on demand, cached in memory per
(string, language). Fall back to the original string if AI is unavailable,
so the bot never sends an empty message. Store `contact.language` so we
don't re-detect every turn. Default language when undetectable: Hinglish.*
*Files: new `lib/i18n.ts`, `flow.ts`, `types.ts`, `config.ts`.*

### 4. Voice-note handling
On an inbound `audioMessage` (voice note / `ptt`): download the media via
Baileys, POST to Groq Whisper (`/audio/transcriptions`), and feed the
transcript into the normal flow as if typed. If transcription fails, reply
once asking them to type (localized).
*Decision: reuse `AI_API_KEY`; new env `AI_TRANSCRIBE_MODEL`
(default `whisper-large-v3`). Add a max-duration/size guard. Files: new
`lib/transcribe.ts`, `whatsapp.ts`, `env.ts`.*

### 5. "Talk to human" trigger
If the lead's message matches configurable trigger words ("human", "agent",
"talk to human", "band karo", "call me", "baat karni hai"), set
`contact.status = 'human'`, notify Kunal, and stop auto-replying to that
contact. Any later owner takeover/reply keeps the bot silent there (flow
already honors `status === 'human'`).
*Decision: trigger words live in config (`handoff.trigger_words`). Files:
`flow.ts`, `config.ts`.*

### 6. Multi-touch follow-ups (day 1 / 3 / 7)
Replace the single follow-up with a sequence from config
(`reminders.followups: [{after_hours, message}, ...]`). On qualify (no call
yet), schedule the series. If the lead replies, **cancel** the remaining
follow-ups for that contact.
*Decision: reminders stay store-backed; add `cancelReminders(jid, kind)` to
`Store` (both `local` and `supabase`). Files: `reminders.ts`, `config.ts`,
`types.ts`, `store/*`, `flow.ts`.*

### 7. Confirm the call + remind the lead
Capture `call_time` as a structured choice: day (Aaj/Kal/Parso) + a time
band **within 8am–11pm** (e.g. 8–11am, 11am–2pm, 2–5pm, 5–8pm, 8–11pm).
The closing confirms it in words ("Aapne {{call_time}} bataya — main us
waqt call karunga"). Schedule a lead reminder ~1h before the chosen band,
in the lead's language.
*Decision: structured capture over free text (free text can't be reliably
scheduled); bands are constrained to the 8am–11pm calling window. Past
slots are skipped, never scheduled backwards. Files: `flow.ts`,
`config.ts`, `reminders.ts`.*

### 8. Web app (Vercel) + Socket.IO relay — notifications, controls
The dashboard (`apps/dashboard`) is deployed to **Vercel** (a new project/link,
separate from the existing `whatsapp-ai-kit` one) and is the bot's control
center. Real-time uses **Socket.IO** via a small always-on **relay**, because
Vercel cannot reach the bot on the phone's localhost.

- **Socket.IO relay** — a tiny standalone Node service (new
  `apps/realtime/`), no database, deployed to a free always-on host
  (Fly.io / Render). It routes events between the bot and the web app and
  authenticates clients with a shared secret (`REALTIME_TOKEN`).
- **Bot (phone)** connects **out** to the relay as a Socket.IO client and
  publishes: `lead` (new qualified lead), `handoff` ("talk to human"),
  `inbound` (optional), `status` (counts / paused). It also listens for
  control events.
- **Web app (Vercel)** connects to the relay as a Socket.IO client and shows
  a live feed.
- **Pop-ups** via the browser **Notification API** (permission on first load)
  with a **long vibration** (`navigator.vibrate([500,200,500,200,900])` /
  notification `vibrate`). *Vibration works on Chrome for Android; desktop
  Chrome shows the pop-up without vibration.*
- **Controls** — `pause` / `resume` / `takeover` / `resume-contact` buttons
  emit control events → relay → bot obeys immediately and reflects state
  back (`status`). No Supabase control table, no polling.

*Decision: relay decouples the phone from the public dashboard — works
behind mobile NAT, stable URL, no tunnel upkeep. The bot's persistent
connection also keeps a free relay host awake. Files: new
`apps/realtime/` (relay), bot-side `lib/realtime.ts` (client + emit),
`flow.ts`, `whatsapp.ts`; `apps/dashboard/*` (client, feed, controls,
notification permission).*

### 9. Alerting destination
Primary: the **web app** — live feed + pop-up with **long vibration**.
Always also written to the **log**. WhatsApp self-chat is dropped.
*Decision: web-app notifications + log are the channels.*

### 10. Hosting & deployment
- **Bot** runs in **Termux on Kunal's phone**. A **one-tap home-screen
  widget** (Termux:Widget, script in `~/.shortcuts/`) relaunches it after a
  phone restart — **no command to type**. The launcher script
  (`scripts/termux/akra-bot.sh`, provided by this project) cds to the repo,
  starts the bot in the background, and logs to a file.
- **Relay** runs always-on on a free cloud host (`apps/realtime/`).
- **Dashboard** runs on **Vercel** (new project/link).
- **Storage** stays **Supabase** (`STORAGE=supabase`) so leads/reminders
  survive restarts.
- Uptime caveat: while the phone is off/sleeping, the bot is offline and
  instant replies pause until the widget is tapped again (the relay and
  dashboard stay up but show no events).
*Decision: phone = bot; cloud free host = relay; Vercel = dashboard.
Files: `scripts/termux/akra-bot.sh`, `apps/realtime/*`, `apps/dashboard/*`,
`vercel.json` / `render.yaml`.*

## Data model changes
`types.ts`:
- `Contact.language?: string`
- `Contact.callTime?: { day: string; band: string }`
- `Reminder.kind` already exists (reuse: `followup`, `precall`).
- `Store.cancelReminders(jid: string, kind?: string): Promise<void>`.

Real-time is **Socket.IO**, so no new Supabase tables are required for
notifications or controls. Notifications are emitted live; optionally the
bot also logs each to `messages`/`leads` for history. Control state
(`paused`, per-contact `human`) lives in the bot process, driven by socket
events, and is reflected back to the web app.

## Config schema changes (`config.ts`)
- `persona.language` (exists) — used as default.
- `handoff.trigger_words: string[]`.
- `reminders.followups: { after_hours: number; message: string }[]`
  (keep `followup_message`? migrate example; default to single entry).
- `calling.window: { start: "08:00", end: "23:00" }` and
  `calling.bands: [{ key, label, start, end }]` for the 8am–11pm slots.
- `realtime.port?: number` (default 4000).
- No `scoring` (dropped). Nothing that breaks other clients; all new keys
  optional with defaults so `client.example.json` and future files stay
  valid.

## Phasing

- **Phase 1 — Core bot (config-only + light code):** #1 Akra config, #3 any-
  language, #5 talk-to-human, #2 plain qualify, #7 confirm text (8am–11pm
  bands). Shippable and demoable with no new dependencies.
- **Phase 2 — Voice:** #4 transcription (new Groq call).
- **Phase 3 — Cloud web app:** #8 Socket.IO relay (`apps/realtime/`,
  deployed), bot-side socket client, dashboard (Vercel, new link) feed +
  controls + pop-up/long-vibration, #9 alerting.
- **Phase 4 — Nurture:** #6 multi-touch follow-ups + pre-call reminder.
- **Phase 5 — Phone ops:** #10 Termux:Widget one-tap launcher + docs.

Each phase ends with a working bot and a runnable check.

## Resolved after builder check (my calls)

- **Multilingual vs. inbound matching.** Inbound answers are matched
  against the *canonical Hinglish* options/questions, not the localized
  text. For choice fields, accept either the localized option or its index,
  and map back to the canonical value. `looksLikeQuestion` gets a
  multilingual heuristic plus an AI fallback ("is this a question?"). This
  keeps stored data canonical while the lead sees their own language.
- **Owner controls reference a contact.** Web-app buttons (`takeover` /
  `resume` on a contact) carry the contact id / phone / LID. Every
  notification includes **both** phone and LID so Kunal can identify the
  lead either way.
- **Leaving `status='human'`.** Human is sticky until Kunal clicks
  **resume** on that contact. No auto-timeout in v1.
- **Call-time band mapping.** Bands are the 8am–11pm slots from config
  (e.g. 8–11am, 11am–2pm, 2–5pm, 5–8pm, 8–11pm, server TZ). If the chosen
  slot is already past "now", the pre-call reminder is skipped and the
  closing says so; it never schedules a reminder in the past.
- **Nurture consent / anti-ban.** Multi-touch goes only to **qualified**
  leads who did not opt out, is capped at **2 follow-ups** by default, and
  is cancelled the moment the lead replies. Frequency is bounded by the
  existing rate limiter.

## Decisions locked (from Kunal)
1. **Host = Kunal's phone (Termux).** After a phone restart he taps a
   **one-tap home-screen widget** to relaunch the bot — no command to type.
   While the phone is off/sleeping the bot is offline (accepted).
2. **Web app = Next.js on Vercel (new project/link) + a Socket.IO relay**
   on a free always-on host. Real-time push, no polling. No Chrome
   extension.
3. **Call time = day + time band, 8am–11pm only.**
4. **Alerts = pop-up notification with long vibration** (Chrome for
   Android; desktop Chrome shows the pop-up without vibration) + log.
5. **Qualify plainly** — no AI-readiness scoring/tag in v1.

## Deployment targets
- **Dashboard:** Vercel project **`akra-ai-dashboard`** (new link, separate
  from `whatsapp-ai-kit`). Root directory `apps/dashboard` in this monorepo.
  Needs `VERCEL_TOKEN` to deploy from here (not yet provided).
- **Relay:** **Render** free web service (Blueprint via `render.yaml`).
- **Bot:** Termux on the phone (one-tap widget).
- **Store:** Supabase.

### Access control (required — leads contain PII)
The Vercel link is public, and the dashboard reads all leads. v1 protection
is **HTTP Basic Auth via Next.js middleware** (`apps/dashboard/middleware.ts`)
driven by env `DASHBOARD_USER` / `DASHBOARD_PASSWORD`. Unauthenticated
requests get `401` (including `/api/leads`). Supabase RLS remains read-only
for the anon key as a second layer.

## Left to the builder
- Exact localized copy for each message (Hinglish source).
- Whisper request/response handling details and guards.
- Web app: Socket.IO client wiring, notifications feed, controls UI,
  browser Notification permission + vibration flow.
- Socket.IO relay service (`apps/realtime/`) + free-host deploy config
  (`render.yaml` / `fly.toml`).
- Vercel: new project/link, `vercel.json`, env vars, deploy.
- Termux:Widget script (`~/.shortcuts/akra-bot.sh`) and a short setup note.
- New `Contact` fields (`language`, `callTime`) and reminder cancellation.
