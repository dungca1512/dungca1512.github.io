import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Outside a mounted App Router, usePathname() returns null under jsdom, and
// swapLocale() throws on a null pathname — same fix as tests/menu-bar.test.tsx.
vi.mock('next/navigation', () => ({ usePathname: () => '/vi/' }));

const { LocaleSwitch } = await import('@/components/layout/locale-switch');
const { LOCALES, LOCALE_FLAG, LOCALE_LABEL } = await import('@/content/locales');

describe('LocaleSwitch', () => {
  /* The switcher showed the text "VI" and "EN" until the owner asked for
     flags. Text carried its own accessible name; a picture does not, and the
     failure mode of a flag-only control is a link a screen reader announces
     as "link, /en/" — or as nothing at all. So the name is asserted per
     locale, from the dictionary, rather than by matching one hard-coded
     string.

     The aria-label is asserted SEPARATELY from the name, and that is not
     redundant: the first version of this test checked only the computed name,
     and deleting aria-label from the component left it green, because `title`
     is a fallback in the accessible-name algorithm and was silently standing
     in. Found by running that exact mutation. A name that exists only because
     of `title` is the weak path — some assistive tech surfaces it late or not
     at all, and a touch user gets no tooltip — so the label is pinned as the
     thing that carries the name, with `title` as the sighted-reader extra. */
  for (const l of LOCALES) {
    it(`${l}: the link is named by the language, not by its href`, () => {
      render(<LocaleSwitch locale="vi" />);
      const link = screen.getByRole('link', { name: LOCALE_LABEL[l] });
      expect(link).toHaveAttribute('hrefLang', l);
      expect(link.getAttribute('aria-label')).toBe(LOCALE_LABEL[l]);
    });
  }

  it('does not announce the flag a second time', () => {
    // The <img> is aria-hidden with an empty alt, so the link's name is the
    // label alone. Falsify by giving the img alt={LOCALE_LABEL[l]}: the
    // accessible name becomes "Tiếng Việt Tiếng Việt" and the exact-string
    // lookup above stops matching.
    const { container } = render(<LocaleSwitch locale="vi" />);
    const imgs = [...container.querySelectorAll('img')];
    expect(imgs).toHaveLength(LOCALES.length);
    for (const img of imgs) {
      expect(img.getAttribute('alt')).toBe('');
      expect(img).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('points each link at its own flag file', () => {
    // Both links rendering the same flag is the regression this catches — it
    // looks fine in a screenshot only if you know which flag is which.
    const { container } = render(<LocaleSwitch locale="vi" />);
    const srcs = [...container.querySelectorAll('img')].map((i) => i.getAttribute('src'));
    expect(srcs).toEqual(LOCALES.map((l) => LOCALE_FLAG[l]));
    expect(new Set(srcs).size).toBe(LOCALES.length);
  });

  it('marks only the current locale as the current page', () => {
    // Falsify by changing aria-current to "true": that value is not one of
    // the enumerated aria-current tokens for a page link, and this specific
    // check for the string "page" would fail.
    render(<LocaleSwitch locale="vi" />);
    expect(screen.getByRole('link', { name: LOCALE_LABEL.vi })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: LOCALE_LABEL.en })).not.toHaveAttribute('aria-current');
  });
});
