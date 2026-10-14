# Deploy (all free tiers)

Three things to deploy: the **bot** (needs an always-on process), the **public site**
(static, Vercel, secret-free), and the **admin app** (gated, Vercel, service-role server-side).

---

## 1. Web apps → Vercel (free) — two projects, one repo

This repo ships **two** Next.js apps. Keep them as **two separate Vercel projects**; the
split is a security boundary (the public site must never carry a Supabase key).

### 1a. Public site (root `apps/public`)
1. Vercel → **New Project** → import the repo.
2. **Root Directory** = `apps/public`, framework preset **Next.js**.
3. Env: `NEXT_PUBLIC_SITE_URL` = the deployed origin (e.g. `https://your-kit.vercel.app`).
   Do **not** add any Supabase key here.
4. Deploy. Serves the landing page and `/offer`.

### 1b. Admin app (root `apps/admin`)
1. Vercel → **New Project** → import the same repo. Give it a name that does not resemble
   the public site (it is guessable by anyone who knows the public URL).
2. **Root Directory** = `apps/admin`, framework preset **Next.js**.
3. Env (Production) — server-side only:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_KEY` (`openssl rand -hex 24`), `ADMIN_SESSION_SECRET` (`openssl rand -hex 32`)
   - `NEXT_PUBLIC_UPI_ID`, `NEXT_PUBLIC_UPI_NAME`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (optional; push)
4. Deploy, then **unlock once** by opening `https://<admin-host>/enter?key=<ADMIN_KEY>`.
   That sets an `HttpOnly` HMAC cookie and redirects to `/`. Until then, every path and
   method returns a byte-identical 404 — including `/enter` itself without the right key.

> Fail-closed: if `ADMIN_KEY` or `ADMIN_SESSION_SECRET` is unset, the whole admin 404s.
> Regain access any time with the `/enter?key=…` URL; rotate by changing `ADMIN_KEY` and redeploying.

---

## 2. Storage → Supabase (free, 3 minutes)

1. Create a project at https://supabase.com (free).
2. Open **SQL Editor**, paste `apps/bot/supabase/schema.sql`, click **Run**.
3. **Project Settings → API**: copy the **Project URL** and the **service_role key**
   (used by the bot and the admin app — server-side only; never expose it in the browser).
4. Put them in `.env`:
   ```
   STORAGE=supabase
   SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
   The same two values go on the **admin** Vercel project (Production). No Supabase key
   belongs on the public site or in any `NEXT_PUBLIC_` variable.

> Prefer zero setup? Leave `STORAGE=local` and the bot uses a JSON file on disk.

---

## 3. Bot → always-on free host

The bot holds a live WhatsApp socket, so it must **stay running**. Options, best first:

### Option A — Oracle Cloud "Always Free" VM (most reliable, free forever)
1. Create an Always Free `VM.Standard.A1.Flex` (ARM) Ubuntu instance.
2. `ssh` in, install Node 20+ (`nvm install 20`).
3. Clone your repo, `npm install`, `cp .env.example .env`, fill `.env`.
4. `npm run dev:bot` once to scan the QR (use `screen`/`tmux` so it survives logout):
   ```bash
   tmux new -s bot
   npm run dev:bot
   # scan QR, then Ctrl-B D to detach
   ```
5. Keep it alive with a systemd service or `pm2` (`npm i -g pm2; pm2 start apps/bot/dist/index.js --name wa-bot; pm2 save`).

### Option B — Render / Railway free web service (simpler, may sleep)
1. New Web Service → connect repo → root `apps/bot`.
2. Build: `npm install && npm run build`. Start: `node dist/index.js`.
3. Add all env vars from `.env`.
4. **Important:** attach a persistent disk mounted at `/app/auth_state` (or set
   `AUTH_DIR=/data/auth_state` to that mount) so the WhatsApp session survives restarts.
5. Free instances sleep on inactivity — for a socket that means disconnects. Enable
   a periodic ping or accept the reconnect logic handles it.

### Option C — the client's own laptop/PC
For a first delivery this is often best: run the bot on the client's machine. Zero hosting
cost, always on when they're open. Give them a one-page "how to start the bot" note.

> **Do not** commit `.env` or `auth_state/` — they are git-ignored.

---

## 4. Connect a test WhatsApp number

1. Use a spare SIM (not your main number) for testing.
2. `npm run dev:bot` → scan the QR from that phone.
3. Send a message from another phone to that number → watch the flow, then check the admin app / Sheet.

---

## Recommended minimum viable delivery

- Bot: client's PC or one Oracle free VM.
- Storage: Supabase free (so the apps work anywhere).
- Public site + admin app: Vercel free (two projects).
Total monthly cost: **₹0**.
