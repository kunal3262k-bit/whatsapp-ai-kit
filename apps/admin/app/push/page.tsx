import { notFound } from 'next/navigation';
import PushNotifications from '../../components/PushNotifications';
import { pushEnv } from '../../lib/push';
import { requireAdmin } from '../../lib/session';

export const dynamic = 'force-dynamic';

export default async function PushPage() {
  if (!(await requireAdmin())) notFound();

  const { publicKey, configured } = pushEnv();

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <header className="mb-5">
        <h1 className="text-xl font-bold text-zinc-100">Push Notifications</h1>
        <p className="text-sm text-zinc-500">
          Enable alerts on this device, then list and prune subscriptions.
        </p>
      </header>
      <PushNotifications publicKey={publicKey} serverReady={configured} />
    </main>
  );
}
