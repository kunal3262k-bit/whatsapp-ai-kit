import type { CountryCode, Locale } from './countries';

export interface DemoField {
  key: string;
  label: string;
  question: string;
  type: 'text' | 'choice';
  options?: string[];
}

export interface DemoPreset {
  id: string;
  label: string;
  emoji: string;
  business: string;
  greeting: string;
  intro: string;
  fields: DemoField[];
  handoff: string;
}

export type DemoLang = 'hinglish' | 'en' | 'ar' | 'pt';

export type DemoSetId = 'in' | 'us' | 'gulf-en' | 'gulf-ar' | 'br';

export interface DemoSet {
  id: DemoSetId;
  lang: DemoLang;
  presets: DemoPreset[];
}

/* ── India · Hinglish ─────────────────────────────────────── */
const IN: DemoPreset[] = [
  {
    id: 'dental',
    label: 'Dental Clinic',
    emoji: '🦷',
    business: 'Bright Smile Dental',
    greeting: 'Namaste! Bright Smile Dental mein aapka swagat hai 🙏 Main Aisha hoon.',
    intro: 'Bas 3 quick sawaal, phir main aapka appointment set kar deti hoon:',
    fields: [
      { key: 'need', label: 'Treatment', question: 'Aapko kaunsi treatment chahiye?', type: 'choice', options: ['Cleaning', 'Tooth pain', 'Braces / aligners', 'Root canal', 'Other'] },
      { key: 'when', label: 'Timing', question: 'Kab aana convenient hoga?', type: 'choice', options: ['Aaj', 'Kal', 'Iss hafte', 'Agle hafte'] },
      { key: 'name', label: 'Name', question: 'Aapka shubh naam?', type: 'text' },
    ],
    handoff: 'Perfect! 🙏 Aapki details note ho gayi. Hamari team abhi aapko slot confirm karne ke liye call/message karegi.',
  },
  {
    id: 'realestate',
    label: 'Real Estate',
    emoji: '🏠',
    business: 'Prime Estates Delhi',
    greeting: 'Namaste! Prime Estates mein aapka swagat hai 🙏',
    intro: 'Aapki requirement samajh loon taaki sahi options bhej sakoon:',
    fields: [
      { key: 'intent', label: 'Buy / Rent', question: 'Aap kharidna chahte hain ya kiraye par?', type: 'choice', options: ['Kharidna', 'Kiraya', 'Invest'] },
      { key: 'budget', label: 'Budget', question: 'Aapka approx budget?', type: 'choice', options: ['< 50L', '50L – 1Cr', '1Cr+', 'Rent < 20k'] },
      { key: 'area', label: 'Area', question: 'Kaunsa area / locality prefer karenge?', type: 'text' },
      { key: 'name', label: 'Name', question: 'Aapka naam?', type: 'text' },
    ],
    handoff: 'Shukriya! 🙏 Hamara consultant aapko matching options ke saath contact karega.',
  },
  {
    id: 'tuition',
    label: 'Tuition Centre',
    emoji: '📚',
    business: 'Genius Tuition Classes',
    greeting: 'Namaste! Genius Tuition Classes mein aapka swagat hai 🙏',
    intro: 'Admission ke liye 3 chhoti details:',
    fields: [
      { key: 'class', label: 'Class', question: 'Kaunsi class / standard?', type: 'text' },
      { key: 'subject', label: 'Subjects', question: 'Kaunse subjects?', type: 'text' },
      { key: 'mode', label: 'Mode', question: 'Offline ya online?', type: 'choice', options: ['Offline', 'Online', 'Dono'] },
      { key: 'name', label: 'Name', question: 'Aapka / bachche ka naam?', type: 'text' },
    ],
    handoff: 'Dhanyavaad! 🙏 Hum aapko fees aur batch timing ke saath contact karenge.',
  },
  {
    id: 'gym',
    label: 'Gym / Fitness',
    emoji: '🏋️',
    business: 'IronCore Gym',
    greeting: 'Hey! IronCore Gym aapka swagat karta hai 💪',
    intro: 'Bas 2 sawaal aur main aapka trial set kar doon:',
    fields: [
      { key: 'goal', label: 'Goal', question: 'Aapka goal kya hai?', type: 'choice', options: ['Weight loss', 'Muscle gain', 'General fitness', 'Personal training'] },
      { key: 'when', label: 'Timing', question: 'Kab se shuru karna chahte hain?', type: 'choice', options: ['Aaj', 'Iss hafte', 'Agle mahine'] },
      { key: 'name', label: 'Name', question: 'Aapka naam?', type: 'text' },
    ],
    handoff: 'Great! 🙌 Aapka free trial note kar liya. Hamari team slot confirm karegi.',
  },
  {
    id: 'salon',
    label: 'Salon',
    emoji: '💇',
    business: 'Glow Beauty Salon',
    greeting: 'Namaste! Glow Beauty Salon mein aapka swagat hai 🙏 Main Riya hoon.',
    intro: 'Bas 2 minute mein sahi slot book karne ke liye kuch quick details:',
    fields: [
      { key: 'service', label: 'Service', question: 'Kaunsi service ke liye aana chahte hain?', type: 'choice', options: ['Haircut', 'Facial', 'Bridal makeup', 'Waxing', 'Other'] },
      { key: 'when', label: 'Timing', question: 'Kab convenient hai?', type: 'choice', options: ['Aaj', 'Kal', 'Iss hafte', 'Agle hafte'] },
      { key: 'name', label: 'Name', question: 'Aapka naam?', type: 'text' },
    ],
    handoff: 'Perfect! 🙏 Aapki request note ho gayi — team aapko slot confirm karegi.',
  },
  {
    id: 'cafe',
    label: 'Cafe / Takeaway',
    emoji: '☕',
    business: 'Bhukkad Cafe',
    greeting: 'Namaste! Bhukkad Cafe se bol rahe hain 🙏 Order lene ke liye main yahan hoon.',
    intro:
      'Aaj ka menu 👇\n\n☕ Cold Coffee — ₹80\n🍵 Masala Chai — ₹30\n🥪 Veg Grilled Sandwich — ₹120\n🍔 Bhukkad Burger — ₹150\n🍟 Masala Fries — ₹90\n🍰 Chocolate Brownie — ₹100\n\nKya order karna chahoge?',
    fields: [
      {
        key: 'order',
        label: 'Order',
        question: 'Aapka order kya hai?',
        type: 'choice',
        options: ['Cold Coffee ₹80', 'Veg Grilled Sandwich ₹120', 'Bhukkad Burger ₹150', 'Masala Fries ₹90', 'Chocolate Brownie ₹100'],
      },
      {
        key: 'add-on',
        label: 'Add-on',
        question: 'Iske saath kuch aur? Combo me sasta padta hai 😋',
        type: 'choice',
        options: ['Combo: + Fries + Cold drink ₹150', 'Extra Cheese ₹30', 'Brownie add ₹100', 'Nahi, bas itna hi'],
      },
      { key: 'mode', label: 'Mode', question: 'Takeaway ya Delivery?', type: 'choice', options: ['Takeaway (aake le lunga)', 'Delivery'] },
      { key: 'name', label: 'Name', question: 'Aapka naam (delivery ho toh address bhi likh dena)?', type: 'text' },
    ],
    handoff:
      'Order confirm ho gaya! 🧾 Main kitchen ko bhej raha hoon — 15–20 min me ready. Payment UPI/cash. Aapka order record bhi save ho gaya. Shukriya 🙏',
  },
  {
    id: 'legal',
    label: 'Lawyer / Notary',
    emoji: '⚖️',
    business: 'Sharma Legal Associates',
    greeting: 'Namaste! Sharma Legal Associates mein aapka swagat hai 🙏 Main aapki query note kar leta hoon.',
    intro: 'Sahi salah ke liye bas 3 chhoti details batayein:',
    fields: [
      {
        key: 'matter',
        label: 'Matter',
        question: 'Aapko kis kaam ke liye help chahiye?',
        type: 'choice',
        options: ['Property / registry', 'Rent agreement', 'Affidavit / notary', 'Will / power of attorney', 'Court / legal case', 'Other'],
      },
      { key: 'urgency', label: 'Urgency', question: 'Kab tak chahiye?', type: 'choice', options: ['Aaj hi', 'Iss hafte', 'Agle hafte', 'Sirf jaankari chahiye'] },
      { key: 'mode', label: 'Mode', question: 'Kaise baat karna chahenge?', type: 'choice', options: ['Office visit', 'Phone / WhatsApp consult', 'Document bhejna hai'] },
      { key: 'name', label: 'Name', question: 'Aapka shubh naam?', type: 'text' },
    ],
    handoff:
      'Dhanyavaad! 📝 Aapki query note ho gayi. Hamari team aapko consultation slot confirm karne ke liye contact karegi.',
  },
];

/* ── US / UK / Global · English ───────────────────────────── */
const US: DemoPreset[] = [
  {
    id: 'dental',
    label: 'Dental Clinic',
    emoji: '🦷',
    business: 'Bright Smile Dental',
    greeting: 'Hi there! Welcome to Bright Smile Dental. I’m Aisha, the front desk assistant 👋',
    intro: 'A few quick questions and I’ll get you booked in:',
    fields: [
      { key: 'need', label: 'Treatment', question: 'What can we help you with today?', type: 'choice', options: ['Cleaning', 'Tooth pain', 'Braces / aligners', 'Root canal', 'Other'] },
      { key: 'when', label: 'Timing', question: 'When suits you best?', type: 'choice', options: ['Today', 'Tomorrow', 'This week', 'Next week'] },
      { key: 'name', label: 'Name', question: 'What’s your name?', type: 'text' },
    ],
    handoff: 'Perfect — I’ve noted your details. Our team will message you shortly to confirm your slot.',
  },
  {
    id: 'realestate',
    label: 'Real Estate',
    emoji: '🏠',
    business: 'Prime Estates',
    greeting: 'Hi! You’ve reached Prime Estates 👋',
    intro: 'Tell me what you’re after and I’ll line up the right options:',
    fields: [
      { key: 'intent', label: 'Buy / Rent', question: 'Are you looking to buy or rent?', type: 'choice', options: ['Buy', 'Rent', 'Invest'] },
      { key: 'budget', label: 'Budget', question: 'What’s your approximate budget?', type: 'choice', options: ['< $250k', '$250k – $750k', '$750k+', 'Rent < $2k/mo'] },
      { key: 'area', label: 'Area', question: 'Which area or neighbourhood do you prefer?', type: 'text' },
      { key: 'name', label: 'Name', question: 'And your name?', type: 'text' },
    ],
    handoff: 'Thanks! One of our consultants will reach out with matching listings.',
  },
  {
    id: 'coaching',
    label: 'Coaching',
    emoji: '🎓',
    business: 'Apex Coaching',
    greeting: 'Hey! Welcome to Apex Coaching 👋',
    intro: 'Two quick questions so I can match you with the right programme:',
    fields: [
      { key: 'goal', label: 'Goal', question: 'What’s your main goal?', type: 'choice', options: ['Career change', 'Interview prep', 'Skill upgrade', 'Other'] },
      { key: 'when', label: 'Start', question: 'When would you like to start?', type: 'choice', options: ['This week', 'This month', 'Just exploring'] },
      { key: 'name', label: 'Name', question: 'What’s your name?', type: 'text' },
    ],
    handoff: 'Great — I’ve saved your details. A coach will follow up with the next steps.',
  },
  {
    id: 'agency',
    label: 'Agency',
    emoji: '💼',
    business: 'Northline Agency',
    greeting: 'Hi! You’ve reached Northline Agency 👋',
    intro: 'A couple of quick questions so the right person replies:',
    fields: [
      { key: 'service', label: 'Service', question: 'What do you need help with?', type: 'choice', options: ['Website', 'Marketing', 'Design', 'Other'] },
      { key: 'budget', label: 'Budget', question: 'What’s your rough budget?', type: 'choice', options: ['< $2k', '$2k – $10k', '$10k+', 'Not sure yet'] },
      { key: 'name', label: 'Name', question: 'What’s your name?', type: 'text' },
    ],
    handoff: 'Thanks! We’ll get back to you within a few hours with a plan.',
  },
  {
    id: 'salon',
    label: 'Salon',
    emoji: '💇',
    business: 'Glow Studio',
    greeting: 'Hi! Welcome to Glow Studio — I’m Riya 💫',
    intro: 'Quick details and I’ll find you the perfect slot:',
    fields: [
      { key: 'service', label: 'Service', question: 'Which service are you booking?', type: 'choice', options: ['Haircut', 'Facial', 'Bridal makeup', 'Waxing', 'Other'] },
      { key: 'when', label: 'Timing', question: 'When works for you?', type: 'choice', options: ['Today', 'Tomorrow', 'This week', 'Next week'] },
      { key: 'name', label: 'Name', question: 'What’s your name?', type: 'text' },
    ],
    handoff: 'Perfect — your request is noted. The team will confirm your slot shortly.',
  },
];

/* ── Gulf · English ───────────────────────────────────────── */
const GULF_EN: DemoPreset[] = [
  {
    id: 'clinic',
    label: 'Clinic',
    emoji: '🏥',
    business: 'Oasis Medical Center',
    greeting: 'Hello! Welcome to Oasis Medical Center 👋 I’m Layla.',
    intro: 'Just a few quick questions so we can book your visit:',
    fields: [
      { key: 'need', label: 'Specialty', question: 'Which specialty do you need?', type: 'choice', options: ['Dental', 'Dermatology', 'Pediatrics', 'GP', 'Other'] },
      { key: 'when', label: 'Timing', question: 'When would you like to come in?', type: 'choice', options: ['Today', 'Tomorrow', 'This week', 'Next week'] },
      { key: 'name', label: 'Name', question: 'May I have your name?', type: 'text' },
    ],
    handoff: 'Thank you — your details are saved. Our team will confirm your appointment shortly.',
  },
  {
    id: 'realestate',
    label: 'Real Estate',
    emoji: '🏙️',
    business: 'Emirates Prime Realty',
    greeting: 'Hello! You’ve reached Emirates Prime Realty 👋',
    intro: 'Tell me your requirement and I’ll shortlist the right options:',
    fields: [
      { key: 'intent', label: 'Buy / Rent', question: 'Are you looking to buy or rent?', type: 'choice', options: ['Buy', 'Rent', 'Invest'] },
      { key: 'budget', label: 'Budget', question: 'What is your approximate budget?', type: 'choice', options: ['< 1M', '1M – 3M', '3M+', 'Rent < 80k/yr'] },
      { key: 'area', label: 'Area', question: 'Which area or community do you prefer?', type: 'text' },
      { key: 'name', label: 'Name', question: 'May I have your name?', type: 'text' },
    ],
    handoff: 'Thank you! A consultant will contact you with matching options.',
  },
  {
    id: 'salon',
    label: 'Salon',
    emoji: '💇',
    business: 'Luxe Beauty Lounge',
    greeting: 'Hello! Welcome to Luxe Beauty Lounge ✨ I’m Noor.',
    intro: 'A few quick details and I’ll reserve your slot:',
    fields: [
      { key: 'service', label: 'Service', question: 'Which service would you like?', type: 'choice', options: ['Haircut', 'Facial', 'Bridal', 'Nails', 'Other'] },
      { key: 'when', label: 'Timing', question: 'When would you like to come?', type: 'choice', options: ['Today', 'Tomorrow', 'This week', 'Next week'] },
      { key: 'name', label: 'Name', question: 'May I have your name?', type: 'text' },
    ],
    handoff: 'Lovely — your request is noted. We’ll confirm your slot shortly.',
  },
];

/* ── Gulf · Arabic ────────────────────────────────────────── */
const GULF_AR: DemoPreset[] = [
  {
    id: 'clinic',
    label: 'عيادة',
    emoji: '🏥',
    business: 'مركز واحة الطبي',
    greeting: 'مرحباً! أهلاً بك في مركز واحة الطبي 👋 أنا ليلى.',
    intro: 'فقط بعض الأسئلة السريعة لحجز موعدك:',
    fields: [
      { key: 'need', label: 'التخصص', question: 'ما التخصص الذي تحتاجه؟', type: 'choice', options: ['أسنان', 'جلدية', 'أطفال', 'عام', 'أخرى'] },
      { key: 'when', label: 'الموعد', question: 'متى تودّ الحضور؟', type: 'choice', options: ['اليوم', 'غداً', 'هذا الأسبوع', 'الأسبوع القادم'] },
      { key: 'name', label: 'الاسم', question: 'ما اسمك الكريم؟', type: 'text' },
    ],
    handoff: 'شكراً لك — تم حفظ بياناتك. سيتواصل فريقنا لتأكيد موعدك قريباً.',
  },
  {
    id: 'realestate',
    label: 'عقارات',
    emoji: '🏙️',
    business: 'عقارات الإمارات الأولى',
    greeting: 'مرحباً! وصلت إلى عقارات الإمارات الأولى 👋',
    intro: 'أخبرني بطلبك وسأرشّح لك الخيارات المناسبة:',
    fields: [
      { key: 'intent', label: 'شراء / إيجار', question: 'هل تبحث عن شراء أم إيجار؟', type: 'choice', options: ['شراء', 'إيجار', 'استثمار'] },
      { key: 'budget', label: 'الميزانية', question: 'ما ميزانيتك التقريبية؟', type: 'choice', options: ['أقل من مليون', 'مليون – 3 ملايين', 'أكثر من 3 ملايين', 'إيجار'] },
      { key: 'area', label: 'المنطقة', question: 'ما المنطقة أو الحي المفضّل؟', type: 'text' },
      { key: 'name', label: 'الاسم', question: 'ما اسمك الكريم؟', type: 'text' },
    ],
    handoff: 'شكراً لك! سيتواصل معك أحد مستشارينا بالخيارات المطابقة.',
  },
  {
    id: 'salon',
    label: 'صالون',
    emoji: '💇',
    business: 'صالون لوكس بيوتي',
    greeting: 'مرحباً! أهلاً بك في صالون لوكس بيوتي ✨ أنا نور.',
    intro: 'بعض التفاصيل السريعة وسأحجز لك موعدك:',
    fields: [
      { key: 'service', label: 'الخدمة', question: 'ما الخدمة التي ترغب بها؟', type: 'choice', options: ['قص شعر', 'عناية بالبشرة', 'عرائس', 'أظافر', 'أخرى'] },
      { key: 'when', label: 'الموعد', question: 'متى تودّ الحضور؟', type: 'choice', options: ['اليوم', 'غداً', 'هذا الأسبوع', 'الأسبوع القادم'] },
      { key: 'name', label: 'الاسم', question: 'ما اسمك الكريم؟', type: 'text' },
    ],
    handoff: 'رائع — تم تسجيل طلبك. سنؤكد لك الموعد قريباً.',
  },
];

/* ── Brazil · Portuguese ──────────────────────────────────── */
const BR: DemoPreset[] = [
  {
    id: 'clinica',
    label: 'Clínica',
    emoji: '🦷',
    business: 'Clínica Sorriso',
    greeting: 'Olá! Bem-vindo à Clínica Sorriso 👋 Eu sou a Aisha.',
    intro: 'Só algumas perguntas rápidas e já marco seu horário:',
    fields: [
      { key: 'need', label: 'Tratamento', question: 'Como podemos ajudar hoje?', type: 'choice', options: ['Limpeza', 'Dor de dente', 'Aparelho', 'Canal', 'Outro'] },
      { key: 'when', label: 'Horário', question: 'Qual o melhor horário para você?', type: 'choice', options: ['Hoje', 'Amanhã', 'Esta semana', 'Próxima semana'] },
      { key: 'name', label: 'Nome', question: 'Qual o seu nome?', type: 'text' },
    ],
    handoff: 'Perfeito — anotei seus dados. Nossa equipe vai confirmar seu horário em breve.',
  },
  {
    id: 'imoveis',
    label: 'Imóveis',
    emoji: '🏠',
    business: 'Prime Imóveis',
    greeting: 'Olá! Você falou com a Prime Imóveis 👋',
    intro: 'Me diga o que procura e eu seleciono as melhores opções:',
    fields: [
      { key: 'intent', label: 'Comprar / Alugar', question: 'Você quer comprar ou alugar?', type: 'choice', options: ['Comprar', 'Alugar', 'Investir'] },
      { key: 'budget', label: 'Orçamento', question: 'Qual o orçamento aproximado?', type: 'choice', options: ['Até R$ 500 mil', 'R$ 500 mil – 1,5 mi', 'Acima de 1,5 mi', 'Aluguel'] },
      { key: 'area', label: 'Região', question: 'Qual bairro ou região você prefere?', type: 'text' },
      { key: 'name', label: 'Nome', question: 'Qual o seu nome?', type: 'text' },
    ],
    handoff: 'Obrigado! Um consultor entrará em contato com opções compatíveis.',
  },
  {
    id: 'academia',
    label: 'Academia',
    emoji: '🏋️',
    business: 'IronCore Academia',
    greeting: 'Oi! Bem-vindo à IronCore Academia 💪',
    intro: 'Só duas perguntas e eu agendo sua aula experimental:',
    fields: [
      { key: 'goal', label: 'Objetivo', question: 'Qual é o seu objetivo?', type: 'choice', options: ['Emagrecer', 'Ganhar massa', 'Condicionamento', 'Personal'] },
      { key: 'when', label: 'Início', question: 'Quando quer começar?', type: 'choice', options: ['Hoje', 'Esta semana', 'Este mês'] },
      { key: 'name', label: 'Nome', question: 'Qual o seu nome?', type: 'text' },
    ],
    handoff: 'Ótimo! Registrei sua aula experimental. A equipe vai confirmar o horário.',
  },
  {
    id: 'salao',
    label: 'Salão',
    emoji: '💇',
    business: 'Glow Salão',
    greeting: 'Olá! Bem-vindo ao Glow Salão ✨ Eu sou a Riya.',
    intro: 'Alguns detalhes rápidos e encontro o horário perfeito para você:',
    fields: [
      { key: 'service', label: 'Serviço', question: 'Qual serviço você quer agendar?', type: 'choice', options: ['Corte', 'Facial', 'Maquiagem de noiva', 'Depilação', 'Outro'] },
      { key: 'when', label: 'Horário', question: 'Quando funciona para você?', type: 'choice', options: ['Hoje', 'Amanhã', 'Esta semana', 'Próxima semana'] },
      { key: 'name', label: 'Nome', question: 'Qual o seu nome?', type: 'text' },
    ],
    handoff: 'Perfeito — seu pedido foi registrado. Vamos confirmar seu horário em breve.',
  },
];

export const DEMO_SETS: Record<DemoSetId, DemoSet> = {
  in: { id: 'in', lang: 'hinglish', presets: IN },
  us: { id: 'us', lang: 'en', presets: US },
  'gulf-en': { id: 'gulf-en', lang: 'en', presets: GULF_EN },
  'gulf-ar': { id: 'gulf-ar', lang: 'ar', presets: GULF_AR },
  br: { id: 'br', lang: 'pt', presets: BR },
};

export function resolveDemoSet(country: CountryCode, locale: Locale): DemoSet {
  switch (country) {
    case 'IN':
      return DEMO_SETS.in;
    case 'BR':
      return DEMO_SETS.br;
    case 'SA':
      return DEMO_SETS['gulf-ar'];
    case 'AE':
      return locale === 'ar' ? DEMO_SETS['gulf-ar'] : DEMO_SETS['gulf-en'];
    default:
      return DEMO_SETS.us;
  }
}
