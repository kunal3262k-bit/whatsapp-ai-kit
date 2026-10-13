import { notFound } from 'next/navigation';
import ContractBuilder from '../../components/ContractBuilder';
import { requireAdmin } from '../../lib/session';

export const dynamic = 'force-dynamic';

export default async function ContractPage() {
  if (!(await requireAdmin())) notFound();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-5">
        <h1 className="text-xl font-bold text-zinc-100">Contract / Scope Generator</h1>
        <p className="text-sm text-zinc-500">
          Fill the deal, copy or download the ready-to-send WhatsApp scope. 12-hour SLA · 50% advance · no result guarantee.
        </p>
      </header>
      <ContractBuilder />
    </main>
  );
}
