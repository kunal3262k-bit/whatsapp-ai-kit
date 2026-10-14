export interface DemoField {
  key: string;
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

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'dental',
    label: 'Dental Clinic',
    emoji: '🦷',
    business: 'Bright Smile Dental',
    greeting: 'Namaste! Bright Smile Dental mein aapka swagat hai 🙏 Main Aisha hoon.',
    intro: 'Bas 3 quick sawaal, phir main aapka appointment set kar deti hoon:',
    fields: [
      { key: 'need', question: 'Aapko kaunsi treatment chahiye?', type: 'choice', options: ['Cleaning', 'Tooth pain', 'Braces / aligners', 'Root canal', 'Other'] },
      { key: 'when', question: 'Kab aana convenient hoga?', type: 'choice', options: ['Aaj', 'Kal', 'Iss hafte', 'Agle hafte'] },
      { key: 'name', question: 'Aapka shubh naam?', type: 'text' },
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
      { key: 'intent', question: 'Aap kharidna chahte hain ya kiraye par?', type: 'choice', options: ['Kharidna', 'Kiraya', 'Invest'] },
      { key: 'budget', question: 'Aapka approx budget?', type: 'choice', options: ['< 50L', '50L - 1Cr', '1Cr+', 'Rent < 20k'] },
      { key: 'area', question: 'Kaunsa area / locality prefer karenge?', type: 'text' },
      { key: 'name', question: 'Aapka naam?', type: 'text' },
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
      { key: 'class', question: 'Kaunsi class / standard?', type: 'text' },
      { key: 'subject', question: 'Kaunse subjects?', type: 'text' },
      { key: 'mode', question: 'Offline ya online?', type: 'choice', options: ['Offline', 'Online', 'Dono'] },
      { key: 'name', question: 'Aapka / bachche ka naam?', type: 'text' },
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
      { key: 'goal', question: 'Aapka goal kya hai?', type: 'choice', options: ['Weight loss', 'Muscle gain', 'General fitness', 'Personal training'] },
      { key: 'when', question: 'Kab se shuru karna chahte hain?', type: 'choice', options: ['Aaj', 'Iss hafte', 'Agle mahine'] },
      { key: 'name', question: 'Aapka naam?', type: 'text' },
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
      { key: 'service', question: 'Kaunsi service ke liye aana chahte hain?', type: 'choice', options: ['Haircut', 'Facial', 'Bridal makeup', 'Waxing', 'Other'] },
      { key: 'when', question: 'Kab convenient hai?', type: 'choice', options: ['Aaj', 'Kal', 'Iss hafte', 'Agle hafte'] },
      { key: 'name', question: 'Aapka naam?', type: 'text' },
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
        question: 'Aapka order kya hai?',
        type: 'choice',
        options: ['Cold Coffee ₹80', 'Veg Grilled Sandwich ₹120', 'Bhukkad Burger ₹150', 'Masala Fries ₹90', 'Chocolate Brownie ₹100'],
      },
      {
        key: 'add-on',
        question: 'Iske saath kuch aur? Combo me sasta padta hai 😋',
        type: 'choice',
        options: ['Combo: + Fries + Cold drink ₹150', 'Extra Cheese ₹30', 'Brownie add ₹100', 'Nahi, bas itna hi'],
      },
      { key: 'mode', question: 'Takeaway ya Delivery?', type: 'choice', options: ['Takeaway (aake le lunga)', 'Delivery'] },
      { key: 'name', question: 'Aapka naam (delivery ho toh address bhi likh dena)?', type: 'text' },
    ],
    handoff:
      'Order confirm ho gaya! 🧾 Main kitchen ko bhej raha hoon — 15–20 min me ready. Payment UPI/cash. Aapka order record bhi save ho gaya. Shukriya 🙏',
  },
];
