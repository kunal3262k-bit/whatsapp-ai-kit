import Link from 'next/link';
import { cn } from '../lib/cn';
import { WhatsAppIcon } from './icons';

export const WHATSAPP = 'https://wa.me/919717745568';

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('font-mono text-xs uppercase tracking-widest text-zinc-500', className)}>
      {children}
    </div>
  );
}

export function SectionHead({
  index,
  title,
  subtitle,
  align = 'start',
  className,
}: {
  index?: string;
  title: string;
  subtitle?: string;
  align?: 'start' | 'center';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className
      )}
    >
      {index && <Eyebrow className="text-zinc-400">{index}</Eyebrow>}
      <h2 className="mt-3 text-pretty text-3xl font-semibold tracking-tight text-ink lg:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className={cn('mt-4 text-pretty text-base leading-relaxed text-zinc-500 lg:text-lg')}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function isExternal(href: string): boolean {
  return href.startsWith('http');
}

export function PrimaryCta({
  href = WHATSAPP,
  children,
  className,
}: {
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const cls = cn(
    'inline-flex h-12 items-center justify-center gap-2.5 rounded-lg bg-wa px-6 text-[15px] font-semibold text-white',
    'shadow-[0_1px_2px_rgba(15,15,15,0.08)] transition-[transform,box-shadow,background-color] duration-200 ease-smooth',
    'hover:scale-[1.02] hover:bg-wa-deep hover:shadow-cta active:scale-[1.01]',
    className
  );
  const inner = (
    <>
      <WhatsAppIcon className="h-[18px] w-[18px] shrink-0" />
      <span>{children}</span>
    </>
  );
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

export function GhostCta({
  href,
  children,
  className,
  dark = false,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}) {
  const cls = cn(
    'inline-flex h-12 items-center justify-center rounded-lg border px-6 text-[15px] font-semibold',
    'transition-[transform,background-color,border-color] duration-200 ease-smooth hover:scale-[1.02] active:scale-[1.01]',
    dark
      ? 'border-white/15 text-white hover:bg-white/5'
      : 'border-zinc-200 bg-white text-ink hover:bg-zinc-50',
    className
  );
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}