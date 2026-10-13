import { notFound } from 'next/navigation';
import OutreachBoard from '../../components/OutreachBoard';
import { requireAdmin } from '../../lib/session';

export const dynamic = 'force-dynamic';

export default async function OutreachPage() {
  if (!(await requireAdmin())) notFound();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-5">
        <h1 className="text-xl font-bold text-zinc-100">Outreach Accelerator</h1>
        <p className="text-sm text-zinc-500">
          110051 seed list · 5 pitch angles · ₹30k tracker. Send manually — max 15–20/day, one follow-up.
        </p>
      </header>
      <OutreachBoard />
    </main>
  );
}
