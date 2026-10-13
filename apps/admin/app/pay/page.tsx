import { notFound } from 'next/navigation';
import PayPanel from '../../components/PayPanel';
import { requireAdmin } from '../../lib/session';

export const dynamic = 'force-dynamic';

export default async function PayPage() {
  if (!(await requireAdmin())) notFound();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-5 text-center">
        <h1 className="text-xl font-bold text-zinc-100">Collect payment</h1>
        <p className="text-sm text-zinc-500">Quick UPI QR + one-tap app links. Send the link or screenshot to the client.</p>
      </header>
      <PayPanel />
    </main>
  );
}
