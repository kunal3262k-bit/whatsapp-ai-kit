export interface Package {
  id: string;
  label: string;
  amount: number;
}

export const PACKAGES: Package[] = [
  { id: 'qualifier', label: 'AI WhatsApp Lead Qualifier + CRM', amount: 6000 },
  { id: 'booking', label: 'AI WhatsApp Receptionist (Booking + Reminders)', amount: 10000 },
  { id: 'content', label: 'AI Content Engine (14-day posts)', amount: 7000 },
  { id: 'custom', label: 'Custom AI Setup (multi-staff / bilingual)', amount: 15000 },
];

export const DELIVERABLES: Record<string, string[]> = {
  qualifier: [
    'AI assistant on your own WhatsApp number',
    'Configurable qualifying questions',
    'Every lead auto-saved to Google Sheet / dashboard',
    'Owner alert on each qualified lead',
  ],
  booking: [
    'Everything in Qualifier, plus:',
    'In-chat appointment booking with your time slots',
    'Automatic reminders (T-2h, T-30m) to cut no-shows',
    'No-show follow-up message',
    'Daily lead + booking summary to you on WhatsApp',
  ],
  content: ['14-day Instagram post plan', 'Captions + hashtags per post', 'Editable Google Sheet'],
  custom: ['Scoped after a short call', 'Delivered as a working bot or sheet tool'],
};

/** Monthly managed-hosting care plan (the recurring line — required while we host the bot). */
export const CARE_PLANS: { id: string; label: string; amount: number }[] = [
  { id: 'lite', label: 'Care Lite — hosting, uptime, 1 edit/mo, 12h support', amount: 2000 },
  { id: 'plus', label: 'Care Plus — +unlimited edits, optimisation, 1 broadcast/mo, 4h support', amount: 4000 },
];

/** Voice add-on (tier-2 upsell). Priced above the OpenAI Realtime + Twilio COGS floor. */
export const VOICE_ADDON = { label: 'Voice add-on — AI answers your missed calls', amount: 7999, minutes: 150 };

export interface ContractInput {
  client: string;
  bizType: string;
  pkgId: string;
  amount: number;
}

export function advanceOf(amount: number): number {
  return Math.round(amount / 2);
}

/** Build the ready-to-send WhatsApp scope message (12h SLA, 50% advance, no guarantee). */
export function buildContract({ client, bizType, pkgId, amount }: ContractInput): string {
  const pkg = PACKAGES.find((p) => p.id === pkgId) ?? PACKAGES[0]!;
  const deliverables = DELIVERABLES[pkg.id] ?? DELIVERABLES.custom!;
  const advance = advanceOf(amount);
  return [
    `*Scope of Work — AI WhatsApp Setup*`,
    ``,
    `Client: ${client || '[client name]'} (${bizType || '[business type]'})`,
    `Package: ${pkg.label}`,
    `Total: ₹${amount.toLocaleString('en-IN')}`,
    ``,
    `*What you get:*`,
    ...deliverables.map((d) => `• ${d}`),
    ``,
    `*Timeline:* Built and connected on your WhatsApp number within *12 hours* of advance.`,
    ``,
    `*Payment:*`,
    `• Advance: ₹${advance.toLocaleString('en-IN')} (50%) to start`,
    `• Balance: ₹${advance.toLocaleString('en-IN')} on delivery`,
    ``,
    `*Monthly care plan (keeps the assistant running on our servers):*`,
    `• Care Lite — ₹2,000/mo: managed hosting + uptime, 1 edit request/mo, 12h support`,
    `• Care Plus — ₹4,000/mo: + unlimited edits, monthly optimisation, 1 broadcast/mo, 4h support`,
    `Setup is one-time and yours to keep. The care plan covers hosting and monitoring while we run it.`,
    `Minimum 3 months from go-live, then month-to-month — cancel anytime, you keep every lead captured.`,
    ``,
    `*Optional — Voice add-on:* ₹7,999/mo (150 voice minutes included, then ₹30/min).`,
    `Have the AI answer your missed *calls* too, not just WhatsApp. Add any month after go-live.`,
    ``,
    `*7-day proof guarantee:* Within 7 days of go-live, if the assistant does not do what this scope`,
    `says — reply in under 60 seconds, capture the agreed lead fields, answer your FAQs as written,`,
    `and book/remind as promised — and I can't fix it within 48 hours of your report, I refund 100%`,
    `of the setup fee and you keep every lead it captured.`,
    ``,
    `*What I need from you:*`,
    `• A WhatsApp number to run the assistant on`,
    `• Your business details + the questions you want asked`,
    ``,
    `*Note:* This guarantee covers delivery of the system. I do not guarantee any specific number of`,
    `leads, jobs, sales or results — that depends on your market, your pricing and how fast you follow up.`,
    ``,
    `Reply *"START"* and I'll send the UPI link. 🙏`,
  ].join('\n');
}
