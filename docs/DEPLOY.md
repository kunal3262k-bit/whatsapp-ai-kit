# Deploy (all free tiers)

Two things to deploy: the **bot** (needs an always-on process) and the **dashboard** (static-ish, Vercel).

---

## 1. Dashboard → Vercel (free, 2 minutes)

1. Push this repo to GitHub (see the root README / checklist).
2. Go to https://vercel.com/new → import the repo.
3. Set **Root Directory** to `apps/dashboard`.
4. Framework preset: **Next.js** (auto-detected). Build command default is fine.
5. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Deploy. You get a URL like `https://your-kit.vercel.app` with:
   - `/` → leads dashboard
   - `/offer` → public offer page to send clients
   - `/pay` → UPI payment page

> If you don't set Supabase env vars yet, the dashboard still deploys and shows a setup hint.

---

## 2. Storage → Supabase (free, 3 minutes)

1. Create a project at https://supabase.com (free).
2. Open **SQL Editor**, paste `apps/bot/supabase/schema.sql`, click **Run**.
3. **Project Settings → API**: copy the **Project URL**, **anon key** (dashboard), and
   **service_role key** (bot only — never expose this in the browser).
4. Put them in `.env`:
   ```
   STORAGE=supabase
   SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

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
3. Send a message from another phone to that number → watch the flow, then check the dashboard / Sheet.

---

## Recommended minimum viable delivery

- Bot: client's PC or one Oracle free VM.
- Storage: Supabase free (so the dashboard works anywhere).
- Dashboard + offer page: Vercel free.
Total monthly cost: **₹0**.
