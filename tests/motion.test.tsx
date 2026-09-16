import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, cleanup } from '@testing-library/react';
import { MockIntersectionObserver } from './setup';
import { RevealScope } from '@/components/motion/reveal-scope';

const motion = readFileSync('src/styles/motion.css', 'utf8');
const reduced = readFileSync('src/styles/motion-reduced.css', 'utf8');

afterEach(() => {
  cleanup();
  MockIntersectionObserver.instances.length = 0;
});

describe('reveal', () => {
  it('is scroll-driven, not observer-driven, where the browser supports it', () => {
    expect(motion).toMatch(/animation-timeline:\s*view\(\)/);
  });

  it('keeps the JS fallback behind `@supports not`, so it never double-runs', () => {
    expect(motion).toMatch(/@supports not \(animation-timeline: view\(\)\)/);
  });

  it('gates the fallback on `.js`, so a JS-less visitor is not left at opacity 0', () => {
    const block = motion.match(/@supports not[\s\S]*?\n\}/)?.[0] ?? '';
    expect(block).toMatch(/\.js \.reveal/);
  });
});

describe('the drawn underline', () => {
  it('draws itself on with a scroll-driven stroke-dashoffset animation', () => {
    // The reduced-motion reset (below) hands back `stroke-dasharray: none`
    // and `stroke-dashoffset: 0` on `.drawn-line path` — that reset only
    // means something if motion.css actually sets those dash values and
    // animates the offset in the first place.
    expect(motion).toMatch(/@keyframes site-draw-underline\s*\{[\s\S]*?stroke-dashoffset:/);
    expect(motion).toMatch(/\.drawn-line path\s*\{[\s\S]*?stroke-dasharray:\s*660/);
    const rule = motion.match(/\.drawn-line path\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(rule).toMatch(/animation:\s*site-draw-underline/);
    expect(rule).toMatch(/animation-timeline:\s*view\(\)/);
  });

  it('keeps the underline JS fallback behind its own `@supports not`, gated on `.js`', () => {
    // There are two `@supports not (animation-timeline: view())` blocks in
    // the file — reveal's and the underline's. Take the text starting at
    // the SECOND occurrence of the marker, which is the underline's own.
    const marker = '@supports not (animation-timeline: view())';
    const first = motion.indexOf(marker);
    const second = motion.indexOf(marker, first + marker.length);
    expect(
      second,
      'the underline needs its own @supports not block, not a shared one',
    ).toBeGreaterThan(-1);
    const underlineBlock = motion.slice(second);
    expect(underlineBlock).toMatch(/\.js \.drawn-line path/);
  });
});

describe('prefers-reduced-motion', () => {
  it('resets to the FINAL frame, not to no-animation', () => {
    // `animation: none` on a `both`-filled animation parks the element at its
    // FIRST frame — opacity 0 — and the content vanishes. Every reset here
    // must also restore opacity and clear the transform.
    const block = reduced.match(/@media \(prefers-reduced-motion: reduce\)[\s\S]*/)?.[0] ?? '';
    expect(block).toMatch(/opacity:\s*1\s*!important/);
    expect(block).toMatch(/transform:\s*none\s*!important/);
    expect(block).toMatch(/clip-path:\s*none\s*!important/);
  });

  it('resets the drawn underline to fully drawn rather than fully undrawn', () => {
    const block = reduced.match(/\.drawn-line path\s*\{[\s\S]*?\n\s*\}/)?.[0] ?? '';
    expect(block).toMatch(/stroke-dasharray:\s*none/);
    expect(block).toMatch(/stroke-dashoffset:\s*0/);
  });

  it('turns off the scroll-driven `site-drift` background animation too', () => {
    // `site-drift` runs on `animation-timeline: view()`, not `infinite` — it
    // is bound to scroll position, not to a wall-clock loop — but it is
    // still motion that reduced-motion visitors did not ask for, so the
    // reset above has to cover it.
    expect(reduced).toMatch(/\.blueprint::before/);
  });
});

describe('useInView, via RevealScope', () => {
  it('observes every .reveal/.reveal-clip/.drawn-line descendant through one shared observer', () => {
    render(
      <RevealScope>
        <h2 className="reveal" data-testid="heading">
          Heading
        </h2>
        <p className="reveal-clip" data-testid="paragraph">
          Body copy
        </p>
        <span data-testid="plain">Not observed</span>
      </RevealScope>,
    );

    expect(MockIntersectionObserver.instances).toHaveLength(1);
    const [observer] = MockIntersectionObserver.instances;
    expect(observer.observed.size).toBe(2);
  });

  it('marks an observed element in-view exactly once, then lets it go', () => {
    const { getByTestId } = render(
      <RevealScope>
        <h2 className="reveal" data-testid="heading">
          Heading
        </h2>
      </RevealScope>,
    );

    const [observer] = MockIntersectionObserver.instances;
    const heading = getByTestId('heading');
    expect(observer.observed.has(heading)).toBe(true);
    expect(heading.getAttribute('data-inview')).toBeNull();

    observer.trigger(heading, true);

    expect(heading.getAttribute('data-inview')).toBe('true');
    // Reveal is a one-way trip: once it has fired, the observer should stop
    // watching the element rather than replaying the reveal on a scroll-back.
    expect(observer.observed.has(heading)).toBe(false);
  });

  it('ignores an entry that has not actually intersected yet', () => {
    const { getByTestId } = render(
      <RevealScope>
        <h2 className="reveal" data-testid="heading">
          Heading
        </h2>
      </RevealScope>,
    );

    const [observer] = MockIntersectionObserver.instances;
    const heading = getByTestId('heading');

    observer.trigger(heading, false);

    expect(heading.getAttribute('data-inview')).toBeNull();
    expect(observer.observed.has(heading)).toBe(true);
  });
});
