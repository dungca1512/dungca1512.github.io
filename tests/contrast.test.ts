import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/app/globals.css', 'utf8');

/**
 * Expands 3-digit shorthand hex (`#fff`) to 6-digit (`ffffff`). Without this,
 * `parseInt('fff', 16)` reads as `0x000fff` — not white but a near-black
 * blue — and every ratio computed against a shorthand colour is silently
 * wrong. This test mixes against literal `'#000'` and `'#fff'` below, so the
 * expansion is load-bearing, not cosmetic.
 */
function expandHex(hex: string): string {
  const h = hex.replace('#', '');
  return h.length === 3
    ? h
        .split('')
        .map((c) => c + c)
        .join('')
    : h;
}

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const n = parseInt(expandHex(hex), 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function ratio(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Mixes `pct`% of `colour` into `base`, the sRGB way color-mix does it. */
function mix(colour: string, base: string, pct: number): string {
  const parse = (h: string) => {
    const n = parseInt(expandHex(h), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [c, b] = [parse(colour), parse(base)];
  const out = c.map((v, i) => Math.round((v * pct + b[i] * (100 - pct)) / 100));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Pulls a `--custom-property: <value>;` declaration's raw value out of a
 * slice of CSS text. Used so the constants this file checks against are read
 * from globals.css rather than hardcoded a second time — a hardcoded copy is
 * exactly how the bug this replaces happened: this file used to assert
 * against '#fff' for the dark foreground when the CSS actually declares
 * '#ededed'.
 */
function readCustomProperty(name: string, source: string = css): string {
  const match = source.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`${name} not found`);
  return match[1].trim();
}

/** Pulls out the `[data-theme='dark'] { ... }` block's raw contents. */
function darkThemeBlock(): string {
  const match = css.match(/\[data-theme='dark'\]\s*\{([^}]*)\}/s);
  if (!match) throw new Error(`[data-theme='dark'] block not found`);
  return match[1];
}

/**
 * Follows a `var(--x)` chain to the literal at the end of it. `--base-background`
 * does not hold a hex; it holds `var(--base-palette-neutral-50)`, and the number
 * this file needs is the one that variable resolves to.
 */
function resolveColour(name: string, source: string = css): string {
  let value = readCustomProperty(name, source);
  for (let hops = 0; hops < 8; hops++) {
    const ref = value.match(/^var\(\s*(--[\w-]+)\s*\)$/);
    if (!ref) return value;
    // Only the first hop may come from the dark block; a palette entry it
    // points at is declared once, on :root.
    value = readCustomProperty(ref[1], css);
  }
  throw new Error(`${name} does not resolve to a literal in 8 hops`);
}

// Every one of these is read out of globals.css, not copied. Hardcoding them
// is not a shortcut, it is the bug: a test holding its own copy of a colour
// keeps measuring the OLD colour after someone re-tunes the palette, and stays
// green while the shipped site fails AA. This file already learned that once
// with the dark foreground; these four were the same mistake, unfixed.
const ACCENT = resolveColour('--base-accent');
const INFO = resolveColour('--base-info');
const LIGHT_BG = resolveColour('--base-background');
const DARK_BG = resolveColour('--base-background', darkThemeBlock());
// Since 2026-09-26 the two accents FLIP with the theme (wigin's blue and cyan
// on navy in the dark; the teal and mid blue stay on the light page), so the
// dark ratios below have to be measured with the dark theme's own pair.
// Resolved through the dark block first, then :root, like the background.
const DARK_ACCENT = resolveColour('--base-accent', darkThemeBlock());
const DARK_INFO = resolveColour('--base-info', darkThemeBlock());
const MIX = 68;

describe('the colours this file measures', () => {
  it('reads six literal hex values out of globals.css', () => {
    // If a rename makes one of the lookups above return something that is not
    // a colour, every ratio below becomes nonsense that still compares fine.
    for (const [name, value] of Object.entries({
      ACCENT,
      INFO,
      LIGHT_BG,
      DARK_BG,
      DARK_ACCENT,
      DARK_INFO,
    })) {
      expect(value, `${name} did not resolve to a hex literal`).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    }
    expect(LIGHT_BG).not.toBe(DARK_BG);
    expect(DARK_ACCENT).not.toBe(ACCENT);
    expect(DARK_INFO).not.toBe(INFO);
  });
});
// Read straight out of globals.css's Step C block rather than hardcoded, so
// this test cannot drift from the CSS it is meant to be checking.
const DARK_FOREGROUND = readCustomProperty('--base-foreground', darkThemeBlock());

describe('the accent colours', () => {
  it('fail AA when used raw — which is why the ink layer exists', () => {
    expect(ratio(ACCENT, LIGHT_BG)).toBeLessThan(4.5);
    expect(ratio(INFO, LIGHT_BG)).toBeLessThan(4.5);
    // The dark blue is the one raw accent that fails in its own theme too;
    // wigin's cyan is bright enough to pass raw on navy, and is measured
    // anyway below once inked.
    expect(ratio(DARK_INFO, DARK_BG)).toBeLessThan(4.5);
  });

  it('pass AA once mixed 68% with the foreground, in BOTH themes', () => {
    expect(ratio(mix(ACCENT, '#000', MIX), LIGHT_BG)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(mix(INFO, '#000', MIX), LIGHT_BG)).toBeGreaterThanOrEqual(4.5);
    // The dark theme's foreground is off-white, not pure white — read out of
    // globals.css above rather than hardcoded. Measured with the dark pair on
    // the navy ground: 13.24:1 and 6.18:1.
    expect(ratio(mix(DARK_ACCENT, DARK_FOREGROUND, MIX), DARK_BG)).toBeCloseTo(13.24, 1);
    expect(ratio(mix(DARK_INFO, DARK_FOREGROUND, MIX), DARK_BG)).toBeCloseTo(6.18, 1);
    expect(ratio(mix(DARK_ACCENT, DARK_FOREGROUND, MIX), DARK_BG)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(mix(DARK_INFO, DARK_FOREGROUND, MIX), DARK_BG)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('--base-primary (the filled-button / ::selection ground)', () => {
  it('mixes the brand hue toward black at the percentage declared in globals.css, read out of the CSS itself', () => {
    // Read the mix formula's percentage and both endpoint colours out of the
    // CSS rather than hardcoding them a second time here — a hardcoded copy
    // is exactly the failure mode M4 fixed for the dark foreground.
    const primaryBlock = css.match(
      /--base-primary:\s*color-mix\(\s*in srgb,\s*var\(--base-palette-brand-500\)\s*(\d+)%,\s*var\(--base-palette-neutral-1000\)\s*\)/,
    );
    expect(
      primaryBlock,
      '--base-primary must be a color-mix of brand-500 toward neutral-1000',
    ).not.toBeNull();
    const pct = Number(primaryBlock![1]);

    // --base-palette-brand-500 is itself overridden to --base-palette-blue-500
    // in Step D, so the brand hue actually mixed at runtime is blue, not the
    // raw indigo declared in Step A.
    const brand500 = readCustomProperty('--base-palette-blue-500');
    const neutral1000 = readCustomProperty('--base-palette-neutral-1000');
    const white = readCustomProperty('--base-palette-neutral-0');

    const mixed = mix(brand500, neutral1000, pct);

    expect(
      ratio(white, mixed),
      'white on --base-primary must clear AA (4.5:1)',
    ).toBeGreaterThanOrEqual(4.5);
    expect(ratio(white, mixed)).toBeCloseTo(5.33, 1);
    expect(ratio(LIGHT_BG, mixed)).toBeCloseTo(4.89, 1);
  });
});

describe('globals.css', () => {
  it('declares the ink colours under BOTH :root and [data-theme="dark"]', () => {
    // A custom property is substituted where it is DECLARED. Declaring the mix
    // only on :root means the dark theme silently keeps the light foreground,
    // and the text goes unreadable with no error anywhere.
    const block = css.match(/:root,\s*\[data-theme='dark'\]\s*\{[^}]*--site-ink-primary/s);
    expect(block, '--site-ink-primary must be declared for both themes at once').not.toBeNull();
  });

  it('uses @theme inline for the ink colours, not plain @theme', () => {
    // Plain @theme copies the value once at build time, so switching
    // data-theme would do nothing.
    expect(css).toMatch(/@theme inline\s*\{[^}]*--color-ink-primary/s);
  });

  it('redirects the brand hue to blue in both themes', () => {
    expect(css).toMatch(/--base-palette-brand-500:\s*var\(--base-palette-blue-500\)/);
  });
});
