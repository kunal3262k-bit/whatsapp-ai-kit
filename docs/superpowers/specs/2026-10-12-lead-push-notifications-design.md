# Lead Push Notifications (PWA + Web Push) — Design

Date: 2026-10-12
Status: Draft for approval
Author: opencode (with Kunal)

## Intent & why

When a lead finishes qualifying, or the bot reaches something it can't
handle, Kunal must be alerted **immediately and loudly** so he can open
WhatsApp and close the lead while it's warm.

Today the only alert is `handoff.notify`, which asks the bot to message
Kunal's own WhatsApp number. That is easy to miss: it's silent unless he
happens to be looking at the chat, and it never fires when the bot is
stuck.

Kunal wants an alert that reaches him **with the phone locked and Chrome
closed**, with a **long vibration** and a **loud** notification, and a tap
that **drops him straight into that customer's WhatsApp chat**.

## Goals

- Send a Web Push notification to Kunal's Android phone when:
  1. a lead **finishes qualifying** (qualified lead), and
  2. the bot **can't answer** a customer (needs a human).
- Delivery works with the **phone locked** and **Chrome not running**.
- Notification uses a **long, repeating vibration** and stays **on screen**
  until dismissed.
- Tapping it opens **that customer's chat in the WhatsApp app**.
- Everything stays on **free tiers**.

## Non-goals

- Replying to the customer from the web app.
- iPhone / iOS support (web push there can't vibrate or repeat).
- Desktop notifications.
- Rich media in notifications, or in-app chat UI.
- Multiple users / multiple owners. One person, one phone.

## Anti-goals (failure even if it works)

- Leaking the Supabase **service-role key** or anyone's push subscription
  to the browser.
- Notification **spam** or duplicates (same event buzzing twice).
- Making the dashboard *more* exposed than it already is. (It is currently
  a **public** URL showing lead PII — this design adds a lock, see below.)
- Any paid service.

## Constraints

- Target is **Android + Chrome**, on the **same phone that runs the bot**.
- Pushes only fire **while the bot process is running** (phone on, Termux
  alive). The bot is the only thing that knows a lead qualified.
- Web Push **cannot set a custom sound**. Sound and loudness come from
  Android's system notification channel for Chrome, raised once by hand.
- Reuse the existing stack: Next.js 14 (App Router) dashboard on Vercel,
  Supabase (free) for storage, Baileys bot in Termux. Add one dependency
  (`web-push`) to the bot only.

## Current state

- Dashboard is **live on Vercel**, read-only via the Supabase **anon key**,
  **no auth**, and has **no** manifest, service worker, or icons.
- Bot runs on the phone with `STORAGE=supabase`; its notification path is
  `flow.ts` → `notifyOwner()` → WhatsApp self-message. No push of any kind.
- No `push_subscriptions` table, no `web-push` dependency, no VAPID keys.
- An earlier design
  (`docs/superpowers/specs/2026-10-12-akra-ai-bot-design.md`, section 8)
  proposed a **Socket.IO relay + browser Notification API**. That only
  works while a tab is open, so it **cannot** meet the locked/closed
  requirement. This design **supersedes that notification approach**; the
  relay is not needed.

## How it works (decided)

The dashboard becomes an **installable Chrome app (PWA)**. On the phone,
Kunal opens it once and taps **Enable notifications**. The page registers a
service worker, asks for notification permission, subscribes to push using
a VAPID public key, and sends the subscription to a server route that saves
it in Supabase.

The bot, which already holds the Supabase **service-role** key, reads the
enabled subscriptions and sends pushes itself using **VAPID keys** — no
extra server, no relay.

On Android, Chrome's push service wakes the service worker even when Chrome
isn't running, and the service worker shows the notification. Vibration and
"stay on screen" come from the notification options. Android sound/loudness
come from the Chrome notification channel, which Kunal raises once.

Tapping the notification opens the customer's WhatsApp chat via a deep
link.

## Components

1. **PWA shell** (`apps/dashboard`):
   - `public/manifest.webmanifest` — name, short_name, `display:
     standalone`, `start_url: /`, theme/background colors, 192px + 512px
     icons (and a maskable icon).
   - `public/icons/*` — generated icons.
   - `public/sw.js` — service worker (see below).
   - Root layout: link the manifest + theme-color; register the SW on load.

2. **Subscribe flow** (`apps/dashboard/app/*`, client component):
   - "Enable notifications" button → `Notification.requestPermission()`
     → `registration.pushManager.subscribe({ userVisibleOnly: true,
     applicationServerKey: <VAPID public> })`
     → `POST /api/subscribe` with the subscription JSON.
   - If a subscription already exists, sync it on load (keeps it fresh).
   - Button shows current state (granted / denied / not installed).

3. **Service worker** (`public/sw.js`):
   - `push` event → `showNotification(title, { body, icon, tag,
     vibrate: [500,200,500,200,900,200,900], requireInteraction: true,
     data: { url } })`.
   - `notificationclick` → close the notification and
     `clients.openWindow(data.url)` (focus an open tab if one exists).
   - `pushsubscriptionchange` → best-effort re-subscribe + `POST
     /api/subscribe`.

4. **API routes** (`apps/dashboard/app/api/subscribe/route.ts`):
   - `POST` — upsert the subscription into `push_subscriptions` (server-side
     service-role key). `DELETE` — remove by endpoint.
   - **Public by decision** (Kunal: keep the dashboard open). See item 5.

5. **No dashboard auth (Kunal's call).** The dashboard stays public, so there
   is no `middleware.ts`. *Accepted risk, flagged not blocking:* because
   `/api/subscribe` is public, someone who knows the URL could register
   **their** device and receive Kunal's lead pushes. That is marginal next to
   the fact that the public dashboard already shows every lead, but it is a
   new channel. A cheap guard we can add later without any login: a single
   random `SUBSCRIBE_TOKEN` the page sends with the subscribe call (set once
   via URL, stored in `localStorage`). Left **off** unless Kunal asks.

6. **Supabase table** `push_subscriptions` (added to `schema.sql`):
   - columns: `id bigint identity pk`, `endpoint text unique not null`,
     `p256dh text not null`, `auth text not null`, `user_agent text`,
     `enabled boolean not null default true`, `created_at timestamptz
     default now()`, `last_seen_at timestamptz default now()`.
   - RLS **enabled**; **no** anon policies (only the service role touches
     it). Bot and the subscribe route both use the service-role key.

7. **Bot push sender** (`apps/bot/src/lib/push.ts`, new):
   - `web-push` with VAPID keys from env.
   - `sendLeadPush({ title, body, url })`: load `enabled` subscriptions,
     send to each, and on `404`/`410` set `enabled = false` (prune dead
     subscriptions). Log a line per send.
   - No-op (logs a warning) when VAPID keys are absent, so the bot still
     runs.

8. **Triggers in the bot** (`apps/bot/src/flow.ts`):
   - **Qualified lead** — in the finish branch, when `qualified` is true
     (where it currently notifies the owner), also call `sendLeadPush`
     with the lead's name and key answers.
   - **Bot stuck** — fires only when the AI is actually configured
     (`aiEnabled()`) and a customer question (`looksLikeQuestion`) gets
     **no** answer from either `matchFaq` or `aiAnswer`. Two existing
     branches can reach that: the qualified/disqualified branch (sends
     nothing today) and the mid-qualification branch (today it re-sends the
     question). Spam guard: because a handoff sets `status='human'`, it can
     fire **at most once per contact**, so a transient AI outage can't page
     on every message.
   - **Holding line (Kunal's call).** On a stuck handoff, send one short
     holding line ("Ek second, main team se confirm karke batata hoon"), set
     `contact.status = 'human'` and record `handoffAt`, then stay quiet.
   - **Auto-resume (Kunal's call).** A handed-off contact is not silenced
     forever. On the next inbound, if `now - handoffAt > HUMAN_IDLE_HOURS`
     (default 24), reset the contact to its prior step (`qualifying` at the
     stored `step`, or `qualified`) and handle the message normally. This
     gives a resume path without any controls UI, since today
     `status='human'` is permanent.

## Data flow

```
[browser] Enable notifications
   -> SW registers, pushManager.subscribe(VAPID public)
   -> POST /api/subscribe  -> Supabase push_subscriptions

[bot] lead qualifies / bot stuck
   -> lib/push.ts reads push_subscriptions (service role)
   -> web-push sends push (VAPID) to FCM
   -> Android wakes Chrome's service worker
   -> sw.js showNotification(vibrate, requireInteraction)
   -> tap -> openWindow(wa.me/<phone>) -> WhatsApp app, that chat
```

## Notification payload

```
title:  "New qualified lead"  |  "Needs you"
body:   "<name> - <key answers / their message>"
tag:    "lead-<jid>"          // dedupes repeats for the same contact
vibrate: [500,200,500,200,900,200,900]
requireInteraction: true
data.url: "https://wa.me/<phone>"
```

## Deep link to WhatsApp

Primary: `https://wa.me/<phone>` (Android opens the WhatsApp app to that
chat; also offers a Web fallback). *Decision (mine): use `wa.me`; add a tiny
`/open/[phone]` dashboard route that redirects to
`whatsapp://send?phone=<phone>` as a fallback if `wa.me` doesn't hand off on
Kunal's phone.* Works because the bot is a **linked device on Kunal's own
WhatsApp account**, so the customer's chat already exists in his app.

*Decision (mine): dedupe on the **jid**, not the phone, so two contacts can
never collide on a shared tag. Note the current `whatsapp.ts` drops any jid
that isn't `@s.whatsapp.net`, so **@lid-only chats reach neither the bot nor
these notifications** — that is a separate, pre-existing gap, out of scope
here and tracked on its own.*

## Env changes

Bot (`.env`):
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (from `web-push generate-vapid-keys`),
  `VAPID_SUBJECT` (e.g. `mailto:kunal@...`).

Dashboard (Vercel):
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (public).
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; used by `/api/subscribe`).
- Dashboard stays public — no auth env.

`.env.example` gets the new keys with comments.

## Decisions I made (builder calls — check these)

- Push sending lives in the **bot**, not a new server, because the bot
  already has service-role access and is the only thing that knows the
  events. No relay.
- Subscriptions are written **server-side with the service-role key**; the
  anon key stays read-only. RLS on `push_subscriptions` has no anon policy.
- **Dashboard stays public** (Kunal's call); `/api/subscribe` is therefore
  public too. The risk is documented above and a `SUBSCRIBE_TOKEN` guard is
  available if he changes his mind.
- Dead subscriptions are **disabled on 404/410**; re-subscribed on next
  dashboard visit.
- Vibration pattern is a fixed, long, repeating pattern; `tag` keyed on the
  **jid** prevents duplicates and cross-contact collisions.
- **Lock screen shows full detail** — name + what they want (Kunal's call).
- The **bot-stuck** event sends one holding line, then hands off, and
  **auto-resumes after 24h idle** (Kunal's calls).
- **Replace**, not add: these two events stop using the WhatsApp
  self-message (`handoff.notify`) and use push instead (the log line stays).
  One event never alerts twice (anti-goal).
- `requireInteraction` and `vibrate` are **best-effort** on Android — we
  verify on Kunal's phone and, if the OS ignores them, accept the fallback
  (or re-notify) rather than promise more than Chrome delivers.

## Left to the builder

- Generate and place PWA icons (192/512/maskable) + `manifest.webmanifest`.
- Write `public/sw.js` and the SW registration.
- Build the subscribe button component and `/api/subscribe` route.
- Add `push_subscriptions` DDL + RLS to `schema.sql`; run it in Supabase.
- Add `web-push` to `apps/bot`, write `lib/push.ts`, wire the two triggers.
- Add the auto-resume check (`HANDOFF_IDLE_HOURS`, `handoffAt`) to
  `flow.ts` / `types.ts`.
- Exact notification copy and vibration values.
- `.env.example` + README/onboarding notes: enable notifications on the
  phone, and **exempt Chrome and Termux from Android battery optimization**
  so pushes aren't delayed.

## Resolved with Kunal (2026-10-12)

1. **Lock screen shows full detail** — the lead's name and what they want.
2. **Bot-stuck:** send one short holding line, then go quiet, and
   **auto-resume that contact after ~24h idle**.
3. **Tap-anywhere** opens the chat; no extra action button.
4. **Dashboard stays public** — no Basic Auth. The resulting public
   `/api/subscribe` risk is accepted and noted above.

## Phases

- **Phase A — Notify on qualified lead.** PWA shell + SW + subscribe flow +
  `push_subscriptions` + `/api/subscribe` + `lib/push.ts` + the
  qualified-lead trigger. End state: a locked phone buzzes on a new
  qualified lead and tapping opens that chat.
- **Phase B — Notify when the bot is stuck.** The "no FAQ + no AI" handoff
  trigger, its holding line, and the 24h auto-resume.

Each phase ends with a real device test (not just logs).
