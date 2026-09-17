import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Illustration } from '@/components/site/illustration';
import { CountUp } from '@/components/motion/count-up';
import { MockIntersectionObserver } from './setup';
import { PROJECTS, CASE_STUDY } from '@/content/projects';
import { EXPERTISE } from '@/content/expertise';
import { EXPERIENCE } from '@/content/experience';
import { CONTACTS } from '@/content/contacts';

describe('Illustration', () => {
  it('serves avif first, then webp, then the jpg', () => {
    const { container } = render(<Illustration name="hero" alt="" width={800} height={800} />);
    const types = [...container.querySelectorAll('source')].map((s) => s.type);
    expect(types).toEqual(['image/avif', 'image/webp']);
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      '/images/illustrations/hero.jpg',
    );
  });

  it('always carries width and height, so nothing jumps while it loads', () => {
    const { container } = render(<Illustration name="hero" alt="" width={800} height={640} />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('width', '800');
    expect(img).toHaveAttribute('height', '640');
  });

  it('is aria-hidden when the alt is empty, so it is not announced as an image', () => {
    const { container } = render(<Illustration name="hero" alt="" width={1} height={1} />);
    expect(container.querySelector('img')).toHaveAttribute('aria-hidden', 'true');
  });

  it('lazy-loads by default and eagerly only when asked', () => {
    const { container, rerender } = render(
      <Illustration name="hero" alt="" width={1} height={1} />,
    );
    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy');
    rerender(<Illustration name="hero" alt="" width={1} height={1} priority />);
    expect(container.querySelector('img')).toHaveAttribute('loading', 'eager');
  });

  it('puts className on the <picture>, not the <img>, so a consumer styles the element the component returns', () => {
    const { container } = render(
      <Illustration name="hero" alt="" width={1} height={1} className="hero-portrait" />,
    );
    expect(container.querySelector('picture')).toHaveClass('hero-portrait');
    expect(container.querySelector('img')).not.toHaveClass('hero-portrait');
  });
});

describe('CountUp', () => {
  // In `afterEach`, not at the end of the test body: a failing assertion throws
  // past an inline `vi.restoreAllMocks()`, leaking `matches: true` into every
  // test that runs after it. Observed — one real failure in the reduced-motion
  // test reported itself as four.
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('puts the FINAL number in the exported HTML, not zero', () => {
    // `renderToStaticMarkup` is the same path `next build` takes to produce the
    // static export, and the export is what a search engine, a visitor with JS
    // off, and a reduced-motion visitor all read. If the figure lived in React
    // state this would say 0, and 0 is the number that gets indexed.
    //
    // A client-side `render()` CANNOT make this claim. Testing Library flushes
    // effects before it returns, so by the time an assertion runs the odometer
    // has already emptied the span and rebuilt it as digit columns — the
    // assertion would be looking at the machinery, not at the exported output.
    expect(renderToStaticMarkup(<CountUp value={1400} locale="vi" suffix="+" />)).toBe(
      '<span>1.400+</span>',
    );
  });

  it('formats per locale — 1.400 and 1,400 are different numbers', () => {
    expect(renderToStaticMarkup(<CountUp value={1400} locale="vi" />)).toContain('1.400');
    expect(renderToStaticMarkup(<CountUp value={1400} locale="en" />)).toContain('1,400');
  });

  it('leaves the plain figure alone for a reduced-motion visitor', () => {
    // jsdom implements no `matchMedia` at all, so tests/setup.ts stubs one that
    // answers `false`; this overrides it to `true`. The mock answers whatever it
    // is asked, so asserting the BRANCH alone would also pass if the component
    // queried `(min-width: 99999px)` — the query itself has to be pinned.
    const mql = { matches: true } as MediaQueryList;
    const spy = vi.spyOn(window, 'matchMedia').mockReturnValue(mql);

    const { container } = render(<CountUp value={1400} locale="vi" suffix="+" />);
    expect(spy).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(container.querySelector('span')?.textContent).toBe('1.400+');
    expect(container.querySelector('span')).not.toHaveAttribute('role', 'img');
  });

  it('keeps the figure as the accessible name once the digits are built', () => {
    // The 0-9 columns are machinery. A screen reader that walked them would
    // read all ten digits of every wheel, so the host is labelled with the
    // figure and the strip is hidden.
    const { container } = render(<CountUp value={1400} locale="vi" suffix="+" />);
    const host = container.querySelector('span');
    expect(host).toHaveAttribute('role', 'img');
    expect(host).toHaveAttribute('aria-label', '1.400+');
    expect(host?.querySelector('span')).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not roll until the figure is actually on screen', () => {
    // `MockIntersectionObserver` (tests/setup.ts) records what it was asked to
    // observe and lets a test fire an entry by hand. Without driving it, no
    // transform should have been written — a roll that fires on mount happens
    // above the fold where nobody sees it.
    const { container } = render(<CountUp value={1400} locale="vi" suffix="+" />);
    const columns = () =>
      // `data-target` rather than the `will-change` the columns also carry:
      // that hint is dropped once each wheel stops, so a selector keyed on it
      // would find the columns before the roll and nothing after it.
      [...container.querySelectorAll('span[data-target]')].map(
        (c) => (c as HTMLElement).style.transform,
      );
    expect(columns().length).toBeGreaterThan(0);
    expect(columns().every((t) => t === '')).toBe(true);

    const io = MockIntersectionObserver.instances.at(-1);
    io?.trigger(container.querySelector('span')!);

    // Every wheel, and the digit each one LANDS ON. Asserting only that some
    // transform starts with `translateY(` would pass an odometer that rolls
    // every wheel to 0, or that animates one digit of four — which is the
    // feature's entire job, failing silently while the exported text stays
    // right. One cell per em, cell 0 at the top, so digit d is at -d em.
    expect(columns()).toEqual([...'1400'].map((d) => `translateY(-${d}em)`));
  });

  it('stops promoting the wheels once they have stopped turning', () => {
    // `will-change` is a standing instruction to the compositor, not a
    // decoration: a wheel left promoted keeps its own layer for the rest of
    // the page's life, for an animation that runs once. jsdom does not run
    // transitions, so the end of one is dispatched by hand.
    const { container } = render(<CountUp value={1400} locale="vi" suffix="+" />);
    const wheels = () => [...container.querySelectorAll<HTMLElement>('span[data-target]')];

    MockIntersectionObserver.instances.at(-1)?.trigger(container.querySelector('span')!);
    expect(wheels().map((w) => w.style.willChange)).toEqual(Array(4).fill('transform'));

    for (const wheel of wheels()) {
      wheel.dispatchEvent(new Event('transitionend'));
    }
    expect(wheels().map((w) => w.style.willChange)).toEqual(Array(4).fill('auto'));

    // And the transform survives the release — dropping the hint must not
    // reset the wheel to zero.
    expect(wheels().map((w) => w.style.transform)).toEqual(
      [...'1400'].map((d) => `translateY(-${d}em)`),
    );
  });
});

describe('project data', () => {
  it('gives every project a unique slug, since they key React lists', () => {
    const slugs = PROJECTS.map((p) => p.slug);
    expect(slugs).toHaveLength(9);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('only ever links out over https', () => {
    const urls = PROJECTS.flatMap((p) => p.links.map((l) => l.url));
    // Five of the nine projects have no links at all. Asserting over an empty
    // list would pass while proving nothing, so pin the count first.
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) expect(url).toMatch(/^https:\/\//);
  });

  it('gives every project at least one stack entry, or its card has a blank row', () => {
    for (const p of PROJECTS) {
      expect(p.stack.length, `${p.slug} has an empty stack`).toBeGreaterThan(0);
    }
  });
});

describe('case study data', () => {
  it('carries all five blocks in both locales', () => {
    expect(CASE_STUDY.blocks).toHaveLength(5);
    for (const block of CASE_STUDY.blocks) {
      expect(block.title.vi).toBeTruthy();
      expect(block.title.en).toBeTruthy();
      expect(block.text.vi).toBeTruthy();
      expect(block.text.en).toBeTruthy();
    }
  });
});

describe('expertise data', () => {
  it('gives every area a unique key', () => {
    const keys = EXPERTISE.map((e) => e.key);
    expect(keys).toHaveLength(4);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('experience data', () => {
  it('has exactly one current role', () => {
    expect(EXPERIENCE.filter((r) => r.current)).toHaveLength(1);
  });

  it('puts the current role first, because the timeline reads top-down', () => {
    expect(EXPERIENCE[0].current).toBe(true);
  });

  it('gives every role at least one highlight in both languages', () => {
    // The count is pinned first for the same reason the project-link test pins
    // one: a `for` over an emptied EXPERIENCE passes having asserted nothing.
    expect(EXPERIENCE).toHaveLength(3);
    for (const role of EXPERIENCE) {
      expect(role.highlights.vi.length, `${role.company} vi`).toBeGreaterThan(0);
      expect(role.highlights.en.length, `${role.company} en`).toBeGreaterThan(0);
    }
  });
});

describe('contact data', () => {
  it('gives every channel a usable target', () => {
    expect(CONTACTS).toHaveLength(5);
    for (const c of CONTACTS) {
      // The CV is a relative path served from public/; everything else is an
      // absolute link. Both are usable — a bare word is not.
      expect(c.url, `${c.key} has no usable url`).toMatch(/^(https:\/\/|mailto:|tel:|\/)/);
    }
  });

  it('includes an email channel, since that is the one the CTA points at', () => {
    expect(CONTACTS.some((c) => c.url.startsWith('mailto:'))).toBe(true);
  });

  it('marks the CV as a download, or the browser navigates away to the PDF', () => {
    const cv = CONTACTS.find((c) => c.url.endsWith('.pdf'));
    expect(cv).toBeDefined();
    expect(cv?.download).toBe(true);
  });
});
