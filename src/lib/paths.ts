import { LOCALES, type Locale } from '@/content/locales';

/** next.config sets `trailingSlash: true`, so every internal href must end in a
 *  slash. A link to `/vi` instead of `/vi/` still works, but costs the visitor
 *  a redirect on every single click. */
export function localeHref(locale: Locale, path = '/'): string {
  // Strip every leading and trailing slash, not just one: `''`, `'/'`, `'//'`
  // and `'///'` must all collapse to the locale root. Prepending a slash to an
  // already-empty remainder is what produced `/vi//` before.
  const clean = path.replace(/^\/+|\/+$/g, '');
  return clean ? `/${locale}/${clean}/` : `/${locale}/`;
}

export function localeAnchorHref(locale: Locale, anchor: string): string {
  const clean = anchor.startsWith('#') ? anchor : `#${anchor}`;
  return `${localeHref(locale)}${clean}`;
}

/** Used by the language switch. Swapping the first segment keeps the visitor
 *  where they were; sending them to the locale root would lose their place. */
export function swapLocale(pathname: string, next: Locale): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && (LOCALES as readonly string[]).includes(segments[0])) {
    segments[0] = next;
    return `/${segments.join('/')}/`;
  }
  return `/${next}/`;
}
