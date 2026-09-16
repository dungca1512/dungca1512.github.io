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

const ACCENT = '#40a69f';
const INFO = '#2b7fd4';
const LIGHT_BG = '#f5f5f5';
const DARK_BG = '#0b0b0b';
const MIX = 68;

describe('the accent colours', () => {
  it('fail AA when used raw — which is why the ink layer exists', () => {
    expect(ratio(ACCENT, LIGHT_BG)).toBeLessThan(4.5);
    expect(ratio(INFO, LIGHT_BG)).toBeLessThan(4.5);
  });

  it('pass AA once mixed 68% with the foreground, in BOTH themes', () => {
    expect(ratio(mix(ACCENT, '#000', MIX), LIGHT_BG)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(mix(INFO, '#000', MIX), LIGHT_BG)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(mix(ACCENT, '#fff', MIX), DARK_BG)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(mix(INFO, '#fff', MIX), DARK_BG)).toBeGreaterThanOrEqual(4.5);
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
