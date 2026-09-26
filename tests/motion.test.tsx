import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { render, cleanup } from '@testing-library/react';
import postcss, { type Rule } from 'postcss';
import tailwindcssPostcss from '@tailwindcss/postcss';
import { MockIntersectionObserver } from './setup';
import { RevealScope } from '@/components/motion/reveal-scope';
import { DrawnUnderline } from '@/components/motion/drawn-underline';

const motion = readFileSync('src/styles/motion.css', 'utf8');
const reduced = readFileSync('src/styles/motion-reduced.css', 'utf8');
const GLOBALS_CSS = resolve('src/app/globals.css');

afterEach(() => {
  cleanup();
  // MockIntersectionObserver.instances itself is reset globally in
  // tests/setup.ts's own afterEach (Task 7 renders many sections across
  // many files and needs that reset everywhere, not just here).
});

const REDUCED_MOTION_MEDIA = /prefers-reduced-motion:\s*reduce/;

/**
 * Finds the (comma-separated) rule whose selector LIST includes `selector`
 * exactly — but only among rules that live inside a
 * `@media (prefers-reduced-motion: reduce)` at-rule, not merely anywhere in
 * the file. An earlier version of this helper used `root.walkRules()`
 * unscoped: it found a rule regardless of what at-rule (if any) enclosed
 * it, so renaming the wrapper to e.g. `@media (min-width: 1px)` — applying
 * the whole reset to everyone, and to no one who actually asked for less
 * motion — left every caller of this helper green. Scoping the walk to
 * `@media` at-rules whose params match the reduced-motion query closes
 * that hole: a rule under an unrelated (or absent) at-rule is invisible to
 * it, on purpose.
 */
function ruleFor(css: string, selector: string): Rule | undefined {
  const root = postcss.parse(css);
  let found: Rule | undefined;
  root.walkAtRules('media', (atRule) => {
    // `not all and (prefers-reduced-motion: reduce)` CONTAINS the query while
    // meaning its exact opposite — the reset would apply to everyone except
    // the people who asked for less motion. A substring test alone cannot
    // tell the two apart, so a negated query is rejected outright.
    if (/^\s*not\b/.test(atRule.params)) return;
    if (!REDUCED_MOTION_MEDIA.test(atRule.params)) return;
    atRule.walkRules((rule) => {
      if (rule.selectors.includes(selector)) found = rule;
    });
  });
  return found;
}

/** The value (with ` !important` appended when set) of `prop` as declared
 *  directly on `rule` — undefined if `rule` doesn't declare it at all. */
function declValue(rule: Rule | undefined, prop: string): string | undefined {
  let value: string | undefined;
  rule?.walkDecls(prop, (decl) => {
    value = decl.important ? `${decl.value} !important` : decl.value;
  });
  return value;
}

/**
 * Compiles src/app/globals.css through the real Tailwind v4 PostCSS
 * pipeline — the same one `next build` runs — with only the candidate
 * classes it is given (none by default). This exists to prove motion.css and
 * motion-reduced.css actually reach the built stylesheet through
 * globals.css's `@import`, rather than just existing as source files nobody
 * wires up: reading `src/styles/motion.css` directly would stay green even
 * if globals.css stopped importing it entirely. With candidates, it is also
 * the only way to see what an `@utility` block turns into — the reveal
 * utilities nest `.js &`, and what matters is the selector that comes OUT.
 * Mirrors the pattern in tests/tokens.test.ts.
 */
async function compileGlobals(classNames: string[] = []): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), 'motion-build-test-'));
  try {
    writeFileSync(join(dir, 'probe.html'), `<div class="${classNames.join(' ')}"></div>`);
    const entry = join(dir, 'probe.css');
    writeFileSync(entry, `@import "${GLOBALS_CSS}";`);
    const result = await postcss([tailwindcssPostcss({ base: dir })]).process(
      readFileSync(entry, 'utf8'),
      { from: entry },
    );
    return result.css;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Point as a plain [x, y] tuple — enough for the arc-length work below. */
type Point = [number, number];

function distance(a: Point, b: Point): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

function cubicBezierLength(p0: Point, p1: Point, p2: Point, p3: Point, steps: number): number {
  let length = 0;
  let prev = p0;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const x = mt ** 3 * p0[0] + 3 * mt ** 2 * t * p1[0] + 3 * mt * t ** 2 * p2[0] + t ** 3 * p3[0];
    const y = mt ** 3 * p0[1] + 3 * mt ** 2 * t * p1[1] + 3 * mt * t ** 2 * p2[1] + t ** 3 * p3[1];
    const point: Point = [x, y];
    length += distance(prev, point);
    prev = point;
  }
  return length;
}

/** The only path commands this approximator understands. */
const SUPPORTED_PATH_COMMANDS = 'MmLlCcZz';
/** Every letter SVG's path grammar recognises as a command at all — used
 *  only to detect ones we DON'T support; note `e`/`E` (scientific-notation
 *  numbers, e.g. `1e-5`) is deliberately excluded, since it is not a path
 *  command and must not trip the guard below. */
const ALL_PATH_COMMANDS = /[MmLlHhVvCcSsQqTtAaZz]/g;

/* One SVG number. The exponent must accept `E` as well as `e`, and an
   explicit `+`, because the guard above deliberately lets BOTH letters
   through (they are numbers, not commands) — so anything the guard waves
   past has to be something this can actually read. An earlier version
   matched only `e` with no `+`, which meant `1E-2` parsed as the two
   numbers 1 and -2 and `1e+1` as 1 and 1: the coordinate list silently
   mis-paired and the measured length came back confidently wrong. That is
   the same silent-wrong-answer the command guard exists to prevent, just
   moved from command letters into number syntax, and both spellings are
   emitted by real SVG tooling. */
const NUMBER = /-?\d*\.?\d+(?:[eE][-+]?\d+)?/g;

/**
 * A small, deliberately partial SVG path-length approximator: it handles
 * exactly the commands a hand-drawn decorative underline is plausibly built
 * from (M/m, L/l, C/c, Z/z), flattening curves into a dense polyline and
 * summing segment lengths. jsdom has no `getTotalLength()` to check
 * against (verified: `window.SVGPathElement.prototype.getTotalLength` does
 * not exist under jsdom), so this measures the path directly from whatever
 * `d` the component actually ships, rather than asserting against a
 * hard-coded constant that would go stale silently the moment the artwork
 * changes. At 1000 subdivisions per curve it agrees with Chromium's real
 * `getTotalLength()` (633.5823) to within 0.0001 on the current path.
 *
 * The command splitter below (`[MmLlCcZz][^MmLlCcZz]*`) treats any OTHER
 * command letter (H/V/S/Q/T/A) as plain trailing text on the command
 * before it, rather than as a delimiter — so its coordinates silently
 * vanish into the previous command's number list instead of raising an
 * error. Rather than let that produce a confident, wrong answer, this
 * throws up front whenever `d` contains a command outside the supported
 * set, so a future artwork edit that adds one of them fails loudly instead
 * of quietly reporting a stale length.
 */
function svgPathLength(d: string, curveSteps = 1000): number {
  const unsupported = [
    ...new Set(
      (d.match(ALL_PATH_COMMANDS) ?? []).filter((c) => !SUPPORTED_PATH_COMMANDS.includes(c)),
    ),
  ];
  if (unsupported.length > 0) {
    throw new Error(
      `svgPathLength only understands ${SUPPORTED_PATH_COMMANDS} commands; "${d}" uses unsupported command(s): ${unsupported.join(', ')}`,
    );
  }

  const commands = d.match(/[MmLlCcZz][^MmLlCcZz]*/g) ?? [];
  let current: Point = [0, 0];
  let start: Point = [0, 0];
  let total = 0;

  for (const command of commands) {
    const type = command[0];
    const nums = (command.slice(1).match(NUMBER) ?? []).map(Number);

    if (type === 'M' || type === 'm') {
      const point: Point =
        type === 'M' ? [nums[0], nums[1]] : [current[0] + nums[0], current[1] + nums[1]];
      current = point;
      start = point;
      // Extra coordinate pairs after the first one in a moveto are implicit linetos.
      for (let i = 2; i + 1 < nums.length; i += 2) {
        const next: Point =
          type === 'M' ? [nums[i], nums[i + 1]] : [current[0] + nums[i], current[1] + nums[i + 1]];
        total += distance(current, next);
        current = next;
      }
    } else if (type === 'L' || type === 'l') {
      for (let i = 0; i + 1 < nums.length; i += 2) {
        const next: Point =
          type === 'L' ? [nums[i], nums[i + 1]] : [current[0] + nums[i], current[1] + nums[i + 1]];
        total += distance(current, next);
        current = next;
      }
    } else if (type === 'C' || type === 'c') {
      for (let i = 0; i + 5 < nums.length; i += 6) {
        const p1: Point =
          type === 'C' ? [nums[i], nums[i + 1]] : [current[0] + nums[i], current[1] + nums[i + 1]];
        const p2: Point =
          type === 'C'
            ? [nums[i + 2], nums[i + 3]]
            : [current[0] + nums[i + 2], current[1] + nums[i + 3]];
        const p3: Point =
          type === 'C'
            ? [nums[i + 4], nums[i + 5]]
            : [current[0] + nums[i + 4], current[1] + nums[i + 5]];
        total += cubicBezierLength(current, p1, p2, p3, curveSteps);
        current = p3;
      }
    } else if (type === 'Z' || type === 'z') {
      total += distance(current, start);
      current = start;
    }
  }

  return total;
}

/** The declared value of `prop` inside `@<atName> <params>` in motion.css —
 *  e.g. utility('reveal', 'animation'). Undefined when the block does not
 *  declare it. */
function atRuleDecl(atName: string, params: string, prop: string): string | undefined {
  const root = postcss.parse(motion);
  let value: string | undefined;
  root.walkAtRules(atName, (atRule) => {
    if (atRule.params.trim() !== params) return;
    atRule.walkDecls(prop, (decl) => {
      value = decl.value;
    });
  });
  return value;
}

/** Every property a @keyframes block animates, across all of its steps. */
function keyframeProps(name: string): string[] {
  const root = postcss.parse(motion);
  const props = new Set<string>();
  root.walkAtRules('keyframes', (atRule) => {
    if (atRule.params.trim() !== name) return;
    atRule.walkDecls((decl) => {
      props.add(decl.prop);
    });
  });
  return [...props];
}

/** The declarations of the rule(s) in `css` whose full selector is exactly
 *  `selector`, as a prop → value map. Later declarations win, as they do in
 *  the cascade. Undefined when no rule carries that selector. Works on the
 *  compiled sheet and on a source file alike, for top-level rules. */
function compiledRule(css: string, selector: string): Record<string, string> | undefined {
  let found: Record<string, string> | undefined;
  postcss.parse(css).walkRules((rule) => {
    if (rule.selector !== selector) return;
    found ??= {};
    rule.walkDecls((decl) => {
      found![decl.prop] = decl.value;
    });
  });
  return found;
}

/** Where a token is USED in motion.css — every declaration whose value
 *  mentions it, named by the at-rule or selector that owns it. Comments do
 *  not count, which a plain text search cannot promise. */
function usesOf(token: string): string[] {
  const owners: string[] = [];
  postcss.parse(motion).walkDecls((decl) => {
    if (!decl.value.includes(token)) return;
    let owner = '';
    for (let n = decl.parent; n; n = n.parent as typeof decl.parent) {
      if (n.type === 'atrule' && (n as postcss.AtRule).name === 'utility') {
        owner = `@utility ${(n as postcss.AtRule).params}`;
        break;
      }
      if (n.type === 'rule') owner ||= (n as Rule).selector;
    }
    owners.push(owner);
  });
  return owners;
}

/* Reveals fire on ENTRY and play on a clock — wigin.ai's model, adopted on
   2026-09-26 in place of the scroll-scrubbed `animation-timeline: view()`
   version that had been the primary path since 2026-09-15. Measured on
   wigin: a reveal begins when the element's top edge crosses roughly 90% of
   the viewport height and is over 0.7s later, whatever the reader does with
   the wheel meanwhile. The scrubbed version moved WITH the wheel — it could
   be parked half-done, and replayed backwards on every scroll-up. The
   observer path that used to be the `@supports not` fallback is now the only
   path, so these tests read the built stylesheet for the `.js` rules that
   carry it. */
describe('reveal', () => {
  let css = '';
  beforeAll(async () => {
    css = await compileGlobals([
      'reveal',
      'reveal-clip',
      'reveal-load',
      'reveal-clip-load',
      'stagger',
    ]);
  });

  it('is observer-driven: no scroll timeline, no animation shorthand and no feature fork on the reveals', () => {
    for (const name of ['reveal', 'reveal-clip']) {
      expect(
        atRuleDecl('utility', name, 'animation-timeline'),
        `${name} still scrubs on scroll`,
      ).toBeUndefined();
      // The clip wipe does run keyframes (see below) — through longhands.
      // The shorthand would reset `animation-delay` over `.stagger > *`.
      expect(
        atRuleDecl('utility', name, 'animation'),
        `${name} uses the animation shorthand`,
      ).toBeUndefined();
    }
    // With one path there is nothing to fork on. A `@supports not` block here
    // would be a second copy of the reveal, waiting to drift from the first.
    expect(motion).not.toMatch(/@supports/);
  });

  it.each(['reveal', 'reveal-clip'])(
    'hides %s only under `.js`, and shows it on data-inview',
    (name) => {
      const hidden = compiledRule(css, `.js .${name}`);
      expect(hidden, `no .js .${name} rule in the built stylesheet`).toBeDefined();
      expect(hidden?.opacity).toBe('0');
      const shown = compiledRule(css, `.js .${name}[data-inview='true']`);
      expect(
        shown,
        `no .js .${name}[data-inview='true'] rule in the built stylesheet`,
      ).toBeDefined();
      expect(shown?.opacity).toBe('1');
      expect(shown?.transform).toBe('none');
      // A JS-less visitor never gets data-inview, so nothing may hide the
      // element without the `.js` gate in front of it.
      expect(
        compiledRule(css, `.${name}`)?.opacity,
        `.${name} hides itself without JS`,
      ).toBeUndefined();
    },
  );

  it.each(['reveal', 'reveal-clip'])('%s rises along the scroll axis, never across it', (name) => {
    const hidden = compiledRule(css, `.js .${name}`) ?? {};
    expect(hidden.transform).toMatch(/^translateY\(/);
    expect(hidden.transform).not.toMatch(/translateX/);
  });

  it("transitions the plain reveal on the hero clock and the quint ease — wigin's numbers", () => {
    const hidden = compiledRule(css, '.js .reveal') ?? {};
    expect(hidden['transition-duration']).toBe('var(--duration-hero)');
    expect(hidden['transition-timing-function']).toBe('var(--ease-out-quint)');
    expect(hidden['transition-property']).toMatch(/\bopacity\b/);
    expect(hidden['transition-property']).toMatch(/\btransform\b/);
  });

  it('plays the clip wipe as keyframes on data-inview, on the same clock and ease, through longhands', () => {
    /* Not a transition, and the hidden state carries NO clip-path. Measured
       in Chrome 154: IntersectionObserver clips the target by its own
       `clip-path`, so a heading masked to `inset(… 100% …)` has an
       intersection width of 0 and never fires — every section heading on
       the page stayed hidden. WebKit ignores clip-path there, which is why
       it passed. So the mask exists only inside the keyframes, which start
       the moment the attribute lands. Longhands, so `.stagger > *` keeps
       its `animation-delay`; `both`, so the last frame stays. */
    const hidden = compiledRule(css, '.js .reveal-clip') ?? {};
    expect(hidden['clip-path']).toBeUndefined();
    expect(hidden['transition-property']).toBeUndefined();
    expect(hidden['transition-duration']).toBeUndefined();
    const shown = compiledRule(css, ".js .reveal-clip[data-inview='true']") ?? {};
    expect(shown['animation-name']).toBe('site-reveal-fade, site-reveal-clip');
    expect(shown['animation-duration']).toBe('var(--duration-hero), var(--duration-hero)');
    expect(shown['animation-timing-function']).toBe('var(--ease-out-quint), var(--ease-out-quint)');
    expect(shown['animation-fill-mode']).toBe('both, both');
    expect(shown.animation).toBeUndefined();
    expect(shown['animation-delay']).toBeUndefined();
    expect(shown['clip-path']).toBeUndefined();
    const stagger = compiledRule(css, '.stagger > *') ?? {};
    expect(stagger['animation-delay']).toMatch(/var\(--stagger-step, 80ms\)/);
  });

  it('moves the plain reveal by 26px, the distance measured on wigin', () => {
    expect(compiledRule(css, '.js .reveal')?.transform).toBe('translateY(26px)');
  });

  it.each(['reveal', 'reveal-clip'])(
    '%s leaves transition-delay to the stagger utility and to inline styles',
    (name) => {
      /* `.js .reveal` is (0,2,0); `.stagger > *` is (0,1,0). A `transition`
         SHORTHAND on the first would reset `transition-delay` to 0s at the
         higher weight and silently switch every staggered list back to
         arriving all at once. Longhands only, and never the delay. */
      const hidden = compiledRule(css, `.js .${name}`) ?? {};
      expect(hidden.transition, `${name} uses the transition shorthand`).toBeUndefined();
      expect(hidden['transition-delay']).toBeUndefined();
      const stagger = compiledRule(css, '.stagger > *') ?? {};
      // 80ms per item is wigin's list stagger; it was 60ms on the scroll timeline.
      expect(stagger['transition-delay']).toMatch(/var\(--stagger-step, 80ms\)/);
    },
  );

  it('wipes the headline across the reading direction: the keyframes mask the whole line, then bleed past the box', () => {
    /* The `from` right inset is 100% — the whole line masked — and the `to`
       bleeds past the box on every side, because Vietnamese diacritics
       reach above and below it and `both` keeps that frame for good. The
       both-ends-are-shapes rule is checked further down. */
    const frames: Record<string, string> = {};
    postcss.parse(motion).walkAtRules('keyframes', (at) => {
      if (at.params !== 'site-reveal-clip') return;
      at.walkRules((rule) => {
        rule.walkDecls('clip-path', (decl) => {
          frames[rule.selector] = decl.value;
        });
      });
    });
    expect(frames.from).toMatch(/^inset\(-[\d.]+em 100% /);
    expect(frames.to).toMatch(/^inset\(-[\d.]+em -[\d.]+em -[\d.]+em -[\d.]+em\)$/);
  });

  it('plays the hero variants once, on the same clock and ease as the scroll reveal', () => {
    for (const name of ['reveal-load', 'reveal-clip-load']) {
      const animation = atRuleDecl('utility', name, 'animation') ?? '';
      const tracks = animation.split(',').map((t) => t.trim());
      expect(tracks, `${name} should run a fade track and a movement track`).toHaveLength(2);
      for (const track of tracks) {
        expect(track).toContain('var(--duration-hero)');
        expect(track).toContain('var(--ease-out-quint)');
        expect(track).toMatch(/\bboth\b/);
      }
      expect(atRuleDecl('utility', name, 'animation-timeline')).toBeUndefined();
    }
  });

  it('has no spring left on any reveal: wigin settles without overshoot, and matching that is the point', () => {
    // `--ease-spring` peaks near 1.1 before returning to 1. The chip lift is
    // the one place it still belongs.
    expect(usesOf('--ease-spring')).toEqual(['@utility pop-on-hover']);
  });

  it('keeps opacity out of the movement keyframes, so the fade and the rise stay separate tracks', () => {
    expect(keyframeProps('site-reveal-in')).not.toContain('opacity');
    expect(keyframeProps('site-reveal-clip')).not.toContain('opacity');
    expect(keyframeProps('site-reveal-fade')).toEqual(['opacity']);
  });

  it('rises along the scroll axis in the hero keyframes too, by the same 26px', () => {
    for (const name of ['site-reveal-in', 'site-reveal-clip']) {
      const block =
        motion.match(new RegExp(`@keyframes ${name}\\s*\\{[\\s\\S]*?\\n\\}`))?.[0] ?? '';
      expect(block, `${name} has no @keyframes block`).not.toBe('');
      expect(block, `${name} still moves on X`).not.toMatch(/translateX\(/);
      expect(block, `${name} does not move on Y`).toMatch(/translateY\(/);
    }
    expect(motion).toMatch(/@keyframes site-reveal-in\s*\{[\s\S]*?translateY\(26px\)/);
  });

  /* The one failure this animation has actually had, written down so it cannot
     happen twice. A `@keyframes` block that declares only `from` gets an
     implicit `to` of the element's own computed value — here `clip-path: none`.
     `none` is not a basic shape, so there is nothing to interpolate towards and
     CSS falls back to DISCRETE interpolation: the mask does not sweep across
     the heading, it flips to fully-revealed in a single frame at the halfway
     point of the eased curve. Nothing catches that. The stylesheet parses, the
     animation "runs", the element ends up in the right place, and the fade
     underneath hides the snap — the wipe simply never happened, for as long as
     the block was written that way. Both ends have to name a shape. */
  it('names a shape at both ends of the hero wipe, or it snaps instead of sweeping', () => {
    const frames: Record<string, string[]> = {};
    postcss.parse(motion).walkAtRules('keyframes', (at) => {
      if (at.params !== 'site-reveal-clip') return;
      at.walkRules((rule) => {
        rule.walkDecls('clip-path', (decl) => {
          frames[rule.selector] = [...(frames[rule.selector] ?? []), decl.value];
        });
      });
    });

    for (const stop of ['from', 'to']) {
      const values = frames[stop] ?? [];
      expect(
        values,
        `site-reveal-clip has no \`${stop}\` clip-path — CSS fills that end in with \`none\`, which interpolates discretely: the wipe becomes a one-frame flip`,
      ).not.toEqual([]);
      for (const value of values) {
        expect(value, `site-reveal-clip's \`${stop}\` clip-path is not a shape`).toMatch(
          /^inset\(/,
        );
      }
    }
  });

  it('no longer clips the document sideways', () => {
    /* `overflow-x: clip` on <body> arrived with the sideways reveal (d402481)
       because every first frame sat 2rem past the right edge. A rise has no
       such frame, and the declaration went with it: a horizontal overflow
       is now a real bug to find, not one silently cut off. */
    let overflow: string | undefined;
    postcss.parse(css).walkRules((rule) => {
      if (!rule.selectors.includes('body')) return;
      rule.walkDecls('overflow-x', (decl) => {
        overflow = decl.value;
      });
    });
    expect(overflow).toBeUndefined();
  });
});

describe('the drawn underline', () => {
  it('parks the stroke undrawn under `.js` and draws it on data-inview, on the hero clock', () => {
    // The reduced-motion reset (below) hands back `stroke-dasharray: none`
    // and `stroke-dashoffset: 0` on `.drawn-line path` — that reset only
    // means something if motion.css sets the dash and parks the offset.
    const parked = compiledRule(motion, '.js .drawn-line path') ?? {};
    const dasharray = compiledRule(motion, '.drawn-line path')?.['stroke-dasharray'];
    expect(dasharray).toMatch(/^\d/);
    // Offset = dash length: the single dash sits entirely behind the path's
    // origin, 0% visible. Anything less leaves a stub drawn from the start.
    expect(parked['stroke-dashoffset']).toBe(dasharray);
    expect(parked.transition).toMatch(
      /^stroke-dashoffset var\(--duration-hero\) var\(--ease-out-quint\)$/,
    );
    expect(
      compiledRule(motion, ".js .drawn-line[data-inview='true'] path")?.['stroke-dashoffset'],
    ).toBe('0');
  });

  it('is drawn for a JS-less visitor: the ungated rule sets the dash and never the offset', () => {
    const ungated = compiledRule(motion, '.drawn-line path') ?? {};
    expect(ungated['stroke-dashoffset']).toBeUndefined();
    expect(ungated.animation).toBeUndefined();
  });

  it('sets a stroke-dasharray that comfortably exceeds the measured length of the path the component actually ships', () => {
    // Tied to the real component and a length computed in this test, not to
    // a restated constant: swapping out drawn-underline.tsx's `d` (e.g. for
    // an unrelated 1996-unit line) must make this fail, not stay green.
    const { container } = render(<DrawnUnderline />);
    const d = container.querySelector('path')?.getAttribute('d');
    expect(d, 'DrawnUnderline must render a <path> with a d attribute').toBeTruthy();
    const measuredLength = svgPathLength(d ?? '');
    // Sanity check on the measurement itself: Chromium's real
    // getTotalLength() on the current path returns 633.5823364257812.
    expect(measuredLength).toBeGreaterThan(600);
    expect(measuredLength).toBeLessThan(670);

    const dasharray = Number(compiledRule(motion, '.drawn-line path')?.['stroke-dasharray']);
    expect(
      dasharray,
      'motion.css must declare a numeric stroke-dasharray on .drawn-line path',
    ).not.toBeNaN();

    expect(
      dasharray,
      'the dasharray must exceed the measured path length, or the tail never draws',
    ).toBeGreaterThan(measuredLength);
    expect(
      dasharray - measuredLength,
      'the overshoot should be comfortable slack for measurement variance, not a wildly different number',
    ).toBeLessThan(100);
  });

  it('has no scroll-driven draw left: the observed rules run neither keyframes nor a timeline', () => {
    expect(motion).not.toMatch(/site-draw-underline/);
    for (const selector of ['.drawn-line path', '.js .drawn-line path']) {
      const rule = compiledRule(motion, selector) ?? {};
      expect(rule['animation-timeline'], `${selector} scrubs on scroll`).toBeUndefined();
      expect(rule.animation, `${selector} runs keyframes`).toBeUndefined();
    }
  });

  it('has a -load variant for the hero, which is on screen at load and never observed in', () => {
    // The hero is not inside a RevealScope (its text runs `reveal-load`),
    // so nothing ever sets data-inview on its underline. Measured on the
    // built page before this existed: the hero stroke sat parked at the
    // full dash for good. Same clock and curve as `reveal-load`, written
    // with BOTH ends: under `.js` the element's own offset is the parked
    // 660, so a `from`-only block would draw from 660 to 660.
    const rule = compiledRule(motion, '.drawn-line-load path') ?? {};
    expect(rule.animation).toMatch(
      /^site-underline-load var\(--duration-hero\) var\(--ease-out-quint\) [\s\S]*\bboth\b/,
    );
    expect(rule['animation-timeline']).toBeUndefined();
    const dasharray = compiledRule(motion, '.drawn-line path')?.['stroke-dasharray'];
    expect(motion).toMatch(
      new RegExp(
        `@keyframes site-underline-load\\s*\\{\\s*from\\s*\\{\\s*stroke-dashoffset:\\s*${dasharray};\\s*\\}\\s*to\\s*\\{\\s*stroke-dashoffset:\\s*0;`,
      ),
    );
    expect(keyframeProps('site-underline-load')).toEqual(['stroke-dashoffset']);
  });

  it('reads data-inview off the .drawn-line root, not off the <path> itself', () => {
    // useInView sets data-inview on entry.target, which for `.drawn-line` is
    // the <svg> — never the <path> inside it (see the "in the DOM" tests
    // below). The CSS has to query the attribute there:
    // `.drawn-line[data-inview='true']` as the attribute-bearing compound,
    // with `path` as a plain descendant selector after it.
    // `.drawn-line path[data-inview='true']` parses fine and would never
    // match anything, since nothing ever sets that attribute on the <path>.
    expect(motion).toMatch(/\.js \.drawn-line\[data-inview=(['"])true\1\]\s+path\b/);
  });
});

describe('the SVG path-length approximator', () => {
  it('throws on a command it does not handle, instead of silently dropping it', () => {
    // Each of these embeds an unsupported command's coordinates into the
    // preceding M/C command's number list if unguarded — e.g. `H600` was
    // measured as contributing 0, and a smooth-cubic `S` tail vanished
    // entirely, both leaving the reported length stale and wrong rather
    // than absent.
    expect(() => svgPathLength('M4 16H600')).toThrow(/unsupported command/);
    expect(() => svgPathLength('M0 0V50')).toThrow(/unsupported command/);
    expect(() => svgPathLength('M0 0C10 0 20 0 30 0S50 0 60 0')).toThrow(/unsupported command/);
    expect(() => svgPathLength('M0 0Q50 50 100 0')).toThrow(/unsupported command/);
  });

  it('does not mistake scientific-notation numbers (containing the letter e) for a command', () => {
    // The guard lets both `e` and `E` through because they are numbers, not
    // commands. That makes it this parser's job to read every spelling the
    // guard waves past — uppercase exponent and explicit `+` included.
    // Reading only lowercase-`e`-without-`+` split the exponent off as a
    // separate coordinate, mis-paired the number list and returned a
    // confidently wrong length: `1E-2` measured 2.236 instead of 0.01, and
    // `1e+1` measured 1.414 instead of 10.
    for (const [d, expected] of [
      ['M0 0L1e1 0', 10],
      ['M0 0L1E1 0', 10],
      ['M0 0L1e+1 0', 10],
      ['M0 0L1E+1 0', 10],
      ['M0 0L1e-2 0', 0.01],
      ['M0 0L1E-2 0', 0.01],
    ] as [string, number][]) {
      expect(() => svgPathLength(d), d).not.toThrow();
      expect(svgPathLength(d), d).toBeCloseTo(expected, 5);
    }
  });
});

describe('the drawn underline in the DOM', () => {
  it('is observed by RevealScope, via the .drawn-line class on its <svg> root', () => {
    const { container } = render(
      <RevealScope>
        <DrawnUnderline />
      </RevealScope>,
    );
    const svg = container.querySelector('.drawn-line');
    expect(
      svg,
      'DrawnUnderline must render something carrying the .drawn-line class',
    ).not.toBeNull();

    const [observer] = MockIntersectionObserver.instances;
    expect(observer.observed.has(svg as Element)).toBe(true);
  });

  it("the observer's callback sets data-inview on the <svg> root, not on the nested <path>", () => {
    // This drives the callback by hand via `observer.trigger`, which sets
    // the attribute on whatever element it's given whether or not that
    // element was ever actually observed — so on its own this does NOT
    // prove .drawn-line is observed (the sibling test above carries that
    // load). What it does prove: when the callback fires for the <svg>,
    // it lands the attribute on the <svg> itself and not on the <path>
    // inside it, matching the CSS's `.drawn-line[data-inview='true'] path`
    // selector (see the "reads data-inview off the .drawn-line root"
    // test above).
    const { container } = render(
      <RevealScope>
        <DrawnUnderline />
      </RevealScope>,
    );
    const svg = container.querySelector('.drawn-line') as Element;
    const [observer] = MockIntersectionObserver.instances;

    observer.trigger(svg, true);

    expect(svg.getAttribute('data-inview')).toBe('true');
    expect(svg.querySelector('path')?.getAttribute('data-inview')).toBeNull();
  });

  it('takes mode="load" for the hero, and stays observer-driven by default', () => {
    const scroll = render(<DrawnUnderline />).container.querySelector('.drawn-line');
    expect(scroll).not.toHaveClass('drawn-line-load');
    cleanup();
    const load = render(<DrawnUnderline mode="load" />).container.querySelector('.drawn-line');
    expect(load).toHaveClass('drawn-line-load');
  });
});

describe('prefers-reduced-motion', () => {
  it('ignores a reduced-motion query that has been negated', () => {
    // `not all and (prefers-reduced-motion: reduce)` CONTAINS the query while
    // meaning its exact opposite: the reset would reach everyone EXCEPT the
    // people who asked for less motion. A substring test cannot tell the two
    // apart, so ruleFor has to reject the negated form outright — otherwise
    // the inversion lands with every test still green.
    const body = '{ .reveal { opacity: 1 !important } }';
    expect(ruleFor(`@media (prefers-reduced-motion: reduce) ${body}`, '.reveal')).toBeDefined();
    expect(
      ruleFor(`@media not all and (prefers-reduced-motion: reduce) ${body}`, '.reveal'),
    ).toBeUndefined();
  });

  const REVEALING_SELECTORS = [
    '.reveal',
    '.reveal-clip',
    '.reveal-load',
    '.reveal-clip-load',
    '.blueprint::before',
  ];

  for (const selector of REVEALING_SELECTORS) {
    it(`restores opacity/transform/clip-path on ${selector}'s OWN rule, not merely somewhere in the file`, () => {
      // A regex that only asks "does `opacity: 1 !important` appear
      // anywhere after the @media line" would stay green if the reset were
      // moved onto an unrelated selector (e.g. .pop-on-hover) — the exact
      // blank-page failure this reset exists to prevent. Parsing the CSS
      // and checking the declaration on THIS selector's own rule node
      // closes that hole.
      const rule = ruleFor(reduced, selector);
      expect(rule, `${selector} needs its own reduced-motion rule`).toBeDefined();
      expect(declValue(rule, 'opacity'), `${selector}'s own rule must restore opacity`).toBe(
        '1 !important',
      );
      expect(declValue(rule, 'transform'), `${selector}'s own rule must clear the transform`).toBe(
        'none !important',
      );
      expect(declValue(rule, 'clip-path'), `${selector}'s own rule must clear the clip-path`).toBe(
        'none !important',
      );
      // The scroll reveal is a transition now, and a preference toggled after
      // load would otherwise animate the element into its resting state.
      expect(declValue(rule, 'transition'), `${selector}'s own rule must drop the transition`).toBe(
        'none !important',
      );
    });
  }

  it('resets the drawn underline to fully drawn rather than fully undrawn', () => {
    const rule = ruleFor(reduced, '.drawn-line path');
    expect(rule, '.drawn-line path needs its own reduced-motion rule').toBeDefined();
    expect(declValue(rule, 'stroke-dasharray')).toBe('none !important');
    expect(declValue(rule, 'stroke-dashoffset')).toBe('0 !important');
    expect(declValue(rule, 'transition')).toBe('none !important');
    // The hero's `.drawn-line-load` variant runs keyframes, not a transition.
    expect(declValue(rule, 'animation')).toBe('none !important');
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
  it('observes exactly its .reveal/.reveal-clip descendants, by class — not by tag, and not siblings without those classes', () => {
    const { getByTestId } = render(
      <RevealScope>
        <h2 className="reveal" data-testid="heading">
          Heading
        </h2>
        <p className="reveal-clip" data-testid="paragraph">
          Body copy
        </p>
        {/* Same class as `heading`, a different tag — pins the selection to
            CLASS matching. A `TARGET_SELECTOR` repointed at e.g. `'h2, p'`
            would still happen to select `heading`/`paragraph` for this
            fixture, but would miss this one. */}
        <div className="reveal" data-testid="div-reveal">
          Also reveal, different tag
        </div>
        <span data-testid="plain">Not observed</span>
      </RevealScope>,
    );

    const [observer] = MockIntersectionObserver.instances;
    expect(observer.observed.has(getByTestId('heading'))).toBe(true);
    expect(observer.observed.has(getByTestId('paragraph'))).toBe(true);
    expect(observer.observed.has(getByTestId('div-reveal'))).toBe(true);
    expect(observer.observed.has(getByTestId('plain'))).toBe(false);
    expect(observer.observed.size).toBe(3);
  });

  it('attaches on every browser: a scroll timeline is no longer a reason to skip it', () => {
    /* Until 2026-09-26 this hook was the FALLBACK and returned early wherever
       `CSS.supports('animation-timeline: view()')` was true — which is every
       current Chrome and Safari, i.e. almost everyone. It is the only path
       now, so a runtime that answers "yes" must still get an observer. jsdom
       has no `CSS` at all; this stands one up that says yes to everything. */
    const hadCSS = 'CSS' in globalThis;
    const original = (globalThis as { CSS?: unknown }).CSS;
    Object.defineProperty(globalThis, 'CSS', {
      value: { supports: () => true },
      configurable: true,
      writable: true,
    });
    try {
      const { getByTestId } = render(
        <RevealScope>
          <h2 className="reveal" data-testid="heading">
            Heading
          </h2>
        </RevealScope>,
      );
      expect(MockIntersectionObserver.instances).toHaveLength(1);
      expect(MockIntersectionObserver.instances[0].observed.has(getByTestId('heading'))).toBe(true);
    } finally {
      if (hadCSS) {
        Object.defineProperty(globalThis, 'CSS', {
          value: original,
          configurable: true,
          writable: true,
        });
      } else {
        delete (globalThis as { CSS?: unknown }).CSS;
      }
    }
  });

  it("fires where wigin's does: 6% of the element showing, 8% up from the bottom edge", () => {
    // Measured on wigin.ai: `threshold: .06`, `rootMargin: '0px 0px -8% 0px'`,
    // which puts the trigger line at about 90% of the viewport height for a
    // one-line element — low enough that the reveal is under way as the
    // reader's eye arrives, high enough that it is never in the margin.
    render(
      <RevealScope>
        <h2 className="reveal">Heading</h2>
      </RevealScope>,
    );
    const [observer] = MockIntersectionObserver.instances;
    expect(observer.rootMargin).toBe('0px 0px -8% 0px');
    expect([...observer.thresholds]).toEqual([0.06]);
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

describe('motion.css and motion-reduced.css reach the built stylesheet', () => {
  it('emits a marker from each file through the real Tailwind/PostCSS pipeline', async () => {
    // Reading src/styles/motion*.css directly (as every test above does)
    // proves the source files say the right thing; it says nothing about
    // whether globals.css still imports them. This compiles globals.css
    // through the actual pipeline `next build` uses, with zero candidate
    // classes, and would go red if either @import were ever removed.
    const css = await compileGlobals();
    expect(css, 'a motion.css marker must survive the build').toMatch(
      /@keyframes site-reveal-fade/,
    );
    // NOT a bare `/prefers-reduced-motion:\s*reduce/` match: globals.css's
    // own base layer has its own `@media (prefers-reduced-motion: reduce)
    // { html { scroll-behavior: auto } }`, entirely independent of
    // motion-reduced.css. That regex is satisfied by globals.css alone, so
    // it stayed green even with motion-reduced.css's own @import removed —
    // the whole reduced-motion reset gone from the build while the test
    // matched an unrelated rule. `ruleFor` (which only looks inside a
    // `prefers-reduced-motion: reduce` at-rule to begin with) pinned to a
    // selector motion-reduced.css alone emits closes that gap.
    const rule = ruleFor(css, '.drawn-line path');
    expect(
      rule,
      "the built stylesheet must carry .drawn-line path's own reduced-motion rule",
    ).toBeDefined();
    expect(declValue(rule, 'stroke-dasharray'), 'must survive the build').toBe('none !important');
  });
});
