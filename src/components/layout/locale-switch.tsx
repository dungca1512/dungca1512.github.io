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
          aria-current={l === locale ? 'page' : undefined}
          // Composed from the two strings that already exist — the visible
          // code (`l`, rendered upper-cased by CSS) and the full name — so
          // the accessible name contains what the link visibly says. An
          // aria-label of the full name alone ("Tiếng Việt") replaces the
          // visible content entirely and does not begin with it, which fails
          // WCAG 2.5.3 Label in Name for a speech-input user saying "vi".
          aria-label={`${l} — ${LOCALE_LABEL[l]}`}
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
