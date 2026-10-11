export const metadata = {
  title: 'Pay — AI Automation Studio',
};

/**
 * Simple UPI payment page. Set these in the dashboard's env (Vercel):
 *   NEXT_PUBLIC_UPI_ID=yourname@upi
 *   NEXT_PUBLIC_UPI_NAME=Your Business
 *   NEXT_PUBLIC_CLIENT_NAME=Client Co (optional, personalizes the note)
 */
export default function PayPage() {
  const upiId = process.env.NEXT_PUBLIC_UPI_ID || 'yourname@upi';
  const name = process.env.NEXT_PUBLIC_UPI_NAME || 'AI Automation Studio';
  const client = process.env.NEXT_PUBLIC_CLIENT_NAME || '';

  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    name
  )}&cu=INR${client ? `&tn=${encodeURIComponent('Setup: ' + client)}` : ''}`;

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    upiUri
  )}`;

  return (
    <main className="mx-auto max-w-md px-6 py-14 text-center">
      <h1 className="text-2xl font-bold">Pay setup fee</h1>
      <p className="mt-2 text-slate-600">
        Scan with any UPI app (GPay / PhonePe / Paytm), or tap the button on your phone.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Replace this image with your own static QR by dropping /public/upi-qr.png
            and using <img src="/upi-qr.png" /> if you prefer not to use the QR service. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrSrc}
          alt="UPI QR code"
          width={260}
          height={260}
          className="mx-auto rounded-xl"
        />
        <div className="mt-4 text-sm text-slate-500">UPI ID</div>
        <div className="text-lg font-semibold">{upiId}</div>

        <a
          href={upiUri}
          className="mt-6 inline-block w-full rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
        >
          Open UPI app
        </a>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        After paying, send the screenshot on WhatsApp. Work starts immediately.
        No results are guaranteed — you receive a working setup and a tracked report.
      </p>
    </main>
  );
}
