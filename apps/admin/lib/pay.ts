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

export const PAY_PILLS = [5000, 7000, 10000, 15000];
