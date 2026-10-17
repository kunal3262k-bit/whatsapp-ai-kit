export interface Biz {
  name: string;
  category: string;
  area: string;
  phone: string;
}

/**
 * Seed list — real, publicly-listed businesses near Delhi 110051, verified
 * earlier from public directories. ALWAYS re-verify a number before sending.
 * Default ICP is now HOME SERVICES / TRADES (plumbers, electricians, AC/HVAC,
 * cleaning, pest, painters, carpenters, appliance repair, packers) — source
 * those via Google Maps ("plumber in Krishna Nagar", etc.) and import your own
 * list through the CSV/XLSX box on /outreach.
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
  if (c.includes('plumb') || c.includes('नल')) return 'plumbing job calls';
  if (c.includes('electric')) return 'electrician call-outs';
  if (c.includes('hvac') || c.includes('ac repair') || c.includes('ac service') || c.includes('air cond') || c.includes('cooling') || c.includes('एसी')) return 'AC service calls';
  if (c.includes('clean')) return 'cleaning enquiries';
  if (c.includes('pest')) return 'pest-control enquiries';
  if (c.includes('paint')) return 'painting quotes';
  if (c.includes('carpenter') || c.includes('furniture') || c.includes('woodwork')) return 'furniture enquiries';
  if (c.includes('appliance') || c.includes('fridge') || c.includes('washing')) return 'repair calls';
  if (c.includes('packer') || c.includes('mover') || c.includes('shifting')) return 'shifting enquiries';
  if (c.includes('salon') || c.includes('beauty') || c.includes('parlour')) return 'salon enquiries';
  if (c.includes('sweet')) return 'festive/sweets orders';
  if (c.includes('dental')) return 'dental appointment enquiries';
  if (c.includes('clinic')) return 'clinic appointment enquiries';
  if (c.includes('gym')) return 'membership enquiries';
  if (c.includes('tuition')) return 'admission enquiries';
  if (c.includes('boutique') || c.includes('garment') || c.includes('saree')) return 'customer enquiries';
  if (c.includes('electronic')) return 'product enquiries';
  if (c.includes('lawyer') || c.includes('advocate') || c.includes('notary') || c.includes('legal') || c.includes('vakil')) return 'client enquiries';
  if (c.includes('dry fruit') || c.includes('bakery')) return 'orders';
  return 'customer enquiries';
}

export interface ProblemFix {
  problem: string;
  help: string;
}

/**
 * Pick the pain point that fits a business category (case-insensitive keyword
 * match) and the one-line way our WhatsApp bot fixes it. Unknown categories get
 * a sensible generic pitch.
 */
export function categoryProblemFix(category: string): ProblemFix {
  const c = (category ?? '').toLowerCase();
  if (c.includes('plumb') || c.includes('नल') || c.includes('tap') || c.includes('leak'))
    return {
      problem: 'Customer ki call aati hai jab aap job pe ho; miss hui to woh 8 second mein doosre plumber ko call kar deta hai',
      help: 'main ek AI assistant set karta hoon jo aapke WhatsApp par 24x7 enquiry leta hai, time confirm karta hai aur job book karke aapko turant ping deta hai',
    };
  if (c.includes('electric') || c.includes('wiring') || c.includes('inverter') || c.includes('बिजली'))
    return {
      problem: 'Inverter/fan/wiring ki emergency call bar-bar aati hai; utha nahi paate to customer agla number dial kar leta hai',
      help: 'main ek AI assistant set karta hoon jo har enquiry ka turant jawab deta hai, problem samajhta hai aur slot book karke aapko message kar deta hai — chahe raat ke 10 baje',
    };
  if (c.includes('hvac') || c.includes('ac repair') || c.includes('ac service') || c.includes('air cond') || c.includes('cooling') || c.includes('एसी'))
    return {
      problem: 'Season mein call volume 10x ho jati hai; ek din ke missed calls = hafte bhar ka kaam chala gaya',
      help: 'main ek AI assistant set karta hoon jo AC enquiries 24x7 receive karta hai, model + area note karke slot fix karta hai aur aapko ready list bhej deta hai',
    };
  if (c.includes('clean'))
    return {
      problem: 'Quote maangne wale 10 mein se 7 call back nahi karte; pehla jawab dene wala hi jeetta hai',
      help: 'main ek AI assistant set karta hoon jo instant reply deta hai, property type poochta hai aur quote ke liye time slot book karta hai',
    };
  if (c.includes('pest') || c.includes('termite') || c.includes('cockroach') || c.includes('fumigation') || c.includes('कीट'))
    return {
      problem: 'Treatment ke baad follow-up bhool jaata hai; next quarterly treatment ka order kho jaata hai',
      help: 'main ek AI assistant set karta hoon jo enquiry leta hai aur follow-up reminders bhi bhejta hai taaki booking milti rahe',
    };
  if (c.includes('paint') || c.includes('distemper'))
    return {
      problem: 'Log quote ke liye call karte hain, site visit pe confirm karte hain, phir gayab ho jaate hain',
      help: 'main ek AI assistant set karta hoon jo har quote enquiry ka detail leke site-visit slot book karta hai aur visit se pehle confirm karta hai',
    };
  if (c.includes('carpenter') || c.includes('furniture') || c.includes('woodwork') || c.includes('almirah') || c.includes('cabinet') || c.includes('modular'))
    return {
      problem: 'Custom kaam ki enquiry aati hai par aap workshop mein busy ho aur customer intezaar nahi karta',
      help: 'main ek AI assistant set karta hoon jo enquiry leke kaam ki detail aur budget range samajh ke aapko summary bhej deta hai',
    };
  if (c.includes('appliance') || c.includes('fridge') || c.includes('refrigerator') || c.includes('washing') || c.includes('microwave') || c.includes('geyser'))
    return {
      problem: 'Fridge/washing machine ki emergency call random time pe aati hai; miss = customer service centre ko de deta hai',
      help: 'main ek AI assistant set karta hoon jo 24x7 call leta hai, brand + problem note karta hai aur home-visit slot book karke aapko ping deta hai',
    };
  if (c.includes('packer') || c.includes('mover') || c.includes('shifting') || c.includes('relocation'))
    return {
      problem: 'Ek missed call = ek poora ghar shifting ka order; portals se lead mehngi hai aur jawab deri se milta hai',
      help: 'main ek AI assistant set karta hoon jo har enquiry ka shifting date, floor aur items note karta hai aur same-day quote ke liye slot fix karta hai',
    };
  if (c.includes('garden') || c.includes('landscap') || c.includes('lawn'))
    return {
      problem: 'Monthly maintenance ke customers call karte hain, aap garden mein hote ho, jawab late milta hai',
      help: 'main ek AI assistant set karta hoon jo enquiry leke monthly maintenance slot book karta hai aur existing customers ko service reminder bhejta hai',
    };
  if (c.includes('locksmith') || c.includes('lock') || c.includes('ताला'))
    return {
      problem: 'Emergency mein customer sabse pehle jo uthaye usko bulata hai; ring ring koi jawab nahi = order gaya',
      help: 'main ek AI assistant set karta hoon jo 24x7 uthata hai, location turant leke aapko alert kar deta hai — emergency mein ek second bhi waste nahi',
    };
  if (c.includes('cafe') || c.includes('restaurant'))
    return {
      problem: 'WhatsApp par order lena, menu batana aur delivery coordinate karna sab manual hai',
      help: 'main ek AI order assistant set karta hoon jo menu bhejta hai, order confirm karta hai aur har order record karta hai',
    };
  if (c.includes('boutique') || c.includes('garment') || c.includes('saree'))
    return {
      problem: 'Customers din bhar price, size aur photo poochte rehte hain aur sahi follow-up nahi hota',
      help: 'main ek AI assistant set karta hoon jo catalogue aur price bhejta hai, order capture karta hai aur follow-up karta hai',
    };
  if (c.includes('salon') || c.includes('parlour') || c.includes('beauty'))
    return {
      problem: 'Appointment booking aur reminders manual hain, no-shows zyada hote hain aur package follow-up reh jaata hai',
      help: 'main ek AI assistant set karta hoon jo booking leta hai, reminders bhejta hai aur packages upsell karta hai',
    };
  if (c.includes('dental'))
    return {
      problem: 'Patients call ya WhatsApp se book karte hain, no-shows hote hain aur follow-ups manual reh jaate hain',
      help: 'main ek AI assistant set karta hoon jo appointment book karta hai, reminders aur post-treatment care bhejta hai, aur patient log rakhta hai',
    };
  if (c.includes('clinic') || c.includes('physio') || c.includes('gynec'))
    return {
      problem: 'Appointment overload hai, patients ko follow-up chahiye aur WhatsApp queries 24x7 aati hain',
      help: 'main ek AI assistant set karta hoon jo appointments leta hai, follow-up karta hai aur har query handle karta hai',
    };
  if (c.includes('gym') || c.includes('fitness') || c.includes('yoga'))
    return {
      problem: 'Membership renewals chhoot jaate hain, class bookings manual hain aur Instagram leads follow nahi hote',
      help: 'main ek AI assistant set karta hoon jo renewals, class booking aur naye leads sab handle karta hai',
    };
  if (c.includes('bakery') || c.includes('sweet') || c.includes('confection'))
    return {
      problem: 'Festive aur advance orders WhatsApp par manage karna messy ho jaata hai',
      help: 'main ek AI order assistant set karta hoon jo orders leta hai, confirm karta hai aur reminder bhejta hai',
    };
  if (c.includes('pharmacy') || c.includes('medical') || c.includes('medicos'))
    return {
      problem: 'Medicine availability aur refill ke sawaal WhatsApp par aate hain aur order coordinate karna manual hai',
      help: 'main ek AI assistant set karta hoon jo refill reminders bhejta hai aur orders le leta hai',
    };
  if (c.includes('real estate') || c.includes('property') || c.includes('builder'))
    return {
      problem: 'Roz sau se zyada inquiries aati hain, follow-up manual hai aur leads thande pad jaate hain',
      help: 'main ek AI assistant set karta hoon jo har inquiry ko turant qualify karta hai, property match bhejta hai aur follow-up karta hai',
    };
  if (c.includes('tuition') || c.includes('coaching') || c.includes('academy'))
    return {
      problem: 'Fee reminders manual hain aur parents ke sawaalon ka jawab dene mein time chala jaata hai',
      help: 'main ek AI assistant set karta hoon jo fee reminders bhejta hai aur parents ke sawaal khud handle karta hai',
    };
  if (c.includes('electronic'))
    return {
      problem: 'Product, price aur availability ke sawaal din bhar aate rehte hain',
      help: 'main ek AI assistant set karta hoon jo in sawaalon ka turant jawab deta hai aur order capture karta hai',
    };
  if (c.includes('lawyer') || c.includes('advocate') || c.includes('notary') || c.includes('legal') || c.includes('vakil'))
    return {
      problem: 'Client inquiries WhatsApp par aate hain par har query ka reply, consultation booking aur follow-up manual reh jaata hai',
      help: 'main ek AI assistant set karta hoon jo har query ka turant reply karta hai, matter ke hisaab se details leta hai aur consultation slot book karta hai',
    };
  return {
    problem: 'WhatsApp par aane wali enquiries ka reply late ho jaata hai aur kai leads chhoot jaati hain',
    help: 'main ek AI assistant set karta hoon jo turant reply karta hai aur har lead save karta hai',
  };
}

export const PITCH_ANGLES: PitchAngle[] = [
  {
    id: 'problem-fix',
    label: 'Problem → Fix',
    description: 'Focus: name the exact problem in their business and how the bot fixes it.',
    template: (b) => {
      const { problem, help } = categoryProblemFix(b.category);
      return `Namaste ${b.name} 🙏 ${problem}. ${help} — aapke WhatsApp number par ek din mein set ho jaata hai. Setup ₹6,000 + ₹2,000/mahina care plan; ek bhi miss job recover ho gaya to plan paid off. Kya main 90-second demo bhej sakta hoon? ${OPT_OUT}`;
    },
  },
  {
    id: 'lost-leads',
    label: 'Missed enquiries',
    description: 'Focus: revenue leaking when you cannot reply fast enough.',
    template: (b) =>
      `Namaste ${b.name} 🙏 Main Kunal. Aapke jaise ${b.category} businesses mein bahut ${hook(
        b.category
      )} aati hain jinka reply late hota hai — aur customer 8 second mein agla number dial kar leta hai. ` +
      `Main aapke WhatsApp par ek AI assistant set karta hoon jo turant reply karta hai, time confirm karta hai aur har lead save karta hai. ` +
      `Setup ₹6,000 + ₹2,000/mahina, ek din mein live. Demo bhej sakta hoon? ${OPT_OUT}`,
  },
  {
    id: 'after-hours',
    label: 'After-hours gap',
    description: 'Focus: enquiries that arrive at night / when closed.',
    template: (b) =>
      `Namaste ${b.name} 🙏 Raat 10 baje ya jab aap job pe busy ho, jo customer message/call karta hai aur reply nahi milta — ` +
      `woh kal wapas nahi aata. Main ek AI assistant lagata hoon jo aapke band hone ke baad bhi customers ko reply karta hai aur details le leta hai. ` +
      `Aapke WhatsApp number par, setup ₹6,000 + ₹2,000/mahina. Demo dekhna chahenge? ${OPT_OUT}`,
  },
  {
    id: 'speed',
    label: 'Speed-to-lead',
    description: 'Focus: first responder wins the customer.',
    template: (b) =>
      `${b.name} ke liye ek chhota idea 🙏 Jo business sabse pehle reply karta hai, customer usi ke paas jaata hai — 10 mein se 8 jobs wahi le jaata hai. ` +
      `Main aapke WhatsApp par ek AI assistant lagata hoon jo seconds mein reply karta hai aur poora lead capture karta hai. ` +
      `Setup ₹6,000 + ₹2,000/mahina, ek din mein set. 90-second demo bhej doon? ${OPT_OUT}`,
  },
  {
    id: 'competitor',
    label: 'Competitive edge',
    description: 'Focus: neighbours are already automating.',
    template: (b) =>
      `Namaste ${b.name} 🙏 Aapke area mein kuch ${b.category} businesses already WhatsApp par auto-reply aur lead capture use kar rahe hain. ` +
      `Main aapke liye bhi aisa AI assistant set kar sakta hoon — turant reply, har lead save, aapke number par. ` +
      `Setup ₹6,000 + ₹2,000/mahina. Demo dekhna chahenge? ${OPT_OUT}`,
  },
  {
    id: 'time-saver',
    label: 'Time saver',
    description: 'Focus: stop repeating the same answers all day.',
    template: (b) =>
      `${b.name} 🙏 Din bhar same sawaalon ke jawab dete-dete time chala jaata hai — "kitne ka aayega?", timing, availability. ` +
      `Main ek AI assistant set karta hoon jo ye sab khud handle karta hai aur sirf serious leads aapke paas bhejta hai. ` +
      `Setup ₹6,000 + ₹2,000/mahina — ek saved job mein vasool. Live demo bhej doon? ${OPT_OUT}`,
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
