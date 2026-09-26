import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import postcss from 'postcss';
import tailwindcssPostcss from '@tailwindcss/postcss';

const GLOBALS_CSS = resolve('src/app/globals.css');

/**
 * Compiles globals.css through the real Tailwind v4 PostCSS pipeline — the
 * same plugin `next build` runs — and returns the generated CSS for a given
 * set of candidate class names.
 *
 * This is the only thing that actually proves the `@theme inline` block maps
 * to Tailwind's generated colour utilities. Grepping globals.css for
 * `--color-surface` only proves the token is spelled correctly in the source;
 * it says nothing about whether Tailwind picked it up. Tailwind 4 only emits
 * a utility for a class like `bg-surface` if a matching `--color-surface`
 * token exists in the theme when the CSS is built — if the mapping is
 * missing, the class generates NO rule at all, with no error anywhere. A
 * source grep cannot see that failure mode; only compiling can.
 */
async function compileFor(classNames: string[]): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), 'tokens-test-'));
  try {
    // A file Tailwind's automatic content scanner can see, carrying the
    // candidate class names as plain text — this is the "virtual source".
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

describe('the @theme inline token surface reaches the built CSS', () => {
  const REPRESENTATIVE_CLASSES = [
    'bg-surface',
    'text-muted-foreground',
    'border-border',
    'shadow-raised',
  ];

  it('compiles bg-surface, text-muted-foreground, border-border and shadow-raised to real rules', async () => {
    const css = await compileFor(REPRESENTATIVE_CLASSES);

    // Each assertion checks BOTH that the selector exists at all (a missing
    // `--color-*` mapping means the class produces no rule whatsoever, so the
    // whole match fails) and that it resolves to the right `--base-*` token
    // (a wrong mapping would still produce a rule, just pointing at nothing).
    expect(css, 'bg-surface must compile to a background-color rule').toMatch(
      /\.bg-surface\s*\{[^}]*background-color:\s*var\(--base-surface\)/,
    );
    expect(css, 'text-muted-foreground must compile to a color rule').toMatch(
      /\.text-muted-foreground\s*\{[^}]*color:\s*var\(--base-muted-foreground\)/,
    );
    expect(css, 'border-border must compile to a border-color rule').toMatch(
      /\.border-border\s*\{[^}]*border-color:\s*var\(--base-border\)/,
    );
    expect(css, 'shadow-raised must compile to a box-shadow rule').toMatch(
      /\.shadow-raised\s*\{[^}]*--tw-shadow:\s*var\(--base-shadow-raised\)/,
    );
  });

  it('also reaches the AA-safe ink colours and the wide breakpoint / content containers', async () => {
    const css = await compileFor([
      'text-ink-primary',
      'text-ink-accent',
      'text-ink-info',
      'text-ink-success',
      'max-w-content',
      'max-w-prose',
    ]);

    expect(css).toMatch(/\.text-ink-primary\s*\{[^}]*color:\s*var\(--site-ink-primary\)/);
    expect(css).toMatch(/\.text-ink-accent\s*\{[^}]*color:\s*var\(--site-ink-accent\)/);
    expect(css).toMatch(/\.text-ink-info\s*\{[^}]*color:\s*var\(--site-ink-info\)/);
    expect(css).toMatch(/\.text-ink-success\s*\{[^}]*color:\s*var\(--site-ink-success\)/);
    expect(css).toMatch(/\.max-w-content\s*\{[^}]*max-width:\s*var\(--container-content\)/);
    // Tailwind ships its own `--max-width-prose: 65ch`, which `max-w-prose`
    // would use instead of this project's --container-prose token unless
    // globals.css also bridges `--max-width-prose` to it (see globals.css).
    // The utility itself always reads the `--max-width-*` variable, so the
    // rule references `--max-width-prose`, which in turn resolves to
    // `--container-prose`.
    expect(css).toMatch(/\.max-w-prose\s*\{[^}]*max-width:\s*var\(--max-width-prose\)/);
    expect(css).toMatch(/--max-width-prose:\s*var\(--container-prose\)/);
  });

  it('sorts the wide breakpoint between md and lg, so wide: beats sm: and md:', async () => {
    // Later rules win, so Tailwind has to order the media queries by width.
    // It cannot compare px with rem: `wide` in px was emitted ahead of every
    // default breakpoint, and `sm:grid-cols-2 wide:grid-cols-3` stayed on two
    // columns at every width.
    const css = await compileFor([
      'sm:grid-cols-2',
      'md:grid-cols-3',
      'wide:grid-cols-4',
      'lg:grid-cols-5',
    ]);
    const at = (cls: string) => css.indexOf(`.${cls.replace(':', String.raw`\:`)}`);
    const order = ['sm:grid-cols-2', 'md:grid-cols-3', 'wide:grid-cols-4', 'lg:grid-cols-5'].map(
      at,
    );

    expect(
      order.every((i) => i >= 0),
      'every probe class compiles to a rule',
    ).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('compiles all five duration-* utilities and the three custom easings', async () => {
    // Tailwind 4's `duration-*` utility reads `--transition-duration-*`, not
    // `--duration-*`. If globals.css declared the wrong theme key, none of
    // these five classes would produce a rule at all — no build error, no
    // failing type check, just an absent transition-duration declaration.
    const css = await compileFor([
      'duration-instant',
      'duration-fast',
      'duration-base',
      'duration-slow',
      'duration-hero',
      'ease-out-soft',
      'ease-spring',
      'ease-out-quint',
    ]);

    expect(css, 'duration-instant must compile').toMatch(
      /\.duration-instant\s*\{[^}]*transition-duration:\s*var\(--transition-duration-instant\)/,
    );
    expect(css, 'duration-fast must compile').toMatch(
      /\.duration-fast\s*\{[^}]*transition-duration:\s*var\(--transition-duration-fast\)/,
    );
    expect(css, 'duration-base must compile').toMatch(
      /\.duration-base\s*\{[^}]*transition-duration:\s*var\(--transition-duration-base\)/,
    );
    expect(css, 'duration-slow must compile').toMatch(
      /\.duration-slow\s*\{[^}]*transition-duration:\s*var\(--transition-duration-slow\)/,
    );
    expect(css, 'duration-hero must compile').toMatch(
      /\.duration-hero\s*\{[^}]*transition-duration:\s*var\(--transition-duration-hero\)/,
    );
    expect(css, 'ease-out-soft must compile').toMatch(
      /\.ease-out-soft\s*\{[^}]*transition-timing-function:\s*var\(--ease-out-soft\)/,
    );
    expect(css, 'ease-spring must compile').toMatch(
      /\.ease-spring\s*\{[^}]*transition-timing-function:\s*var\(--ease-spring\)/,
    );
    // wigin.ai's reveal curve, cubic-bezier(0.22, 1, 0.36, 1): a quint-ish
    // ease-out that lands without overshoot. Every on-enter reveal and
    // drawing on the site runs on it since 2026-09-26.
    expect(css, 'ease-out-quint must compile').toMatch(
      /\.ease-out-quint\s*\{[^}]*transition-timing-function:\s*var\(--ease-out-quint\)/,
    );
    expect(css).toMatch(/--ease-out-quint:\s*cubic-bezier\(0\.22, 1, 0\.36, 1\)/);
  });

  it('aliases the short --duration-* spelling onto --transition-duration-* for raw animation shorthands', async () => {
    // Tasks 6, 7, 9, 10 and 11 write `var(--duration-slow)` directly inside
    // `animation:` shorthands rather than through a Tailwind utility class.
    // Without the :root alias block, that reference is undefined, which
    // makes the whole `animation` shorthand invalid at computed-value time
    // and silently resolves it to `none` — no build error, no failing type
    // check, the reveal animations simply never fire.
    const css = await compileFor([]);
    expect(css, '--duration-slow must resolve to the canonical transition-duration token').toMatch(
      /--duration-slow:\s*var\(--transition-duration-slow\)/,
    );
    expect(
      css,
      '--duration-instant must resolve to the canonical transition-duration token',
    ).toMatch(/--duration-instant:\s*var\(--transition-duration-instant\)/);
    expect(css, '--duration-fast must resolve to the canonical transition-duration token').toMatch(
      /--duration-fast:\s*var\(--transition-duration-fast\)/,
    );
    expect(css, '--duration-base must resolve to the canonical transition-duration token').toMatch(
      /--duration-base:\s*var\(--transition-duration-base\)/,
    );
    expect(css, '--duration-hero must resolve to the canonical transition-duration token').toMatch(
      /--duration-hero:\s*var\(--transition-duration-hero\)/,
    );
  });
});
