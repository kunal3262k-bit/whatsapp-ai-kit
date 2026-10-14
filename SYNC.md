# 🤝 SYNC — Two-Agent Coordination (OpenCode ⟷ Antigravity)

> **Read this first, before touching any code.**
> This file is the single coordination contract for this project.

## Decision (human-locked)
- **Source of truth / production stack = `whatsapp-ai-kit` (owned by OpenCode).**
- Antigravity's parallel monorepo `hyperlocal-ai-engine` is a **design reference only**. We do **not** switch cores.
- We **selectively absorb** Antigravity's best sales/growth surface area into `whatsapp-ai-kit`.

## Ownership map
| Area | Owner | Notes |
|---|---|---|
| `apps/bot/**` (conversation engine, Baileys, Groq, storage, reminders, rate-limit) | **OpenCode** | Frozen core — change only with explicit request. |
| `config/**` (per-client JSON, onboarding model) | **OpenCode** | Config-driven; never fork per client. |
| `apps/public/**` (marketing site, `/offer`) | **OpenCode** | Static; holds no Supabase key or secret. |
| `apps/admin/**` (gated cockpit: leads CRM, outreach, contract, pay, push, status) | **OpenCode** | Server-side service-role only; secret-path gate. |
| New growth pages `/demo`, `/outreach`, `/contract` | **OpenCode** (absorbed from Antigravity spec) | Land here, not in a new repo. |
| `docs/**`, `tools/**`, `scripts/**` | **OpenCode** | |
| Experimental UI ideas / throwaway prototypes | Antigravity (reference) | Must be re-implemented cleanly here to ship. |

## Absorbed from Antigravity (ported into `whatsapp-ai-kit`)
1. **`/demo` — Interactive WhatsApp Demo Simulator** — live chat UI, switchable industry presets (dental, real-estate, tuition, gym, salon), real-time lead-extraction preview. Ported as a self-contained React client component (no backend needed).
2. **`/outreach` — Outreach Accelerator** — seeded + importable Delhi 110051 business list, multiple psychological pitch angles, one-click "Open in WhatsApp Web", ₹30,000 revenue progress tracker (localStorage).
3. **`/pay` — upgraded payment page** — dynamic UPI QR, quick amount pills (₹5k/7k/10k/15k), deep links for GPay / PhonePe / Paytm.
4. **`/contract` — Scope-of-Work generator** — copy-ready WhatsApp message with 12-hour SLA, 50% advance terms, clear deliverables, no-guarantee clause.

> **Note (2026-10-11):** Antigravity's `hyperlocal-ai-engine` repo was **not present on this machine**, so the above were implemented from the written spec, not copied. If the repo appears later, diff it against these pages and cherry-pick only genuinely-better ideas — do not replace the core.

## Deliberately left behind (do NOT port)
- Antigravity's **conversation engine** — ours (state machine + qualification + opt-out + FAQs + guardrails + disqualify rules) is superior and frozen.
- Its **parallel storage / config / auth layers** — we use `config/<CLIENT>.json` + local-JSON/Supabase dual store.
- Any duplicate **monorepo scaffolding** — one monorepo only: `whatsapp-ai-kit`.
- Anything that is paid, requires Meta's official WhatsApp API, or breaks the free-tier constraint.

## Sync protocol (two agents, one repo)
1. **Before starting:** `git pull --rebase` and read this `SYNC.md` + `HANDOFF` state below.
2. **Ownership & heartbeat:** only work inside areas you own (see table). Don't touch a task claimed by the other agent unless its heartbeat is >30m stale.
3. **Verification gate:** run `npm run typecheck && npm run build` (bot + public + admin) before committing. Must pass.
4. **Atomic commit:** code + this file together, message `feat/fix: <summary> [VERIFY: PASS]`.
5. **Push after rebase.** Never leave the handoff local-only.
6. **Free-tier rule:** nothing added may require a paid service or the official WhatsApp Business API.

## Current sync state
```
Owner:            opencode
Claimed task:     (none — absorption complete, released)
Heartbeat:        2026-10-11T17:20:00+05:30
  Status:           public/admin split on branch `public-admin-split` — apps split, secret-path gate, admin cockpit (leads CRM, outreach, contract, pay, push, bot status). Code + docs done & verified; deploy provisioning pending.
Blocks:           admin deploy waits on human steps (Supabase schema.sql run + anon-key rotation, admin Vercel project).
Rebirth rule:     if heartbeat >30m stale and no running daemon, partner may claim.
```

## Next steps (unclaimed)
- [ ] Polish `/demo` presets with real client-facing copy.
- [ ] Secondary tools (lower priority): AI Content Engine (14-day IG posts), Tuition Fee Reminder.
- [ ] Optional: move the ₹30k tracker from localStorage to Supabase for cross-device.
