'use client';

import { useApp } from './AppProvider';
import { WhatsAppIcon } from './icons';
import { WHATSAPP } from './ui';

export default function MobileCta() {
  const { t } = useApp();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-paper/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:hidden">
      <a
        href={WHATSAPP}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-12 items-center justify-center gap-2.5 rounded-lg bg-wa text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(15,15,15,0.08)] transition-[transform,background-color] duration-200 ease-smooth active:scale-[0.99] active:bg-wa-deep"
      >
        <WhatsAppIcon className="h-5 w-5" />
        {t.common.whatsappCta}
      </a>
    </div>
  );
}