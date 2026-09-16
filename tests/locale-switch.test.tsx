import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Outside a mounted App Router, usePathname() returns null under jsdom, and
// swapLocale() throws on a null pathname — same fix as tests/menu-bar.test.tsx.
vi.mock('next/navigation', () => ({ usePathname: () => '/vi/' }));

const { LocaleSwitch } = await import('@/components/layout/locale-switch');
const { LOCALE_LABEL } = await import('@/content/locales');

describe('LocaleSwitch', () => {
  it('gives each link an accessible name that contains its visible label', () => {
    // WCAG 2.5.3 Label in Name. Falsify by setting aria-label to LOCALE_LABEL[l]
    // alone (e.g. "Tiếng Việt"): the visible text is "vi", which does not
    // appear anywhere in that label, and this assertion would fail.
    render(<LocaleSwitch locale="vi" />);
    const link = screen.getByRole('link', { name: /^vi/ });
    expect(link).toHaveTextContent('vi');
    expect(link.getAttribute('aria-label')).toContain('vi');
    expect(link.getAttribute('aria-label')).toContain(LOCALE_LABEL.vi);
  });

  it('marks only the current locale as the current page', () => {
    // Falsify by changing aria-current to "true": that value is not one of
    // the enumerated aria-current tokens for a page link, and this specific
    // check for the string "page" would fail.
    render(<LocaleSwitch locale="vi" />);
    const current = screen.getByRole('link', { name: /^vi/ });
    const other = screen.getByRole('link', { name: /^en/ });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(other).not.toHaveAttribute('aria-current');
  });
});
