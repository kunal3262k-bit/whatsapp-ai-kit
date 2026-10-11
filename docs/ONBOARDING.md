# Client Onboarding (< 2 hours)

Goal: take a new client from "yes" to a working WhatsApp assistant on **their** number.

---

## Step 0 — Collect from the client (15 min, on WhatsApp)
- Business name, what they sell, hours, location.
- The **4-5 questions** they want to ask every lead.
- What counts as a good lead vs a waste of time.
- Their best WhatsApp number to run the bot on (a dedicated business number).
- Whether they want leads in a **Google Sheet** or the **dashboard**.

---

## Step 1 — Create their config (20 min)
```bash
cp config/client.example.json config/glowsalon.json
```
Edit `config/glowsalon.json`:
- `business.*` → their details.
- `persona.name` / `tone` → how the assistant should talk.
- `greeting` → first message.
- `qualification.fields` → their questions (use `choice` + `options` for multiple choice).
- `qualify_rule.disqualify_if` → e.g. `"budget=5k se kam"`.
- `handoff.human_phone` → where to send "🔥 New qualified lead" alerts.

Then in `.env`: `CLIENT=glowsalon`.

---

## Step 2 — Test on a spare number (20 min)
```bash
npm run dev:bot     # scan QR with the SPARE number
```
Message the bot from another phone. Confirm:
- greeting appears,
- questions are asked in order,
- a lead lands in the Sheet / dashboard,
- the owner alert fires.

Fix wording, re-run. This loop is the whole job.

---

## Step 3 — Switch to the client's number (30 min)
Only **one** WhatsApp session per number. If moving from spare → client:
1. Stop the bot.
2. `rm -rf auth_state/`
3. Client **unlinks any old session**: WhatsApp → Linked devices → remove old.
4. `npm run dev:bot` and scan the QR **from the client's phone**.
5. Confirm it says `✅ WhatsApp connected as ...`.

---

## Step 4 — Google Sheet sink (optional, 10 min)
Follow `docs/apps-script/Code.gs` (create Sheet → Apps Script → Deploy as Web app → copy URL).
Set `GOOGLE_SHEET_WEBHOOK_URL` + `GOOGLE_SHEET_SECRET` in `.env`.

---

## Step 5 — Handover (15 min)
Send the client a short voice note + this in writing:
- The bot replies automatically 24×7 to anyone who messages their number.
- Every lead is saved; the owner gets an alert when someone is genuinely interested.
- **To change how it talks or what it asks** → reply to you, you edit `config/<client>.json`.
- Where to see leads (Sheet link or dashboard URL).

---

## Selling any of the other three products

| Product | What you reuse | What you add |
|---|---|---|
| **Appointment booking + reminders** | bot + `reminders.ts` | a slot list; change the flow to offer times, then store the chosen slot as a reminder. |
| **AI content engine** | Groq AI client | a small script that takes a business description → 7-14 posts (see `tools/`). |
| **Internal tools (fees/orders)** | bot + Sheet sink | change `qualification.fields` to the data you collect; add a nightly reminder cron. |

> The whole kit is built so **80% is config, 20% is code.** Clone → new `config/<client>.json` → ship.
