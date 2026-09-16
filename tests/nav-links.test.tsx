import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, render, screen, cleanup } from '@testing-library/react';
import { NavLinks, type NavLink } from '@/components/layout/nav-links';

/** jsdom has no layout: every element measures 0×0 and never moves. The
 *  scrollspy is nothing BUT a layout question, so the test has to supply the
 *  geometry the browser would. Each section's top edge is set explicitly,
 *  in CSS pixels relative to the viewport, exactly as
 *  `getBoundingClientRect().top` reports it. */
const VIEWPORT_H = 1000;
const READING_LINE_PX = 300; // READING_LINE (0.3) × VIEWPORT_H

const ITEMS: NavLink[] = [
  { id: 'expertise', href: '/vi/#expertise', label: 'Năng lực' },
  { id: 'projects', href: '/vi/#projects', label: 'Dự án' },
  { id: 'contact', href: '/vi/#contact', label: 'Liên hệ' },
];

const tops = new Map<string, number>();

/** Pending animation-frame callbacks. The stub below must DEFER them, the way
 *  a browser does, and not run them inline: the hook guards against doing the
 *  work twice in one frame by holding the frame id, and an inline callback
 *  clears that guard before `requestAnimationFrame` has even returned the id
 *  to store — leaving the guard permanently set and every later scroll
 *  silently dropped. An inline stub reported exactly that as a component bug. */
let frames: FrameRequestCallback[] = [];

function flushFrames() {
  const pending = frames;
  frames = [];
  for (const cb of pending) cb(0);
}

function placeSections(ids: string[]) {
  for (const id of ids) {
    const el = document.createElement('section');
    el.id = id;
    el.getBoundingClientRect = () =>
      ({
        top: tops.get(id) ?? 0,
        bottom: 0,
        left: 0,
        right: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
      }) as DOMRect;
    document.body.append(el);
  }
}

/** Moves the page: sets each section's top edge, then fires the scroll event
 *  the hook listens for. */
function scrollSoThat(next: Record<string, number>, scrollY = 0) {
  act(() => {
    for (const [id, top] of Object.entries(next)) tops.set(id, top);
    Object.defineProperty(window, 'scrollY', { value: scrollY, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    flushFrames();
  });
}

function current(): string | null {
  const el = document.querySelector('[aria-current]');
  return el ? el.textContent : null;
}

beforeEach(() => {
  tops.clear();
  Object.defineProperty(window, 'innerHeight', { value: VIEWPORT_H, configurable: true });
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: 10_000,
    configurable: true,
  });
  // Deterministic: the hook coalesces reads into one animation frame, and the
  // test should not have to wait for a real one.
  frames = [];
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
  vi.stubGlobal('cancelAnimationFrame', () => {});
  placeSections(ITEMS.map((i) => i.id));
});

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe('NavLinks scrollspy', () => {
  it('marks nothing current above the first section', () => {
    // Every section still below the reading line — the visitor is in the hero.
    scrollSoThat({ expertise: 800, projects: 1600, contact: 2400 });
    render(<NavLinks items={ITEMS} />);
    expect(current()).toBeNull();
  });

  it('marks the section whose top edge has crossed the reading line, and only it', () => {
    render(<NavLinks items={ITEMS} />);
    scrollSoThat({ expertise: 100, projects: 900, contact: 1700 });
    expect(current()).toBe('Năng lực');
    expect(document.querySelectorAll('[aria-current]')).toHaveLength(1);
  });

  it('hands over to the next section as its top edge crosses, not before', () => {
    render(<NavLinks items={ITEMS} />);
    // One pixel below the line: not yet.
    scrollSoThat({ expertise: -400, projects: READING_LINE_PX + 1, contact: 1200 });
    expect(current()).toBe('Năng lực');
    // One pixel above it: now.
    scrollSoThat({ expertise: -700, projects: READING_LINE_PX - 1, contact: 900 });
    expect(current()).toBe('Dự án');
  });

  it('never blanks in the gap between two sections', () => {
    // The whole reason this is not an IntersectionObserver. A band narrow
    // enough to name one section finds nothing here — the page's padding sits
    // across it — and the nav would go dark mid-scroll. The last section whose
    // top has passed the line stays current instead.
    render(<NavLinks items={ITEMS} />);
    scrollSoThat({ expertise: -900, projects: 320, contact: 1100 });
    expect(current()).toBe('Năng lực');
  });

  it('marks the last section current at the foot of the page, where its top never crosses the line', () => {
    render(<NavLinks items={ITEMS} />);
    // Contact's top edge is at 60% of the viewport and will get no closer:
    // there is no scroll left. Without the bottom case it would stay dark
    // while the visitor looks straight at it.
    scrollSoThat({ expertise: -4000, projects: -2000, contact: 600 }, 9000);
    expect(current()).toBe('Liên hệ');
  });

  it('uses aria-current="location", the value for a place within the page', () => {
    render(<NavLinks items={ITEMS} />);
    scrollSoThat({ expertise: 100, projects: 900, contact: 1700 });
    expect(screen.getByRole('link', { name: 'Năng lực' })).toHaveAttribute(
      'aria-current',
      'location',
    );
    expect(screen.getByRole('link', { name: 'Dự án' })).not.toHaveAttribute('aria-current');
  });

  it('skips an id with no section on the page instead of marking it current', () => {
    document.getElementById('projects')?.remove();
    render(<NavLinks items={ITEMS} />);
    scrollSoThat({ expertise: -900, projects: -500, contact: 1100 });
    expect(current()).toBe('Năng lực');
  });

  it('listens passively and lets go on unmount', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<NavLinks items={ITEMS} />);

    const scrollCall = add.mock.calls.find(([type]) => type === 'scroll');
    // A non-passive scroll listener lets the handler block scrolling itself.
    expect(scrollCall?.[2]).toEqual({ passive: true });

    unmount();
    expect(remove.mock.calls.some(([type]) => type === 'scroll')).toBe(true);
    expect(remove.mock.calls.some(([type]) => type === 'resize')).toBe(true);
  });

  it('renders every item as a link to its own anchor', () => {
    // Fragment only, not the full href: next/link outside a mounted App
    // Router resolves the path portion differently than the real build does
    // (`/vi#expertise` here, `/vi/#expertise` in out/vi/index.html).
    // tests/menu-bar.test.tsx pins the same thing the same way.
    render(<NavLinks items={ITEMS} />);
    for (const item of ITEMS) {
      const href = screen.getByRole('link', { name: item.label }).getAttribute('href');
      expect(href?.split('#')[1]).toBe(item.id);
    }
  });
});
