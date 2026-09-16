import { describe, it, expect } from 'vitest';
import { localeHref, localeAnchorHref, swapLocale } from '@/lib/paths';
import { isLocale, LOCALES, DEFAULT_LOCALE } from '@/content/locales';
import { cn } from '@/lib/cn';

describe('locales', () => {
  it('is vi then en, defaulting to vi', () => {
    expect([...LOCALES]).toEqual(['vi', 'en']);
    expect(DEFAULT_LOCALE).toBe('vi');
  });

  it('rejects anything else', () => {
    expect(isLocale('vi')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale('')).toBe(false);
  });
});

describe('localeHref', () => {
  // Every href ends in a slash because next.config sets trailingSlash: true.
  // A link to /vi without it costs the visitor a redirect on every click.
  it('builds a trailing-slash URL', () => {
    expect(localeHref('vi')).toBe('/vi/');
    expect(localeHref('en', '/')).toBe('/en/');
    expect(localeHref('vi', 'work')).toBe('/vi/work/');
    expect(localeHref('vi', '/work/')).toBe('/vi/work/');
  });

  // These are the inputs that produced `/vi//` before the fix. A malformed href
  // still resolves, but costs the visitor a redirect on every click — the exact
  // cost the trailing-slash rule above exists to avoid.
  it('collapses empty and slash-only paths to the locale root', () => {
    expect(localeHref('vi', '')).toBe('/vi/');
    expect(localeHref('vi', '//')).toBe('/vi/');
    expect(localeHref('vi', '///')).toBe('/vi/');
  });

  it('strips repeated slashes at either end', () => {
    expect(localeHref('vi', '//work//')).toBe('/vi/work/');
  });
});

describe('localeAnchorHref', () => {
  it('accepts an anchor with or without the hash', () => {
    expect(localeAnchorHref('vi', 'work')).toBe('/vi/#work');
    expect(localeAnchorHref('vi', '#work')).toBe('/vi/#work');
  });
});

describe('swapLocale', () => {
  it('replaces the locale segment and keeps the rest of the path', () => {
    expect(swapLocale('/vi/work/', 'en')).toBe('/en/work/');
  });

  it('falls back to the locale root when the path has no locale segment', () => {
    expect(swapLocale('/', 'en')).toBe('/en/');
    expect(swapLocale('/nonsense/', 'en')).toBe('/en/');
  });
});

describe('cn', () => {
  it('drops falsy parts so `cond && "class"` is safe inline', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });
});
