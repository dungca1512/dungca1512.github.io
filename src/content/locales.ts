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
