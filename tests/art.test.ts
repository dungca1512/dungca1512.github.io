/* The ask this file exists to keep: every band on the page carries a picture,
 * and the motion that brings those pictures in is real motion rather than a
 * class name nobody wired up.
 *
 * Both halves have already failed silently on this site once. A renamed
 * <Illustration name> left the pages full of 404s with every gate green; a
 * `@utility` whose name no markup used was CSS that compiled, passed lint, and
 * animated nothing. So none of the checks below assert that a rule EXISTS —
 * each one holds two lists together: what the stylesheet defines against what
 * the markup applies, and what the page renders against what the section
 * components actually contain.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECTS } from '../src/content/projects';

const read = (path: string) => readFileSync(path, 'utf8');

/** Block and line comments out. Every check below looks for an ELEMENT, and
 *  this repo comments heavily — prose that names the very tag being searched
 *  for sits above the markup in more than one of these files, so an unstripped
 *  regex finds the sentence instead of the element and reports on nothing. */
const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const PAGE = 'src/app/[lang]/page.tsx';
const ART_CSS = 'src/styles/motion/art.css';
const TECH_ART_CSS = 'src/styles/site/tech-art.css';
const REDUCED_CSS = 'src/styles/motion-reduced.css';
const GLOBALS = 'src/app/globals.css';
const WORK = 'src/components/sections/work.tsx';
const ILLUSTRATION = 'src/components/site/illustration.tsx';

/** Every .tsx under src/, so a check can look at all of them at once. */
function sourceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (path.endsWith('.tsx')) out.push(path);
    }
  };
  walk('src');
  return out;
}

/** The section components the page actually composes, in order. Read from the
 *  page's own imports rather than from a list typed out here: a hardcoded list
 *  would keep passing after a section was added, which is the one case this
 *  file is meant to catch. */
function pageSections(): string[] {
  const page = read(PAGE);
  const imported = [...page.matchAll(/from '@\/components\/sections\/([a-z-]+)'/g)].map(
    (m) => m[1]!,
  );
  const rendered = [...page.matchAll(/<([A-Z][A-Za-z]*)\s*\/>/g)].map((m) => m[1]!);
  // Only the ones that are both imported from sections/ and rendered.
  return imported.filter((file) => {
    const component = file.replace(/(^|-)([a-z])/g, (_, __, c: string) => c.toUpperCase());
    return rendered.includes(component);
  });
}

/* The three ways a band can carry art. All three are pictures to a reader;
   only the first is a file on disk. */
// `<CodeWindow` counts as art since 2026-09-26: the terminal that types a
// request and its answer (components/motion/code-window.tsx) is a picture in
// every sense this test cares about — a drawn, decorative, aria-hidden thing
// that keeps a band from being a column of text alone. The hero carries it
// over the portrait illustration, so the hero passes on both markers.
const ART_MARKERS = ['<Illustration', '<TechArt', '<MetricGlyph', '<CodeWindow'];

describe('every band on the page carries art', () => {
  const sections = pageSections();

  it('found the page sections at all — an empty list would pass every case below', () => {
    expect(sections.length).toBeGreaterThanOrEqual(8);
  });

  it.each(pageSections())('%s renders a picture', (file) => {
    const source = read(`src/components/sections/${file}.tsx`);
    const carries = ART_MARKERS.filter((marker) => source.includes(marker));
    expect(carries, `${file}.tsx renders none of ${ART_MARKERS.join(', ')}`).not.toHaveLength(0);
  });

  it('gives every project card its own drawn art', () => {
    const source = read(WORK);
    /* Inside the card component, not merely somewhere in the file — art placed
       outside it would be one picture for nine cards. This used to slice from
       `PROJECTS.map`, because the card WAS the body of that map; it was lifted
       into `ProjectCard` so the five open cards and the four folded ones could
       be the same card rather than the same JSX typed twice. Anchoring on the
       component instead of the loop is the stronger of the two: there is now
       exactly one place a card's picture can come from. */
    const card = /function ProjectCard\([\s\S]*?\n\}\n/.exec(source)?.[0] ?? '';
    expect(card, 'no ProjectCard component in work.tsx to check').not.toBe('');
    const loop = card;
    expect(loop).toContain('<TechArt');
    /* From the project, not from the loop counter. `artFor(i)` used to be
       here, and it was wrong in a way no gate could see: the card's picture
       was a function of its position, so the drawing above the speech platform
       described nothing and changed if the list was sorted. */
    expect(loop).toContain('{...project.art}');
    expect(loop, 'the card is picking its art by index again').not.toMatch(/artFor\(/);
  });
});

describe('the drawn art picks a layout and a colour', () => {
  /* These used to run over `artFor(0..8)`. They now run over the projects
     themselves, which is the only version that can catch the failure that
     matters: a project added with no art, or two projects handed the same
     drawing. The old arithmetic made uniqueness free and made relevance
     impossible; naming the art per project trades one for the other, and this
     block is the bill for that trade. */

  it('gives every project its own art, so none inherits a neighbour’s picture', () => {
    expect(PROJECTS.length).toBeGreaterThanOrEqual(9);
    for (const project of PROJECTS) {
      expect(project.art, `${project.slug} has no art`).toBeTruthy();
    }
    const pairs = PROJECTS.map((p) => `${p.art.variant}/${p.art.accent}`);
    const repeated = pairs.filter((pair, i) => pairs.indexOf(pair) !== i);
    expect(repeated, `layout/colour pairs used twice: ${repeated.join(', ')}`).toEqual([]);
  });

  it('only ever picks a layout the component can draw', () => {
    const source = read('src/components/site/tech-art.tsx');
    for (const { slug, art } of PROJECTS) {
      expect(source, `${slug}: no branch for variant ${art.variant}`).toContain(
        `variant === ${art.variant} ?`,
      );
    }
  });

  it('only ever picks an accent the stylesheet gives a colour', () => {
    const css = read(TECH_ART_CSS);
    // The default `.tech-art { color: … }` covers one accent without naming
    // it, so an accent counts as coloured if it has its own rule OR is the
    // one the base rule already sets.
    const named = new Set([...css.matchAll(/\[data-art-accent='([a-z]+)'\]/g)].map((m) => m[1]!));
    const base = /\.tech-art\s*\{[^}]*color:\s*var\(--base-([a-z]+)\)/.exec(css)?.[1];
    for (const { slug, art } of PROJECTS) {
      expect(
        named.has(art.accent) || art.accent === base,
        `${slug}: accent "${art.accent}" has no colour`,
      ).toBe(true);
    }
  });

  /* Not every <TechArt> comes from a project — the analytics band names its
     variant inline. Whatever any call site asks for has to be drawable, or the
     frame renders empty and every other gate stays green. */
  it('draws whatever any call site asks for, project or not', () => {
    const component = read('src/components/site/tech-art.tsx');
    const asked = sourceFiles()
      .filter((file) => !file.endsWith('tech-art.tsx'))
      .flatMap((file) => [...stripComments(read(file)).matchAll(/variant=\{(\d+)\}/g)])
      .map((m) => Number(m[1]));
    expect(asked.length, 'found no inline variant= call sites to check').toBeGreaterThan(0);
    for (const variant of asked) {
      expect(component, `no branch for variant ${variant}`).toContain(`variant === ${variant} ?`);
    }
  });
});

/* Each entry: the class, the stylesheet that defines it, and the file that is
   expected to apply it. A class defined and never used is dead CSS; a class
   applied and never defined animates nothing. */
const EFFECTS = [
  { klass: 'shutter', css: ART_CSS },
  { klass: 'shutter-veil', css: ART_CSS },
  { klass: 'art-parallax', css: ART_CSS },
  { klass: 'art-drift', css: ART_CSS },
  { klass: 'art-pulse', css: ART_CSS },
  { klass: 'art-signal', css: ART_CSS },
] as const;

describe('picture motion', () => {
  it.each(EFFECTS)('$klass is defined with keyframes behind it', ({ klass, css }) => {
    const source = read(css);
    // `@utility x` or `.x` — both are how this repo declares one.
    const declared = new RegExp(`@utility ${klass}\\b|\\.${klass}\\s*[,{]`).test(source);
    expect(declared, `${klass} is not declared in ${css}`).toBe(true);
    const animation = new RegExp(
      `(?:@utility ${klass}\\b|\\.${klass}\\s*[,{])[\\s\\S]{0,400}?animation:\\s*(site-[a-z-]+)`,
    ).exec(source);
    expect(animation, `${klass} declares no animation`).not.toBeNull();
    /* Matched up to the opening brace, NOT with toContain. A substring check
       passes on a RENAMED block: "@keyframes site-art-parallax-renamed {"
       contains "@keyframes site-art-parallax". Falsified — renaming the
       keyframes left this test green until the brace was required. */
    expect(source, `${klass} names @keyframes that do not exist`).toMatch(
      new RegExp(`@keyframes ${animation![1]}\\s*\\{`),
    );
  });

  it.each(EFFECTS)('$klass is applied somewhere in src/', ({ klass }) => {
    const used = sourceFiles()
      .concat([ART_CSS, TECH_ART_CSS])
      .some((file) => new RegExp(`['"\\s]${klass}['"\\s]`).test(read(file)));
    expect(used, `${klass} is declared but no markup applies it`).toBe(true);
  });

  it.each(EFFECTS)('$klass stands down under prefers-reduced-motion', ({ klass }) => {
    const reduced = read(REDUCED_CSS);
    const block = reduced.slice(reduced.indexOf('prefers-reduced-motion'));
    expect(block, `${klass} keeps animating for someone who asked for less motion`).toMatch(
      new RegExp(`\\.${klass}\\s*[,{]`),
    );
  });

  it.each([ART_CSS, TECH_ART_CSS])('%s is imported, or none of it reaches a page', (css) => {
    expect(read(GLOBALS)).toContain(css.replace('src/', '../'));
  });
});

describe('parallax and the class it must not share an element with', () => {
  /* `art-parallax` and every other @utility here set the `animation`
     SHORTHAND. Two of them on one element is not two effects — the later rule
     in the sheet wins outright and the earlier one silently does nothing. The
     component keeps transform-driven motion on the <img> and leaves the
     <picture> free, and that separation is the whole guard. */
  it('lands on the <img>, not on the <picture>', () => {
    /* Comments stripped FIRST. This file's own header prose mentions both
       `<picture>` and `<img>`, and those sentences come before the markup —
       so the naive regex matched the literal "<picture>" in a comment and this
       test passed while art-parallax sat on the real element. Falsified: it
       now goes red on exactly that move. */
    const source = stripComments(read(ILLUSTRATION));
    const picture = /<picture[\s\S]*?>/.exec(source)?.[0] ?? '';
    const img = /<img[\s\S]*?\/>/.exec(source)?.[0] ?? '';
    expect(picture, 'found no <picture> element to check').toContain('className');
    expect(img, 'the <img> never gets art-parallax').toContain('art-parallax');
    expect(picture, 'art-parallax on the <picture> would collide with reveal*').not.toContain(
      'art-parallax',
    );
  });

  it('is switched on at every illustration on the page', () => {
    /* The intro curtain is the deliberate exception: it is a full-bleed panel
       that slides sideways on its own timeline, and it never scrolls.

       Every CALL, not the first call in every file. Those were the same number
       until the capabilities band merged into expertise and one file came to
       hold two illustrations — at which point a file-at-a-time check silently
       stopped looking at the second one, and the floor, which counted files,
       read as a regression when nothing had been removed from the page. */
    const calls = sourceFiles()
      .filter((file) => !file.includes('intro-curtain'))
      .flatMap((file) =>
        [...stripComments(read(file)).matchAll(/<Illustration[\s\S]*?\/>/g)].map((m) => ({
          file,
          call: m[0],
        })),
      );
    // Seven: the hero's portrait is one of them, and it stays one — the code
    // window was set beside it, not in its place.
    expect(calls.length, 'found no <Illustration> callers to check').toBeGreaterThanOrEqual(7);
    for (const { file, call } of calls) {
      expect(call, `${file} renders art with no parallax`).toContain('parallax');
    }
  });

  it('is only asked for where the frame clips, since it oversizes the picture', () => {
    for (const file of sourceFiles()) {
      // Comments out BEFORE the word is looked for: smooth-scroll.tsx names
      // the parallax in prose and renders nothing at all.
      const source = stripComments(read(file));
      if (!source.includes('parallax')) continue;
      if (file.endsWith('illustration.tsx')) continue; // the component, not a caller
      const call = /<Illustration[\s\S]*?\/>/.exec(source)![0];
      const clips =
        /className="[^"]*overflow-hidden/.test(call) || /className="[^"]*hero-portrait/.test(call); // clips in sections/hero.css
      expect(clips, `${file} parallaxes a picture inside a frame that does not clip`).toBe(true);
    }
  });
});
