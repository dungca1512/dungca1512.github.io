import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import postcss, { type AtRule, type Declaration } from 'postcss';
import { MockIntersectionObserver } from './setup';
import { Hub, HUB_LINKS } from '@/components/site/hub';

const HUB_CSS = readFileSync('src/styles/sections/expertise.css', 'utf8');
const REDUCED_CSS = readFileSync('src/styles/motion-reduced.css', 'utf8');
const GLOBALS = readFileSync('src/app/globals.css', 'utf8');
const EXPERTISE_TSX = readFileSync('src/components/sections/expertise.tsx', 'utf8');

afterEach(cleanup);

function hub() {
  return render(
    <Hub>
      <ul className="hub-grid">
        <li>
          <h3>one</h3>
        </li>
        <li>
          <h3>two</h3>
        </li>
        <li>
          <h3>three</h3>
        </li>
        <li>
          <h3>four</h3>
        </li>
      </ul>
    </Hub>,
  ).container;
}

describe('Hub markup', () => {
  it('keeps the list it is given as the first child, untouched', () => {
    const c = hub();
    const wrapper = c.firstElementChild!;
    expect(wrapper).toHaveClass('hub');
    expect(wrapper.firstElementChild?.tagName).toBe('UL');
    expect(c.querySelectorAll('ul > li')).toHaveLength(4);
    expect(c.querySelectorAll('h3')).toHaveLength(4);
  });

  it('draws four links and four pulses from the core, each normalised to length 1', () => {
    const c = hub();
    const links = [...c.querySelectorAll('path.hub-link')];
    const pulses = [...c.querySelectorAll('path.hub-pulse')];
    expect(links).toHaveLength(4);
    expect(pulses).toHaveLength(4);
    for (const p of [...links, ...pulses]) {
      expect(p.getAttribute('d')).toMatch(/^M50 50 /);
      expect(p.getAttribute('pathLength')).toBe('1');
    }
    expect(links.map((p) => p.getAttribute('d'))).toEqual([...HUB_LINKS]);
    expect(links.map((p) => (p as HTMLElement).style.getPropertyValue('--i'))).toEqual([
      '0',
      '1',
      '2',
      '3',
    ]);
  });

  it('is decoration: core and links are hidden from assistive tech and stretch with the box', () => {
    const c = hub();
    expect(c.querySelector('.hub-core')).toHaveAttribute('aria-hidden', 'true');
    const svg = c.querySelector('svg.hub-links')!;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).toHaveAttribute('preserveAspectRatio', 'none');
    expect(svg).toHaveAttribute('viewBox', '0 0 100 100');
    // The core carries the lifted glyph.
    expect(c.querySelectorAll('.hub-core circle')).toHaveLength(9);
  });

  it('marks itself in view exactly while the observer says so', () => {
    const c = hub();
    const wrapper = c.querySelector('.hub') as HTMLElement;
    const io = MockIntersectionObserver.instances.find((i) => i.observed.has(wrapper));
    expect(io).toBeDefined();
    expect(wrapper.dataset.inview).toBeUndefined();
    io!.trigger(wrapper, true);
    expect(wrapper.dataset.inview).toBe('true');
    io!.trigger(wrapper, false);
    expect(wrapper.dataset.inview).toBe('false');
  });

  it('marks itself drawn on the first intersection and never un-draws', () => {
    /* The draw is a one-way trip, like every reveal on the page: the links
       transition to fully drawn once and stay. `data-inview` (above) keeps
       toggling for the pulse, which IS meant to stop off screen. */
    const c = hub();
    const wrapper = c.querySelector('.hub') as HTMLElement;
    const io = MockIntersectionObserver.instances.find((i) => i.observed.has(wrapper));
    expect(wrapper.dataset.drawn).toBeUndefined();
    io!.trigger(wrapper, false);
    expect(wrapper.dataset.drawn).toBeUndefined();
    io!.trigger(wrapper, true);
    expect(wrapper.dataset.drawn).toBe('true');
    io!.trigger(wrapper, false);
    expect(wrapper.dataset.drawn).toBe('true');
    expect(wrapper.dataset.inview).toBe('false');
  });

  it("watches from the same line the reveals fire on, so the links draw with the cards' arrival", () => {
    // wigin's `rootMargin: -8%` on the bottom edge, as in use-in-view.ts.
    // threshold stays 0: the grid is tall, and 6% of it is not a reason
    // to keep a pulse paused on a section the reader can already see.
    const c = hub();
    const wrapper = c.querySelector('.hub') as HTMLElement;
    const io = MockIntersectionObserver.instances.find((i) => i.observed.has(wrapper));
    expect(io!.rootMargin).toBe('0px 0px -8% 0px');
    expect([...io!.thresholds]).toEqual([0]);
  });

  it('is what Expertise wraps its four areas in', () => {
    expect(EXPERTISE_TSX).toMatch(/<Hub>\s*<ul className="[^"]*\bhub-grid\b/);
    expect(GLOBALS).toContain("@import '../styles/sections/expertise.css';");
  });
});

describe('the toolbox grid', () => {
  it('clamps the marquee item so its w-max track cannot size the column', () => {
    // Measured in WebKit at 390px and 768px before this: the single auto
    // column took the marquee track's min-content, 8857px, and the
    // illustration beside it filled that. <body>'s old `overflow-x: clip`
    // only hid the scrollbar — the picture still rendered 9389px wide.
    // The wide layout already says `minmax(0,1fr)`; the narrow one needs
    // the same clamp on the item, and the ONLY item that can blow up is the
    // marquee's, so the class lives there, not on the picture's.
    expect(EXPERTISE_TSX).toMatch(/<ScrollMarquee[\s\S]*?\/>/);
    const marqueeItem = EXPERTISE_TSX.match(
      /<div className="([^"]*)">\s*<h3 className="reveal[^"]*">\s*\{dict\.sections\.expertise\.toolbox\}/,
    );
    expect(
      marqueeItem,
      'the marquee lives in a <div> whose first child is the toolbox <h3>',
    ).not.toBeNull();
    expect(marqueeItem![1].split(/\s+/)).toContain('min-w-0');
  });
});

/* ── Stylesheet ──────────────────────────────────────────────────────────── */

const root = postcss.parse(HUB_CSS);

function motionMedia(parent: AtRule | postcss.Root): AtRule {
  let found: AtRule | undefined;
  parent.walkAtRules('media', (at) => {
    if (/min-width:\s*48rem/.test(at.params) && /no-preference/.test(at.params)) found = at;
  });
  if (!found) throw new Error('no (min-width: 48rem) and (prefers-reduced-motion: no-preference)');
  return found;
}

function decls(container: postcss.Container, selector: string): Declaration[] {
  const out: Declaration[] = [];
  container.walkRules((r) => {
    if (!r.selectors.includes(selector)) return;
    r.walkDecls((d) => {
      out.push(d);
    });
  });
  return out;
}

function keyframeProps(name: string): Set<string> {
  const props = new Set<string>();
  root.walkAtRules('keyframes', (at) => {
    if (at.params !== name) return;
    at.walkDecls((d) => {
      props.add(d.prop);
    });
  });
  if (props.size === 0) throw new Error(`no @keyframes ${name}`);
  return props;
}

/** True if `d` sits inside the (min-width: 48rem) and (no-preference) media
 *  block — the only place in this file allowed to put anything in motion. */
function insideMotionMedia(d: Declaration): boolean {
  const media = motionMedia(root);
  for (let n: postcss.Container | undefined = d.parent; n; n = n.parent as postcss.Container) {
    if (n === media) return true;
  }
  return false;
}

/** Declarations of one rule whose selector list includes `selector`, in
 *  source order — unlike `decls`, which may merge several rules, this keeps
 *  each rule's own declaration order so a test can check that one longhand
 *  comes after another (e.g. a play-state set after the shorthand that
 *  would otherwise reset it). Only rules with an EXACT single-selector match
 *  are considered, so `.hub-link, .hub-pulse { … }` (a rule with no relevant
 *  declarations) does not get conflated with `.hub-pulse { … }` alone. */
function ownDecls(selector: string): Declaration[][] {
  const rules: Declaration[][] = [];
  root.walkRules((r) => {
    if (r.selectors.length !== 1 || r.selectors[0] !== selector) return;
    const out: Declaration[] = [];
    r.walkDecls((d) => {
      out.push(d);
    });
    rules.push(out);
  });
  return rules;
}

describe('Hub stylesheet', () => {
  it('has no vh anywhere', () => {
    expect(HUB_CSS).not.toMatch(/\dvh\b/); // `74dvh` has a `d` before `vh`, so it passes; `74vh` does not
  });

  it('hides the hub by default and shows it only from 48rem', () => {
    const top = decls(root, '.hub-core').filter((d) => d.parent?.parent === root);
    expect(top.some((d) => d.prop === 'display' && d.value === 'none')).toBe(true);
    let shown = false;
    root.walkAtRules('media', (at) => {
      if (!/min-width:\s*48rem/.test(at.params)) return;
      if (decls(at, '.hub-core').some((d) => d.prop === 'display' && d.value !== 'none'))
        shown = true;
    });
    expect(shown).toBe(true);
  });

  it('draws the links with a transition released by data-drawn, under `.js`, only in the motion media block', () => {
    /* wigin's draw is a 1.1s `power2.out` tween staggered 0.12s per link,
       fired by ScrollTrigger on entry. Until 2026-09-26 this was expressed in
       scroll (`animation-timeline: --hub`); now it is what wigin does, minus
       GSAP: a transition on `stroke-dashoffset` that the wrapper's observer
       releases once (see hub.tsx). Same clock and ease as the reveals. */
    const media = motionMedia(root);
    const parked = decls(media, '.js .hub-link');
    expect(parked.some((d) => d.prop === 'stroke-dashoffset' && d.value === '1')).toBe(true);
    const transition = parked.find((d) => d.prop === 'transition');
    expect(transition?.value).toMatch(
      /^stroke-dashoffset var\(--duration-hero\) var\(--ease-out-quint\)/,
    );
    expect(transition?.value).toMatch(/calc\(var\(--i\) \* 0\.12s\)$/);
    const drawn = decls(media, ".js .hub[data-drawn='true'] .hub-link");
    expect(drawn.some((d) => d.prop === 'stroke-dashoffset' && d.value === '0')).toBe(true);
    // Nothing outside that block moves the link, and the ungated default is
    // the finished picture: no JS, no media match, no reduced-motion opt-out
    // ever sees an undrawn link.
    const outside = decls(root, '.hub-link').filter(
      (d) => /^(animation|transition)/.test(d.prop) && !insideMotionMedia(d),
    );
    expect(outside).toHaveLength(0);
    expect(
      decls(root, '.hub-link').some(
        (d) => d.prop === 'stroke-dashoffset' && d.value === '0' && !insideMotionMedia(d),
      ),
    ).toBe(true);
  });

  it('has no scroll timeline and no feature fork left', () => {
    // A transition and a timed keyframe run on every browser this site
    // supports, so there is nothing to fork on any more.
    expect(HUB_CSS).not.toMatch(/animation-timeline|view-timeline|animation-range/);
    expect(HUB_CSS).not.toMatch(/@supports/);
  });

  it('runs the pulse only while the wrapper is in view', () => {
    // Nothing outside the guard animates the pulse either — same check as
    // the link, above.
    const outside = decls(root, '.hub-pulse').filter(
      (d) => d.prop.startsWith('animation') && !insideMotionMedia(d),
    );
    expect(outside).toHaveLength(0);

    // The `animation` shorthand resets every longhand it does not mention —
    // including `animation-play-state` — back to its initial value,
    // `running`. So a `paused` declaration only holds if it comes AFTER the
    // shorthand in the same rule; asserting mere presence anywhere in the
    // stylesheet (as this test used to) passes even when the shorthand
    // clobbers it. Find the rule that sets `animation` on `.hub-pulse` and
    // check the order directly.
    const pulseRules = ownDecls('.hub-pulse');
    const shorthandRule = pulseRules.find((rule) => rule.some((d) => d.prop === 'animation'));
    expect(shorthandRule).toBeDefined();
    const animIndex = shorthandRule!.findIndex((d) => d.prop === 'animation');
    const pausedIndex = shorthandRule!.findIndex(
      (d) => d.prop === 'animation-play-state' && d.value === 'paused',
    );
    expect(pausedIndex).toBeGreaterThan(animIndex);

    const running = decls(root, ".hub[data-inview='true'] .hub-pulse");
    expect(running.some((d) => d.prop === 'animation-play-state' && d.value === 'running')).toBe(
      true,
    );
    expect(running.some((d) => d.prop === 'opacity' && d.value === '1')).toBe(true);
  });

  it('the pulse keyframes touch stroke-dashoffset and nothing else, and the draw has none', () => {
    expect([...keyframeProps('site-hub-pulse')]).toEqual(['stroke-dashoffset']);
    expect(() => keyframeProps('site-hub-draw')).toThrow();
  });

  it('lands on the last frame under reduced motion', () => {
    const reduced = postcss.parse(REDUCED_CSS);
    const inReduced = (selector: string) => {
      const out: Declaration[] = [];
      reduced.walkAtRules('media', (at) => {
        if (/^\s*not\b/.test(at.params) || !/prefers-reduced-motion:\s*reduce/.test(at.params))
          return;
        out.push(...decls(at, selector));
      });
      return out;
    };
    const link = inReduced('.hub-link');
    expect(link.some((d) => d.prop === 'transition' && d.value === 'none' && d.important)).toBe(
      true,
    );
    expect(link.some((d) => d.prop === 'stroke-dashoffset' && d.value === '0' && d.important)).toBe(
      true,
    );
    const pulse = inReduced('.hub-pulse');
    expect(pulse.some((d) => d.prop === 'animation' && d.value === 'none' && d.important)).toBe(
      true,
    );
    expect(pulse.some((d) => d.prop === 'opacity' && d.value === '0' && d.important)).toBe(true);
  });
});
