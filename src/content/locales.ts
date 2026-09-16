export const LOCALES = ['vi', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'vi';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Bilingual content. Requiring BOTH keys is the whole point: a missing
 *  translation becomes a typecheck failure instead of a blank on the page. */
export type Localized<T> = Record<Locale, T>;

export const LOCALE_LABEL: Localized<string> = { vi: 'Tiếng Việt', en: 'English' };
export const BCP47: Localized<string> = { vi: 'vi', en: 'en' };

/** The switcher's mark for each locale. A `Localized<T>` on purpose: adding a
 *  third language makes this a typecheck failure until it has a flag, the same
 *  way it already does for the label. The files live in public/ rather than
 *  inline in the component because an SVG carrying literal hex belongs outside
 *  the token layer — a national flag does not flip with the theme — and
 *  check:colors scans src/ only. */
export const LOCALE_FLAG: Localized<string> = { vi: '/flags/vn.svg', en: '/flags/gb.svg' };
