import Link from 'next/link';
import { Eyebrow } from '../components/ui';

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-28 text-center">
      <div className="font-mono text-6xl font-semibold tracking-tight text-ink">404</div>
      <Eyebrow className="mt-6">Page not found</Eyebrow>
      <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink">
        This page has moved on.
      </h1>
      <p className="mt-4 text-pretty text-zinc-500">
        The page you were looking for is not here. Let&apos;s get you back on track.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-wa px-6 text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(15,15,15,0.08)] transition-[transform,box-shadow,background-color] duration-200 ease-smooth hover:scale-[1.02] hover:bg-wa-deep hover:shadow-cta"
      >
        Back to home
      </Link>
    </main>
  );
}