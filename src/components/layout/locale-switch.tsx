'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LOCALES, LOCALE_LABEL, type Locale } from '@/content/locales';
import { swapLocale } from '@/lib/paths';
import { cn } from '@/lib/cn';

/** Client-side only because it needs the current path: swapping the locale
 *  segment keeps the visitor where they are, rather than dropping them at the
 *  top of the other language's home page. */
export function LocaleSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 text-sm">
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={swapLocale(pathname, l)}
          hrefLang={l}
          aria-current={l === locale ? 'true' : undefined}
          aria-label={LOCALE_LABEL[l]}
          className={cn(
            'duration-fast rounded-full px-2 py-1 uppercase transition-colors',
            l === locale
              ? 'text-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
