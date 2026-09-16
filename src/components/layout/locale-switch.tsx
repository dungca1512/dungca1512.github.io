'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LOCALES, LOCALE_FLAG, LOCALE_LABEL, type Locale } from '@/content/locales';
import { swapLocale } from '@/lib/paths';
import { cn } from '@/lib/cn';

/** Client-side only because it needs the current path: swapping the locale
 *  segment keeps the visitor where they are, rather than dropping them at the
 *  top of the other language's home page. */
export function LocaleSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1.5">
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={swapLocale(pathname, l)}
          hrefLang={l}
          aria-current={l === locale ? 'page' : undefined}
          // The links used to read "VI" and "EN", and the accessible name was
          // built as `vi — Tiếng Việt` so that it began with the visible text,
          // per WCAG 2.5.3 Label in Name. With a flag and no text there is no
          // visible label for a name to have to contain, so 2.5.3 no longer
          // applies and the full language name stands alone — which is also
          // what a speech-input user now has to say, since there is no longer
          // a two-letter code on screen to say instead.
          //
          // `title` as well as `aria-label`: the tooltip is for the sighted
          // reader who does not recognise a 20px flag. A screen reader ignores
          // title once aria-label is present, so it is not announced twice.
          aria-label={LOCALE_LABEL[l]}
          title={LOCALE_LABEL[l]}
          className={cn(
            'duration-fast block rounded-full transition-all',
            // Opacity, not `grayscale`. Desaturating the inactive flag is the
            // obvious way to say "not selected" and it works fine for Vietnam
            // — a red disc with a star survives as a grey disc with a star.
            // It destroys the union flag: at 20px, stripped of its blue and
            // its red, it reads as a grey plus sign and nothing else. Looked
            // at it; that is what it did.
            l === locale ? 'opacity-100' : 'opacity-50 hover:opacity-100',
          )}
        >
          {/* A plain <img>, like Illustration: next/image is off in this export
              (images.unoptimized), and an <img> keeps the flag out of the JS
              bundle entirely. `alt=""` with aria-hidden because the link above
              already carries the name — an alt here would say it twice.
              width/height so the pill does not reflow while the two files
              load. */}
          <img
            src={LOCALE_FLAG[l]}
            alt=""
            aria-hidden="true"
            width={20}
            height={20}
            className={cn(
              'block size-5 rounded-full border',
              // The other half of the state signal, and the reason opacity
              // alone is enough: the current locale's flag is ringed in the
              // text colour, the other in the ordinary hairline. The ring does
              // real work in both themes as well — these flags carry a lot of
              // white, which has no edge against a light pill, and a lot of
              // dark blue, which has none against a dark one.
              l === locale ? 'border-foreground/45' : 'border-border/60',
            )}
          />
        </Link>
      ))}
    </div>
  );
}
