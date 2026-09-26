/* Three sets of names have to agree, and nothing but this file compares them:
 *
 *   scripts/illustration-prompts.mjs  — what the generator can produce
 *   public/images/illustrations/      — what is on disk, in three formats
 *   src/components/sections/*.tsx     — what a page asks for
 *
 * Renaming an <Illustration name> once left the built pages full of 404s with
 * every gate green: the files were still on disk, so the count passed, and no
 * gate compared names to names. scripts/check-budget.mjs closed that hole for
 * the built HTML; this closes it before a build, and adds the half
 * check-budget cannot see — a prompt whose output was never compressed, and a
 * compressed file whose prompt is gone.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PROMPTS } from '../scripts/illustration-prompts.mjs';

const ART_DIR = 'public/images/illustrations';
const FORMATS = ['avif', 'webp', 'jpg'] as const;
const CEILING = 40960;

const promptNames = Object.keys(PROMPTS).sort();

/** Every `<Illustration name="…">` anywhere under src/. */
function renderedNames(): string[] {
  const found = new Set<string>();
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (path.endsWith('.tsx')) {
        for (const m of readFileSync(path, 'utf8').matchAll(
          /name="([a-z-]+)"[\s\S]{0,200}?alt=/g,
        )) {
          found.add(m[1]);
        }
      }
    }
  };
  walk('src');
  return [...found].sort();
}

describe('illustrations', () => {
  it('has prompts at all — a zero-length list would pass every test below', () => {
    expect(promptNames.length).toBeGreaterThanOrEqual(7);
  });

  it.each(promptNames)('%s ships in all three formats', (name) => {
    for (const ext of FORMATS) {
      expect(() => statSync(join(ART_DIR, `${name}.${ext}`)), `${name}.${ext}`).not.toThrow();
    }
  });

  it.each(promptNames)('%s is under the 40KB ceiling in every format', (name) => {
    for (const ext of FORMATS) {
      const bytes = statSync(join(ART_DIR, `${name}.${ext}`)).size;
      expect(bytes, `${name}.${ext} is ${bytes} bytes`).toBeLessThanOrEqual(CEILING);
    }
  });

  /* The art ships with its ground keyed out (scripts/key-ground.py), so it
   * sits on the page in either theme with no plate behind it. A regenerate
   * through an RGB-only step - a jpg intermediate, a `convert('RGB')` -
   * drops the alpha without failing anything else, and the plates come back.
   * Read from the containers rather than decoded: a WebP with alpha is an
   * extended (VP8X) file with the alpha flag set, and an AVIF with alpha
   * carries an auxiliary image tagged with the alpha URN. */
  it.each(promptNames)('%s carries alpha in avif and webp', (name) => {
    const webp = readFileSync(join(ART_DIR, `${name}.webp`));
    expect(webp.toString('latin1', 12, 16), `${name}.webp chunk`).toBe('VP8X');
    expect(webp[20]! & 0x10, `${name}.webp alpha flag`).toBe(0x10);
    const avif = readFileSync(join(ART_DIR, `${name}.avif`)).toString('latin1');
    expect(avif, `${name}.avif`).toContain('urn:mpeg:mpegB:cicp:systems:auxiliary:alpha');
  });

  it('ships no image whose prompt has been deleted', () => {
    const onDisk = [
      ...new Set(readdirSync(ART_DIR).map((f) => f.replace(/\.(avif|webp|jpg)$/, ''))),
    ].sort();
    expect(onDisk).toEqual(promptNames);
  });

  it('renders only names a prompt can regenerate', () => {
    const rendered = renderedNames();
    // The component-scanning regex is itself a thing that can silently stop
    // matching, so assert it found the page's art before trusting it.
    expect(rendered.length).toBeGreaterThanOrEqual(7);
    expect(promptNames).toEqual(expect.arrayContaining(rendered));
  });

  it('renders every name it generates — an unused prompt is dead weight', () => {
    expect(renderedNames()).toEqual(promptNames);
  });

  it('keeps the dark-band art on the dark background', () => {
    expect(PROMPTS.contact).toContain('#0b0b0b');
    expect(PROMPTS.contact).not.toContain('#f5f5f5');
  });

  it('locks every light prompt to the page background', () => {
    for (const name of promptNames.filter((n) => n !== 'contact')) {
      expect(PROMPTS[name], name).toContain('#f5f5f5');
    }
  });

  it('forbids text in every prompt — generated lettering is always gibberish', () => {
    for (const name of promptNames) {
      expect(PROMPTS[name], name).toContain('No text, no letters');
    }
  });
});

/* The dark-mode and backdrop stylesheets, asserted as text. Both are plain CSS
 * with no build step between the file and the browser, and both have exactly
 * one failure mode worth a test: a selector that stops matching. jsdom applies
 * no stylesheet, so rendering and reading a computed style would assert
 * nothing — the file's own content is the honest thing to check. */
describe('illustration art in dark mode', () => {
  const css = readFileSync('src/styles/site/illustration.css', 'utf8');

  it('inverts light-ground art under the dark theme', () => {
    expect(css).toMatch(/\[data-theme='dark'\][^{]*picture\[data-art-dark='false'\][^{]*img/);
    expect(css).toMatch(/filter:\s*invert\(1\)\s*hue-rotate\(180deg\)/);
  });

  it('is imported, or it is a file nothing loads', () => {
    expect(readFileSync('src/app/globals.css', 'utf8')).toContain(
      "@import '../styles/site/illustration.css';",
    );
  });

  it('marks exactly one illustration as already dark-ground', () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((entry) => {
        const path = join(dir, entry);
        return statSync(path).isDirectory()
          ? walk(path)
          : path.endsWith('.tsx')
            ? [readFileSync(path, 'utf8')]
            : [];
      });
    const marked = walk('src/components').filter((src) => /\bdarkGround\b/.test(src));
    // illustration.tsx declares the prop; exactly one section passes it.
    expect(marked.filter((src) => !src.includes('IllustrationProps'))).toHaveLength(1);
    // And it is the one generated on #0b0b0b.
    expect(PROMPTS.contact).toContain('#0b0b0b');
  });
});

describe('the page backdrop', () => {
  const css = readFileSync('src/styles/layout/tech-backdrop.css', 'utf8');

  it('is fixed behind the content rather than scrolling as wallpaper', () => {
    expect(css).toMatch(/\.tech-backdrop\s*\{[^}]*position:\s*fixed/);
    expect(css).toMatch(/\.tech-backdrop\s*\{[^}]*z-index:\s*-1/);
  });

  it('draws itself from tokens, so it flips with the theme', () => {
    // check:colors already forbids literals here; this asserts the positive —
    // the pattern is built from theme tokens rather than from `currentColor`
    // or a fixed grey that would survive the gate and still not flip.
    expect(css).toMatch(/var\(--base-border\)/);
    expect(css).toMatch(/var\(--base-info\)/);
  });

  it('is mounted on the page', () => {
    const layout = readFileSync('src/app/[lang]/layout.tsx', 'utf8');
    expect(layout).toMatch(/className="tech-backdrop"/);
    expect(layout).toMatch(/aria-hidden="true"/);
  });

  it('lets the muted bands show it through', () => {
    // An opaque band over a fixed backdrop blanks it. Half the bands carry this
    // class; if it goes back to a flat colour the backdrop is gone from half
    // the page and nothing else would say so. The band's own ground is a mix
    // of surface-muted, so both halves of that mix have to survive — the outer
    // one is what keeps it translucent, the inner one is what makes it grey
    // rather than brand-coloured.
    const band = css.match(/@utility band-muted \{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(band).toMatch(/color-mix\(/);
    expect(band).toMatch(/var\(--base-surface-muted\)/);
    expect(band).toMatch(/transparent/);
    /* `writing` and `capabilities` used to be on this list. Neither was
       removed from the page: capabilities merged into expertise, and losing a
       band flipped the parity of every band after it, so writing became plain
       and analytics became muted. The list names whichever bands are muted
       today — it is not allowed to shrink to nothing, which is what the
       alternation test below is for. */
    for (const file of ['analytics', 'work', 'proof-bar']) {
      const src = readFileSync(`src/components/sections/${file}.tsx`, 'utf8');
      expect(src, file).toContain('band-muted');
      expect(src, file).not.toMatch(/<[Ss]ection[^>]*bg-surface-muted/);
    }
  });

  /* The bands have to ALTERNATE, not merely exist. They shipped once running
     plain-muted-muted-plain-muted-plain-muted-muted-dark, and each of those
     doubles was a place where a reader crossed from one section into the next
     with nothing on screen changing — three and a half screens of one
     uninterrupted grey between "Dữ liệu" and "Ghi chép". Nothing caught it,
     because every individual band was correct. This reads the running order
     out of the page itself rather than taking a hardcoded list, so inserting
     a section in the wrong place fails here instead of on the live site. */
  it('never puts two bands of the same colour next to each other', () => {
    const page = readFileSync('src/app/[lang]/page.tsx', 'utf8');
    const fileFor = new Map(
      [...page.matchAll(/import \{ (\w+) \} from '@\/components\/sections\/([\w-]+)'/g)].map(
        (m) => [m[1]!, m[2]!] as const,
      ),
    );
    const order = [...page.matchAll(/<(\w+) \/>/g)]
      .map((m) => m[1]!)
      .filter((name) => fileFor.has(name));
    // Eight since the capabilities band merged into expertise. A floor, not a
    // count: it is here so an emptied page cannot pass this test vacuously.
    expect(order.length).toBeGreaterThanOrEqual(8);

    const tone = order.map((name) => {
      const src = readFileSync(`src/components/sections/${fileFor.get(name)}.tsx`, 'utf8');
      if (/<Section[^>]*\sdark[\s>]/.test(src)) return 'dark';
      return src.includes('band-muted') ? 'muted' : 'plain';
    });

    const seams = order
      .slice(1)
      .map((name, i) => (tone[i] === tone[i + 1] ? `${order[i]}->${name} (both ${tone[i]})` : null))
      .filter(Boolean);
    expect(seams, `sections sharing a ground with their neighbour: ${seams.join(', ')}`).toEqual(
      [],
    );
  });
});
