import { describe, it, expect } from 'vitest';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import postcss, { type AtRule, type Declaration, type Rule } from 'postcss';
import tailwindcssPostcss from '@tailwindcss/postcss';

/* The pinned Selected Work trio is entirely CSS — there is no component state,
   no effect and no event handler to render and poke at, so the guarantees it
   has to keep are guarantees about a stylesheet. This file asserts them
   against the stylesheet, the way tests/motion.test.tsx already does for
   motion.css.

   What is being protected, in the order the requirements were given:

   1. someone who asked for reduced motion gets the content and no movement;
   2. a browser with no `animation-timeline` gets a readable page;
   3. only `transform` and `opacity` are animated;
   4. heights are `dvh`, never `vh`;
   5. a narrow viewport is never handed the pin.

   Each of those is a property of WHERE a declaration sits in the file — which
   at-rule encloses it — and not of whether a string appears somewhere in it.
   So the walks below are all scoped to their at-rule, and a grep would not
   substitute for any of them. */

const WORK_CSS = readFileSync('src/styles/sections/work.css', 'utf8');
const REDUCED_CSS = readFileSync('src/styles/motion-reduced.css', 'utf8');
const USE_IN_VIEW = readFileSync('src/components/motion/use-in-view.ts', 'utf8');
const GLOBALS_CSS = resolve('src/app/globals.css');

/** The three layers the scroll position drives, and the two elements that
 *  build the pin around them. */
const LAYERS = ['.pin-art', '.pin-panel', '.pin-name'];
const PIN_KEYFRAMES = ['site-pin-art', 'site-pin-panel', 'site-pin-name', 'site-pin-fade'];

/**
 * The `@supports (animation-timeline: view())` at-rule in work.css.
 *
 * Deliberately rejects a NEGATED query. `@supports not (animation-timeline:
 * view())` contains the same substring while meaning the exact opposite — it
 * would put the pin in front of only the browsers that cannot drive it — and
 * a `params.includes(...)` test cannot tell the two apart. Same failure shape
 * the reduced-motion helper in motion.test.tsx guards against, one at-rule
 * over.
 */
function supportsBlock(css: string): AtRule | undefined {
  const root = postcss.parse(css);
  let found: AtRule | undefined;
  root.walkAtRules('supports', (atRule) => {
    if (/^\s*not\b/.test(atRule.params)) return;
    if (!/animation-timeline:\s*view\(\)/.test(atRule.params)) return;
    found = atRule;
  });
  return found;
}

/** Every rule inside `scope` whose selector list includes `selector`. */
function rulesFor(scope: AtRule | postcss.Root, selector: string): Rule[] {
  const found: Rule[] = [];
  scope.walkRules((rule) => {
    if (rule.selectors.includes(selector)) found.push(rule);
  });
  return found;
}

/** A declaration's value with ` !important` appended when it carries the
 *  flag — postcss keeps that on `decl.important`, not in `decl.value`, and a
 *  reset in motion-reduced.css that quietly lost its flag would otherwise
 *  read as identical to one that still had it. */
function valueOf(decl: Declaration | undefined): string | undefined {
  if (!decl) return undefined;
  return decl.important ? `${decl.value} !important` : decl.value;
}

/** Declarations of `prop` on any rule matching `selector` inside `scope`. */
function declsFor(scope: AtRule | postcss.Root, selector: string, prop: string): Declaration[] {
  return rulesFor(scope, selector).flatMap((rule) => {
    const out: Declaration[] = [];
    rule.walkDecls(prop, (decl) => {
      out.push(decl);
    });
    return out;
  });
}

/** The nearest enclosing at-rule chain of a node, outermost first. */
function atRuleChain(node: postcss.Node): AtRule[] {
  const chain: AtRule[] = [];
  let parent = node.parent;
  while (parent) {
    if (parent.type === 'atrule') chain.unshift(parent as AtRule);
    parent = parent.parent;
  }
  return chain;
}

/**
 * Compiles globals.css through the real Tailwind v4 PostCSS pipeline with no
 * candidate classes, to prove sections/work.css actually reaches the built
 * stylesheet through globals.css's `@import` rather than merely existing as a
 * file. Reading work.css directly — as every other test here does — would
 * stay green if globals.css stopped importing it. Same helper, same reason,
 * as `compileGlobals` in tests/motion.test.tsx.
 */
async function compileGlobals(): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), 'work-pin-build-test-'));
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

describe('the pinned trio is an enhancement, not the content', () => {
  it('puts every pin declaration behind a POSITIVE @supports (animation-timeline: view())', () => {
    const block = supportsBlock(WORK_CSS);
    expect(
      block,
      'work.css declares no positive @supports (animation-timeline: view())',
    ).toBeDefined();

    /* The declarations that TURN a list of cards into a pinned sequence.
       Matched by value, not by property: the static card legitimately says
       `position: relative` (it is the containing block for nothing until the
       layers go absolute) and legitimately has no height at all, so a
       property-name test would either fail on correct CSS or have to special-
       case its way back to the same list. What must never escape the guard is
       the sticky pin, the named timeline, the tall stage, and the scrub. */
    const definesThePin = (decl: Declaration): string | false => {
      const where = decl.parent as Rule | undefined;
      if (where?.type !== 'rule') return false;
      if (!where.selectors.some((sel) => sel.includes('.pin-'))) return false;
      if (decl.prop === 'position' && decl.value === 'sticky') return 'the sticky pin';
      if (decl.prop === 'view-timeline-name' && decl.value !== 'none') return 'a named timeline';
      if (decl.prop === 'animation-timeline') return 'a scroll timeline';
      if (decl.prop === 'animation-range') return 'a scroll range';
      if (decl.prop === 'animation' && decl.value !== 'none') return 'a scrubbed animation';
      if (decl.prop === 'height' && /--pin-|dvh/.test(decl.value)) return 'the tall stage';
      return false;
    };

    let guarded = 0;
    postcss.parse(WORK_CSS).walkDecls((decl) => {
      const what = definesThePin(decl);
      if (!what) return;
      guarded++;
      const chain = atRuleChain(decl);
      expect(
        chain.some((at) => at.name === 'supports' && !/^\s*not\b/.test(at.params)),
        `${what} — "${decl.prop}: ${decl.value}" on ${(decl.parent as Rule).selector} — sits outside the @supports guard`,
      ).toBe(true);
    });

    // Not a vacuous pass: delete the pin and this drops to zero.
    expect(guarded, 'work.css declares nothing that pins anything').toBeGreaterThanOrEqual(8);
  });

  it('gates the pin on a min-width AND on prefers-reduced-motion: no-preference', () => {
    const block = supportsBlock(WORK_CSS)!;
    const media: AtRule[] = [];
    block.walkAtRules('media', (atRule) => {
      media.push(atRule);
    });

    expect(media.length, 'the @supports block contains no @media gate at all').toBeGreaterThan(0);

    for (const atRule of media) {
      // A tall card pinned on a phone is a scroll trap; a scroll-driven
      // animation on someone who asked for less motion is the thing the
      // request is about. Both escapes are the same at-rule, so losing
      // either one is a visible edit here.
      expect(atRule.params, 'the pin is not gated on a minimum width').toMatch(/min-width:\s*\d/);
      expect(
        atRule.params,
        'the pin is not gated on prefers-reduced-motion: no-preference',
      ).toMatch(/prefers-reduced-motion:\s*no-preference/);
    }

    // And every layer's animation must actually live under that gate, not
    // merely somewhere in the supports block beside it.
    for (const selector of LAYERS) {
      const decls = declsFor(block, selector, 'animation').filter((decl) => decl.value !== 'none');
      expect(decls.length, `${selector} declares no animation inside @supports`).toBeGreaterThan(0);
      for (const decl of decls) {
        expect(
          atRuleChain(decl).some(
            (at) => at.name === 'media' && /prefers-reduced-motion/.test(at.params),
          ),
          `${selector}'s animation is not inside the reduced-motion gate`,
        ).toBe(true);
      }
    }
  });

  it('ships no JavaScript: no .pin-* class is in use-in-view.ts TARGET_SELECTOR', () => {
    // The `@supports not` fallback in motion.css needs an IntersectionObserver
    // to hand `.reveal` its content back. This section's fallback is the
    // static card itself, so it must never enter that code path — and the
    // observer only ever touches what TARGET_SELECTOR names.
    const target = USE_IN_VIEW.match(/const TARGET_SELECTOR = '([^']*)'/)?.[1];
    expect(target, 'TARGET_SELECTOR not found in use-in-view.ts').toBeDefined();
    for (const selector of [...LAYERS, '.pin-card', '.pin-stage', '.pin-list', '.pin-scrim']) {
      expect(target, `${selector} would drag this section into the JS fallback`).not.toContain(
        selector,
      );
    }
  });

  it('reaches the built stylesheet through globals.css', async () => {
    const built = await compileGlobals();
    expect(built).toContain('.pin-stage');
    expect(built).toContain('view-timeline-name');
    for (const name of PIN_KEYFRAMES) expect(built).toContain(name);
  });
});

describe('the scrub only touches compositor properties', () => {
  it('animates nothing but transform and opacity', () => {
    const root = postcss.parse(WORK_CSS);
    const seen = new Set<string>();

    for (const name of PIN_KEYFRAMES) {
      let frames = 0;
      root.walkAtRules('keyframes', (atRule) => {
        if (atRule.params !== name) return;
        frames++;
        atRule.walkDecls((decl) => {
          seen.add(decl.prop);
          // width/height/top/left/margin force layout; filter and box-shadow
          // force paint. Either one turns a scroll-scrubbed animation into
          // work on the main thread on every frame the reader scrolls.
          expect(
            ['transform', 'opacity'],
            `@keyframes ${name} animates "${decl.prop}", which is not a compositor property`,
          ).toContain(decl.prop);
        });
      });
      expect(frames, `@keyframes ${name} is missing`).toBe(1);
    }

    // Guards the assertion above against passing vacuously: if the keyframe
    // bodies were emptied, every `toContain` loop would simply never run.
    expect(seen).toEqual(new Set(['transform', 'opacity']));
  });

  it('measures every pin height in dvh, never vh', () => {
    const block = supportsBlock(WORK_CSS)!;
    const offenders: string[] = [];
    block.walkDecls((decl) => {
      // `dvh` and `svh` both END in `vh`, so the boundary in front of the
      // number is what separates them from the bare unit: `100vh` matches,
      // `100dvh` does not. A mobile address bar that grows and shrinks would
      // otherwise resize the stage under a card that is pinned to it.
      if (/\d\s*vh\b/.test(decl.value)) offenders.push(`${decl.prop}: ${decl.value}`);
    });
    expect(offenders, 'bare vh inside the pin block').toEqual([]);

    // Positive half: the stage and the pin offset are actually sized in dvh,
    // so the check above cannot pass by there being no heights at all.
    const dvh = declsFor(block, '.pin-list', '--pin-stage-h')
      .concat(declsFor(block, '.pin-list', '--pin-card-h'))
      .concat(declsFor(block, '.pin-card', 'top'));
    expect(dvh.length).toBeGreaterThanOrEqual(3);
    for (const decl of dvh) expect(decl.value).toContain('dvh');
  });

  it('drives the layers from the stage timeline, over the pinned range', () => {
    const block = supportsBlock(WORK_CSS)!;

    const name = declsFor(block, '.pin-stage', 'view-timeline-name')[0];
    expect(name?.value, '.pin-stage declares no named view timeline').toMatch(/^--/);

    // Each layer reads the stage's timeline by that name — not `view()`,
    // which on an element inside a sticky card measures the card's own
    // (stalled) progress rather than the page's.
    for (const selector of LAYERS) {
      const timelines = declsFor(block, selector, 'animation-timeline');
      expect(timelines.length, `${selector} sets no animation-timeline`).toBeGreaterThan(0);
      for (const decl of timelines) expect(decl.value).toBe(name!.value);

      const ranges = declsFor(block, selector, 'animation-range');
      expect(ranges.length, `${selector} sets no animation-range`).toBeGreaterThan(0);
      // `contain` is the window in which a subject taller than the viewport
      // covers it — the pin window. `cover` or `entry` would run the scrub
      // while the card is still travelling, i.e. out of step with the pin.
      for (const decl of ranges) expect(decl.value).toMatch(/^contain\b/);
    }
  });

  it('staggers the three layers instead of running them together', () => {
    const block = supportsBlock(WORK_CSS)!;
    const spans = LAYERS.map((selector) => {
      const value = declsFor(block, selector, 'animation-range')[0]!.value;
      const nums = [...value.matchAll(/(\d+(?:\.\d+)?)%/g)].map((m) => Number(m[1]));
      expect(nums.length, `${selector}'s range is not a percentage pair`).toBe(2);
      return { selector, start: nums[0], end: nums[1] };
    });

    for (const span of spans) expect(span.end).toBeGreaterThan(span.start);

    // The brief's word was "lệch pha" — out of phase, one finishing before
    // the next begins. Each layer starts no earlier than 80% of the way
    // through the one before it, so a future tuning pass that quietly slides
    // them onto the same range (a dissolve, not a sequence) fails here.
    for (let i = 1; i < spans.length; i++) {
      const prev = spans[i - 1];
      const here = spans[i];
      const overlap = Math.max(0, prev.end - here.start);
      const prevLength = prev.end - prev.start;
      expect(
        overlap / prevLength,
        `${here.selector} starts ${overlap}% before ${prev.selector} has finished`,
      ).toBeLessThanOrEqual(0.2);
    }

    // The last layer comes to rest before the card unpins.
    expect(spans.at(-1)!.end).toBeLessThanOrEqual(100);
  });
});

describe('reduced motion gets the content, standing still', () => {
  /** The reduced-motion at-rule in motion-reduced.css, negation rejected for
   *  the same reason as `supportsBlock` above. */
  function reducedBlock(): AtRule {
    const root = postcss.parse(REDUCED_CSS);
    let found: AtRule | undefined;
    root.walkAtRules('media', (atRule) => {
      if (/^\s*not\b/.test(atRule.params)) return;
      if (!/prefers-reduced-motion:\s*reduce/.test(atRule.params)) return;
      found = atRule;
    });
    expect(found, 'motion-reduced.css has no prefers-reduced-motion: reduce block').toBeDefined();
    return found!;
  }

  it('parks all three layers on a visible, motionless frame', () => {
    const block = reducedBlock();
    for (const selector of LAYERS) {
      const rules = rulesFor(block, selector);
      expect(rules.length, `${selector} has no reduced-motion reset`).toBeGreaterThan(0);

      const values = new Map<string, string>();
      for (const rule of rules) {
        rule.walkDecls((decl) => {
          values.set(decl.prop, decl.important ? `${decl.value} !important` : decl.value);
        });
      }

      // `animation: none` ALONE is the trap this whole file exists to avoid:
      // these keyframes are filled `both`, so removing the animation without
      // also setting opacity parks the element on its FIRST frame — opacity
      // 0 — and the content vanishes for exactly the people who asked for
      // less motion. All three landings are asserted together.
      expect(values.get('animation'), `${selector} keeps its animation`).toBe('none !important');
      expect(values.get('opacity'), `${selector} is not pinned visible`).toBe('1 !important');
      expect(values.get('transform'), `${selector} is not brought to rest`).toBe('none !important');
    }
  });

  it('takes the pin itself away, so there is no tall empty stage to fall through', () => {
    const block = reducedBlock();
    expect(valueOf(declsFor(block, '.pin-card', 'position')[0])).toBe('static !important');
    expect(valueOf(declsFor(block, '.pin-stage', 'height')[0])).toBe('auto !important');
    expect(valueOf(declsFor(block, '.pin-stage', 'view-timeline-name')[0])).toBe('none !important');
  });
});
