import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkipLink } from '@/components/site/skip-link';

// LocaleSwitch (rendered inside MenuBar) is a client component that reads
// the current path via next/navigation's usePathname. Outside a mounted App
// Router, that hook returns null under jsdom, and swapLocale() throws on a
// null pathname — so it needs a value here, the same way a real navigation
// context would supply one.
vi.mock('next/navigation', () => ({ usePathname: () => '/vi/' }));

const { MenuBar } = await import('@/components/layout/menu-bar');
const { default: viDict } = await import('@/content/dictionaries/vi');

describe('SkipLink', () => {
  it('points at #main', () => {
    render(<SkipLink label="Tới nội dung chính" />);
    expect(screen.getByRole('link', { name: 'Tới nội dung chính' })).toHaveAttribute(
      'href',
      '#main',
    );
  });

  it('is reachable but off-screen until focused, not display:none', () => {
    // display:none removes it from the tab order, which defeats the entire
    // purpose of a skip link.
    const { container } = render(<SkipLink label="skip" />);
    const link = container.querySelector('a');
    expect(link?.className).toMatch(/sr-only/);
    expect(link?.className).toMatch(/focus:not-sr-only/);
  });
});

describe('MenuBar', () => {
  // Pinned explicitly, not read back off the component: these are the
  // section ids Tasks 8–12 give each band (task-10: expertise, projects;
  // task-11: experience, capabilities; task-12: writing, contact — minus
  // `capabilities`, which has a section but deliberately no nav entry,
  // since `dict.nav` has no `capabilities` key). Nothing else in the suite
  // checks that the nav's anchors land on ids that actually exist, so this
  // list is the contract Tasks 8–12 must keep true.
  const EXPECTED_SECTION_IDS = ['expertise', 'projects', 'experience', 'writing', 'contact'];

  it('emits nav anchors that resolve to the section ids the later sections give each band', () => {
    const { container } = render(<MenuBar locale="vi" dict={viDict} />);
    // Compares fragments only, not the full href: next/link rendered outside
    // a mounted App Router (as it is here) resolves the path portion a
    // little differently than the real build does — confirmed against
    // out/vi/index.html, where the full href is `/vi/#expertise` etc. The
    // fragment is what actually has to match a real section id, and it is
    // unaffected by that difference either way.
    const ids = Array.from(container.querySelectorAll('nav ul a')).map(
      (a) => a.getAttribute('href')?.split('#')[1],
    );
    expect(ids).toEqual(EXPECTED_SECTION_IDS);
  });

  it('labels each anchor with its dictionary string, not a hardcoded one', () => {
    render(<MenuBar locale="vi" dict={viDict} />);
    for (const id of EXPECTED_SECTION_IDS) {
      expect(
        screen.getByRole('link', { name: viDict.nav[id as keyof typeof viDict.nav] }),
      ).toBeInTheDocument();
    }
  });

  it('keeps the desktop nav list available past the md breakpoint', () => {
    // `hidden` alone (no `md:flex`) would keep the primary nav invisible at
    // every width, not just below the breakpoint.
    const { container } = render(<MenuBar locale="vi" dict={viDict} />);
    expect(container.querySelector('ul')?.className).toMatch(/md:flex/);
  });
});
