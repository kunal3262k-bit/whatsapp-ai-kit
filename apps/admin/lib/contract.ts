export interface Package {
  id: string;
  label: string;
  amount: number;
}

export const PACKAGES: Package[] = [
  { id: 'qualifier', label: 'WhatsApp AI Lead Qualifier + CRM', amount: 8000 },
  { id: 'booking', label: 'AI Appointment Booking + Reminders', amount: 10000 },
  { id: 'content', label: 'AI Content Engine (14-day posts)', amount: 7000 },
  { id: 'custom', label: 'Custom internal tool', amount: 12000 },
];

export const DELIVERABLES: Record<string, string[]> = {
  qualifier: [
    'AI assistant on your own WhatsApp number',
    'Configurable qualifying questions',
    'Every lead auto-saved to Google Sheet / dashboard',
    'Owner alert on each qualified lead',
  ],
  booking: [
    'In-chat appointment booking',
    'Automatic reminders to cut no-shows',
    'Leads + bookings logged to your CRM',
    'Owner alert on each booking',
  ],
  content: ['14-day Instagram post plan', 'Captions + hashtags per post', 'Editable Google Sheet'],
  custom: ['Scoped after a short call', 'Delivered as a working bot or sheet tool'],
};

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
    `*What I need from you:*`,
    `• A WhatsApp number to run the assistant on`,
    `• Your business details + the questions you want asked`,
    ``,
    `*Note:* I commit to a working system and a tracked report. I do not guarantee any specific`,
    `number of sales or results.`,
    ``,
    `Reply *"START"* and I'll send the UPI link. 🙏`,
  ].join('\n');
}
