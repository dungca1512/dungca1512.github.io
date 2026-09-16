import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, cleanup, screen, act, fireEvent } from '@testing-library/react';
import postcss, { type Rule } from 'postcss';
import { IntroCurtain } from '@/components/site/intro-curtain';

const curtainCss = readFileSync('src/styles/layout/intro-curtain.css', 'utf8');
const reducedCss = readFileSync('src/styles/motion-reduced.css', 'utf8');
const componentSource = readFileSync('src/components/site/intro-curtain.tsx', 'utf8');

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/** The `animation` shorthand's duration on `.intro-curtain`, in ms. Read from
 *  the stylesheet rather than restated here: the whole point of these two
 *  tests is that the number in CSS and the number in the component cannot
 *  drift apart unnoticed, which a copy in the test would reintroduce. */
function cssDurationMs(): number {
  const root = postcss.parse(curtainCss);
  let shorthand: string | undefined;
  root.walkRules('.intro-curtain', (rule: Rule) => {
    rule.walkDecls('animation', (decl) => {
      shorthand = decl.value;
    });
  });
  expect(shorthand, '.intro-curtain must declare an `animation` shorthand').toBeDefined();
  const seconds = shorthand!.match(/(?:^|\s)(\d+(?:\.\d+)?)s(?:\s|$)/);
  expect(seconds, `no duration found in \`${shorthand}\``).not.toBeNull();
  return Number(seconds![1]) * 1000;
}

function fallbackMs(): number {
  const match = componentSource.match(/const FALLBACK_UNMOUNT_MS = (\d+);/);
  expect(match, 'intro-curtain.tsx must declare FALLBACK_UNMOUNT_MS').not.toBeNull();
  return Number(match![1]);
}

describe('the intro curtain leaves the screen', () => {
  it('slides the full width of the viewport, not part of it', () => {
    // -50% would park the curtain still covering half the page, with the
    // animation `forwards` holding it there until the component unmounts —
    // a visitor would watch the site sit under a half-open shutter for two
    // seconds. The end frame has to clear the viewport entirely.
    const keyframes = curtainCss.match(
      /@keyframes site-intro-curtain-slide\s*\{([\s\S]*?)\n\}/,
    )?.[1];
    expect(keyframes, 'the slide keyframes must exist').toBeDefined();
    expect(keyframes).toMatch(/100%\s*\{\s*transform:\s*translate3d\(-100%,\s*0,\s*0\)/);
  });

  it('gives the animation more time than it needs before the fallback fires', () => {
    // The component prefers `animationend` and keeps the timer only for the
    // cases where that event never arrives. If the timer were the shorter of
    // the two it would become the schedule instead — yanking the curtain out
    // of the DOM mid-slide, which reads as the page snapping into place.
    expect(fallbackMs()).toBeGreaterThan(cssDurationMs());
  });
});

describe('the intro curtain gets out of the way', () => {
  it('is hidden from assistive tech and never intercepts a click', () => {
    const { container } = render(<IntroCurtain />);
    const curtain = container.querySelector('.intro-curtain');
    expect(curtain).not.toBeNull();
    expect(curtain).toHaveAttribute('aria-hidden', 'true');
    expect(curtain!.className).toContain('pointer-events-none');
    // Decorative art: nothing inside it is announced either.
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('unmounts when the slide reports it finished', () => {
    const { container } = render(<IntroCurtain />);
    const curtain = container.querySelector('.intro-curtain')!;
    fireEvent.animationEnd(curtain);
    expect(container.querySelector('.intro-curtain')).toBeNull();
  });

  it('unmounts on the fallback timer when no animation ever reports back', () => {
    vi.useFakeTimers();
    const { container } = render(<IntroCurtain />);
    expect(container.querySelector('.intro-curtain')).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(fallbackMs());
    });
    expect(container.querySelector('.intro-curtain')).toBeNull();
  });
});

describe('the reduced-motion visitor never sees it', () => {
  it('parks the curtain off screen inside the reduced-motion query', () => {
    const root = postcss.parse(reducedCss);
    let rule: Rule | undefined;
    root.walkAtRules('media', (atRule) => {
      // A negated query would apply the reset to everyone EXCEPT the people
      // who asked for less motion — see the same guard in motion.test.tsx.
      if (/^\s*not\b/.test(atRule.params)) return;
      if (!/prefers-reduced-motion:\s*reduce/.test(atRule.params)) return;
      atRule.walkRules((candidate) => {
        if (candidate.selectors.includes('.intro-curtain')) rule = candidate;
      });
    });
    expect(rule, '.intro-curtain needs its own reduced-motion rule').toBeDefined();

    const decl = (prop: string) => {
      let value: string | undefined;
      rule!.walkDecls(prop, (d) => {
        value = d.important ? `${d.value} !important` : d.value;
      });
      return value;
    };
    // `animation: none` alone parks a `forwards` animation on its FIRST
    // frame — the curtain would cover the page permanently for exactly the
    // people who asked for less motion. The transform is what makes this a
    // reset to the last frame instead. Both, or neither is safe.
    expect(decl('animation')).toBe('none !important');
    expect(decl('transform')).toBe('translate3d(-100%, 0, 0) !important');
  });
});
