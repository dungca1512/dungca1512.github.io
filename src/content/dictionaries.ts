import { lang } from 'next/root-params';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from './locales';
import vi, { type Dictionary } from './dictionaries/vi';
import en from './dictionaries/en';

const dictionaries: Record<Locale, Dictionary> = { vi, en };

/** Reads the locale from the root param. Every Server Component can call this,
 *  which is why no component below takes a `locale` prop it does not use. */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!value || !isLocale(value)) notFound();
  return value;
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()];
}

export type { Dictionary };
