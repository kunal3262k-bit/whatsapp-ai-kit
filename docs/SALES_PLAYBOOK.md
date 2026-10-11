# 48-Hour Sales + Delivery Playbook (deadline: 14 Oct 2026)

Target: close **₹30,000**. Your products are ₹8k–20k. That's roughly **2–4 deals**.
Everything below is free.

---

## The offer to lead with
**"WhatsApp AI Lead Qualifier + Auto-Responder + Google Sheet CRM."**
It's the easiest to demo, the easiest to explain, and the fastest to deliver (the kit already does it).

Price honestly: **₹8,000–12,000 setup**, delivered same/next day. Optionally add a small monthly
retainer later for changes. **Never guarantee results** — sell the working system.

---

## Hour-by-hour

### Day 1 — Build proof + start outreach
- [ ] `node scripts/setup.mjs && npm install` — get the kit running locally.
- [ ] Get a **free Groq key** (console.groq.com), paste in `.env`.
- [ ] Connect a **spare WhatsApp number** (`npm run dev:bot`, scan QR).
- [ ] Create `config/demo.json` for a fake "salon". Test the full flow once.
- [ ] Record a **90-second Loom** using `docs/DEMO_SCRIPT.md`.
- [ ] Deploy the dashboard + `/offer` to Vercel (see `docs/DEPLOY.md`).
- [ ] Make your prospect list (your ICP). Split by area.
- [ ] Send **15–20 first messages** (see below). Manual. One at a time.

### Day 2 — Reply, demo live, close
- [ ] Reply to everyone who answered. Send the Loom to interested ones.
- [ ] Offer a **10-minute WhatsApp video call**. Show the bot on your demo number, live.
- [ ] On "how much?" → *"₹8,000 setup, ready tomorrow. ₹X is fine to start, I don't promise
      results — you get a working system and I'll show you the leads sheet."*
- [ ] Collect **50% advance** via the `/pay` UPI page (`NEXT_PUBLIC_UPI_ID`). Advance = commitment.
- [ ] Also send a **second batch of 15–20** messages to the next area.

### Day 3 — Deliver + upsell
- [ ] For each paying client: `cp config/client.example.json config/<client>.json`, fill it,
      `CLIENT=<client> npm run dev:bot`, scan **their** number, test.
- [ ] Hand over with `docs/ONBOARDING.md` step 5.
- [ ] Ask for the balance and a referral.
- [ ] Upsell: "appointment reminders" or "content engine" (+₹3–5k).

---

## First message (manually send, max 15–20/day)
Use `tools/outreach/gen-messages.mjs` to personalize at scale from a CSV, then **copy-paste and
send manually**. Example:

> Namaste [Name] 🙏 Main Kunal. Main [salon/clinic/tuition] ke WhatsApp enquiries ke liye ek
> AI assistant banata hoon — customers ko turant reply, aur har lead aapke Google Sheet mein.
> Ek din mein aapke number par set ho jaata hai. Kya main 90-second demo bhej sakta hoon?
> Interest na ho toh bas "No" likh dijiye.

**Rules:** max 15–20/day · one follow-up max · after "No" → never again · no links in first message.

---

## Reality checks (protect yourself)
- Baileys is **unofficial**; keep volume low and human-like. Don't cold-blast.
- Free hosting sleeps — for a paying client, put the bot on the **client's own PC** or an Oracle free VM.
- If a number gets banned, that's a client-impacting risk — set expectations up front.
- ₹30k in 3 days needs **2–4 closings**. If outreach isn't converting by end of Day 1, switch
  from "AI automation" to the **fastest, most concrete** pitch: "I'll set up auto-reply on your
  WhatsApp so you never miss a customer again — ₹8k, done tomorrow."
