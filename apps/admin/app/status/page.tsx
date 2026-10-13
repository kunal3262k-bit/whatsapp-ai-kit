import { notFound } from 'next/navigation';
import BotStatus from '../../components/BotStatus';
import { getBotActivity } from '../../lib/bot';
import { requireAdmin } from '../../lib/session';

export const dynamic = 'force-dynamic';

export default async function StatusPage() {
  if (!(await requireAdmin())) notFound();

  const data = await getBotActivity();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-5">
        <h1 className="text-xl font-bold text-zinc-100">Bot Status</h1>
        <p className="text-sm text-zinc-500">
          Live health and last-activity, derived from the bot&apos;s Supabase writes.
        </p>
      </header>
      <BotStatus initial={data} />
    </main>
  );
}
