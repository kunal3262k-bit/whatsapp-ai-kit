export interface Biz {
  name: string;
  category: string;
  area: string;
  phone: string;
}

/**
 * Seed list — real, publicly-listed businesses near Delhi 110051, verified
 * earlier from public directories. ALWAYS re-verify a number before sending.
 * Import your own ICP via the CSV box on /outreach.
 */
export const SEED_BUSINESSES: Biz[] = [
  { name: 'Hair Studio By Zafar', category: 'salon', area: 'Krishna Nagar', phone: '9724514459' },
  { name: 'Aishwarya Beauty Parlour', category: 'salon', area: 'Krishna Nagar', phone: '8285560258' },
  { name: 'Sree Rupa Beauty Parlour', category: 'salon', area: 'Krishna Nagar', phone: '9612155416' },
  { name: 'Kalra Sweets', category: 'sweets', area: 'Krishna Nagar', phone: '8826336168' },
  { name: 'Laxmi Traders', category: 'dry fruit / bakery', area: 'Krishna Nagar', phone: '9811454825' },
  { name: 'Saree Mahal', category: 'boutique', area: 'Laxmi Nagar', phone: '9811178313' },
  { name: 'Real India Saree & Suits', category: 'boutique', area: 'Krishna Nagar', phone: '9873713320' },
  { name: 'Modern Electronics', category: 'electronics', area: 'Krishna Nagar', phone: '9873403010' },
  { name: 'Krishna Garments', category: 'garments', area: 'Gandhi Nagar', phone: '8920151100' },
  { name: 'Srishti Creation', category: 'boutique', area: 'Gandhi Nagar', phone: '9811833939' },
  { name: 'Radhya Fashion', category: 'boutique', area: 'Gandhi Nagar', phone: '9711777767' },
];

export interface PitchAngle {
  id: string;
  label: string;
  description: string;
  template: (b: Biz) => string;
}

const OPT_OUT = 'Interest na ho toh bas "No" likh dijiye, dobara message nahi karunga.';

export function hook(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('salon') || c.includes('beauty') || c.includes('parlour')) return 'salon enquiries';
  if (c.includes('sweet')) return 'festive/sweets orders';
  if (c.includes('dental')) return 'dental appointment enquiries';
  if (c.includes('clinic')) return 'clinic appointment enquiries';
  if (c.includes('gym')) return 'membership enquiries';
  if (c.includes('tuition')) return 'admission enquiries';
  if (c.includes('boutique') || c.includes('garment') || c.includes('saree')) return 'customer enquiries';
  if (c.includes('electronic')) return 'product enquiries';
  if (c.includes('dry fruit') || c.includes('bakery')) return 'orders';
  return 'customer enquiries';
}

export const PITCH_ANGLES: PitchAngle[] = [
  {
    id: 'lost-leads',
    label: 'Missed enquiries',
    description: 'Focus: revenue leaking when you cannot reply fast enough.',
    template: (b) =>
      `Namaste ${b.name} 🙏 Main Kunal. Aapke jaise local businesses mein bahut ${hook(
        b.category
      )} aise messages aate hain jinka reply late hota hai — aur customer wahi dusri jagah se le leta hai. ` +
      `Main aapke WhatsApp number par ek AI assistant set karta hoon jo turant reply karta hai aur har lead save karta hai. ` +
      `Ek din mein set, ₹8k se shuru. Demo bhej sakta hoon? ${OPT_OUT}`,
  },
  {
    id: 'after-hours',
    label: 'After-hours gap',
    description: 'Focus: enquiries that arrive at night / when closed.',
    template: (b) =>
      `Namaste ${b.name} 🙏 Raat 10 baje ya jab aap busy ho, jo customer message karta hai aur reply nahi milta — ` +
      `wo kal wapas nahi aata. Main ek AI assistant banata hoon jo aapke band hone ke baad bhi customers ko reply karta hai aur details le leta hai. ` +
      `Aapke WhatsApp number par, ek din mein. Demo dekhna chahenge? ${OPT_OUT}`,
  },
  {
    id: 'speed',
    label: 'Speed-to-lead',
    description: 'Focus: first responder wins the customer.',
    template: (b) =>
      `${b.name} ke liye ek chhota idea 🙏 Jo business sabse pehle reply karta hai, customer usi ke paas jaata hai. ` +
      `Main aapke WhatsApp par ek AI assistant lagata hoon jo seconds mein reply karta hai aur poora lead capture karta hai. ` +
      `Set up ek din mein. 90-second demo bhej doon? ${OPT_OUT}`,
  },
  {
    id: 'competitor',
    label: 'Competitive edge',
    description: 'Focus: neighbours are already automating.',
    template: (b) =>
      `Namaste ${b.name} 🙏 Aas-paas ke kuch businesses already WhatsApp par auto-reply aur lead capture use kar rahe hain. ` +
      `Main aapke liye bhi aisa AI assistant set kar sakta hoon — turant reply, har lead save, aapke number par. ` +
      `Ek din mein ready. Demo dekhna chahenge? ${OPT_OUT}`,
  },
  {
    id: 'time-saver',
    label: 'Time saver',
    description: 'Focus: stop repeating the same answers all day.',
    template: (b) =>
      `${b.name} 🙏 Din bhar same sawaalon ke jawab dete-dete time chala jaata hai — price, timing, availability. ` +
      `Main ek AI assistant set karta hoon jo ye sab khud handle karta hai aur sirf serious leads aapke paas bhejta hai. ` +
      `Aapke WhatsApp par, ek din mein. Demo bhej doon? ${OPT_OUT}`,
  },
];

/** Pipeline status for each prospect in the outreach tracker. */
export type TrackStatus = 'new' | 'sent' | 'replied' | 'call' | 'won' | 'lost';

export const TRACK_STATUSES: readonly TrackStatus[] = ['new', 'sent', 'replied', 'call', 'won', 'lost'];

export const TRACK_LABELS: Record<TrackStatus, string> = {
  new: 'New',
  sent: 'Sent',
  replied: 'Replied',
  call: 'Call booked',
  won: 'Won',
  lost: 'Lost',
};

export interface TrackEntry {
  status: TrackStatus;
  notes?: string;
  advance?: number;
}

export function isTrackStatus(value: unknown): value is TrackStatus {
  return typeof value === 'string' && (TRACK_STATUSES as readonly string[]).includes(value);
}

/** WhatsApp needs an international number; seed numbers are 10-digit local. */
export function toWaNumber(phone: string): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function waLinkFor(phone: string, message: string): string {
  return `https://wa.me/${toWaNumber(phone)}?text=${encodeURIComponent(message)}`;
}

/** Parse pasted CSV: one prospect per line, `name,category,area,phone`. */
export function parseProspectCsv(text: string): Biz[] {
  const out: Biz[] = [];
  for (const line of text.split(/\r?\n/)) {
    const parts = line.split(',').map((p) => p.trim());
    if (parts.length < 4) continue;
    if (/name/i.test(parts[0]!) && /phone|number/i.test(line)) continue;
    out.push({ name: parts[0]!, category: parts[1] || 'business', area: parts[2] || '', phone: parts[3]! });
  }
  return out;
}

export function trackerTotal(entries: Record<string, TrackEntry>): number {
  return Object.values(entries).reduce((sum, e) => sum + (e.advance ?? 0), 0);
}
