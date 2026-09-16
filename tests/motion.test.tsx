import { describe, it, expect, afterEach } from 'vitest';
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
 * pipeline — the same one `next build` runs — with no candidate classes at
 * all. This exists to prove motion.css and motion-reduced.css actually
 * reach the built stylesheet through globals.css's `@import`, rather than
 * just existing as source files nobody wires up: reading
 * `src/styles/motion.css` directly (as every other test in this file does)
 * would stay green even if globals.css stopped importing it entirely.
 * Mirrors the pattern in tests/tokens.test.ts.
 */
async function compileGlobals(): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), 'motion-build-test-'));
  try {
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
    const nums = (command.slice(1).match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).map(Number);

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
    expect(motion).toMatch(/\.drawn-line path\s*\{[\s\S]*?stroke-dasharray:\s*\d/);
    const rule = motion.match(/\.drawn-line path\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(rule).toMatch(/animation:\s*site-draw-underline/);
    expect(rule).toMatch(/animation-timeline:\s*view\(\)/);
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

    const dasharray = Number(
      motion.match(/\.drawn-line path\s*\{[\s\S]*?stroke-dasharray:\s*(\d+(?:\.\d+)?)/)?.[1],
    );
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

  it('reads data-inview off the .drawn-line root in the fallback CSS, not off the <path> itself', () => {
    // useInView sets data-inview on entry.target, which for `.drawn-line` is
    // the <svg> — never the <path> inside it (see the "in the DOM" tests
    // below). The fallback CSS has to query the attribute there:
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
    expect(() => svgPathLength('M0 0L1e1 0')).not.toThrow();
    expect(svgPathLength('M0 0L1e1 0')).toBeCloseTo(10, 5);
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
});

describe('prefers-reduced-motion', () => {
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
    });
  }

  it('resets the drawn underline to fully drawn rather than fully undrawn', () => {
    const rule = ruleFor(reduced, '.drawn-line path');
    expect(rule, '.drawn-line path needs its own reduced-motion rule').toBeDefined();
    expect(declValue(rule, 'stroke-dasharray')).toBe('none !important');
    expect(declValue(rule, 'stroke-dashoffset')).toBe('0 !important');
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
      /@keyframes site-draw-underline/,
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
