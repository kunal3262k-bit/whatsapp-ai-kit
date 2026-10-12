import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand">404</p>
      <h1 className="mt-3 text-3xl font-bold">This page has moved on.</h1>
      <p className="mt-4 text-slate-600">
        The page you were looking for is not here. Let&apos;s get you back on track.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
      >
        Back to home →
      </Link>
    </main>
  );
}
