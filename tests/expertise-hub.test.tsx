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

  it('is what Expertise wraps its four areas in', () => {
    expect(EXPERTISE_TSX).toMatch(/<Hub>\s*<ul className="[^"]*\bhub-grid\b/);
    expect(GLOBALS).toContain("@import '../styles/sections/expertise.css';");
  });
});

/* ── Stylesheet ──────────────────────────────────────────────────────────── */

const root = postcss.parse(HUB_CSS);

function supportsGuard(): AtRule {
  let found: AtRule | undefined;
  root.walkAtRules('supports', (at) => {
    if (/^\s*not\b/.test(at.params)) return;
    if (/animation-timeline:\s*view\(\)/.test(at.params)) found = at;
  });
  if (!found) throw new Error('no @supports (animation-timeline: view()) in expertise.css');
  return found;
}

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

/** True if `d` sits anywhere inside an `@supports` at-rule. */
function insideSupports(d: Declaration): boolean {
  for (let n: postcss.Container | undefined = d.parent; n; n = n.parent as postcss.Container) {
    if (n.type === 'atrule' && (n as AtRule).name === 'supports') return true;
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

  it('draws the links on the scroll timeline, only inside the guard', () => {
    const inside = decls(motionMedia(supportsGuard()), '.hub-link');
    expect(inside.some((d) => d.prop === 'animation-timeline' && d.value === '--hub')).toBe(true);
    expect(inside.some((d) => d.prop === 'animation-range')).toBe(true);
    // Nothing outside the guard animates the link.
    const outside = decls(root, '.hub-link').filter(
      (d) => d.prop.startsWith('animation') && !insideSupports(d),
    );
    expect(outside).toHaveLength(0);
    // The timeline is named on the wrapper, which is the paths' ancestor.
    expect(
      decls(motionMedia(supportsGuard()), '.hub').some(
        (d) => d.prop === 'view-timeline-name' && d.value === '--hub',
      ),
    ).toBe(true);
  });

  it('runs the pulse only while the wrapper is in view', () => {
    // Nothing outside the guard animates the pulse either — same check as
    // the link, above.
    const outside = decls(root, '.hub-pulse').filter(
      (d) => d.prop.startsWith('animation') && !insideSupports(d),
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

  it('the two keyframes touch stroke-dashoffset and nothing else', () => {
    expect([...keyframeProps('site-hub-draw')]).toEqual(['stroke-dashoffset']);
    expect([...keyframeProps('site-hub-pulse')]).toEqual(['stroke-dashoffset']);
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
    expect(link.some((d) => d.prop === 'animation' && d.value === 'none' && d.important)).toBe(
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
