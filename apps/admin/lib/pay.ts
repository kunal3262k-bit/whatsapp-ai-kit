export interface UpiInput {
  upiId: string;
  name: string;
  amount: number;
  note?: string;
}

/** UPI intent query string: pa/pn/am/cu (+ tn). */
export function buildUpiQuery({ upiId, name, amount, note }: UpiInput): string {
  const params = new URLSearchParams({
    pa: upiId,
    pn: name,
    am: String(amount),
    cu: 'INR',
  });
  if (note && note.trim()) params.set('tn', note.trim());
  return params.toString();
}

export function upiUri(input: UpiInput): string {
  return `upi://pay?${buildUpiQuery(input)}`;
}

/** External QR renderer (no client dependency). */
export function qrSrcFor(uri: string, size = 260): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(uri)}`;
}

export interface PayApp {
  label: string;
  href: string;
}

export function payApps(query: string): PayApp[] {
  return [
    { label: 'GPay', href: `gpay://upi/pay?${query}` },
    { label: 'PhonePe', href: `phonepe://pay?${query}` },
    { label: 'Paytm', href: `paytmmp://pay?${query}` },
    { label: 'Any UPI app', href: `upi://pay?${query}` },
  ];
}

export interface PayPill {
  amount: number;
  label: string;
}

/** Quick amounts: one-time setups first, then monthly care-plan / voice renewals. */
export const PAY_PILLS: PayPill[] = [
  { amount: 6000, label: 'Setup ₹6k' },
  { amount: 10000, label: 'Setup ₹10k' },
  { amount: 15000, label: 'Setup ₹15k' },
  { amount: 2000, label: 'Care Lite ₹2k/mo' },
  { amount: 4000, label: 'Care Plus ₹4k/mo' },
  { amount: 7999, label: 'Voice ₹8k/mo' },
];
