/* The ask this file exists to keep: the page's ground shows technology, not a
 * grid of squares — and it keeps showing it after someone edits it.
 *
 * Three things here can break without any other gate noticing. A tint named in
 * a placement with no matching rule in the stylesheet renders in the untinted
 * colour: still a glyph, so nothing fails, just quietly the wrong one. A
 * renamed pattern id leaves `url(#…)` pointing at nothing and the whole layer
 * paints EMPTY — a blank fixed div over the board, and every test still green.
 * And a glyph moved past the edge of its tile is cut in half by the repeat, one
 * screenshot's worth of ugly that no assertion about "a pattern exists" would
 * catch. So each check below holds two lists together rather than asserting
 * that something is present.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { BackdropMotifs, TILE, PLACEMENTS } from '../src/components/site/backdrop-motifs';

const BACKDROP_CSS = readFileSync('src/styles/layout/tech-backdrop.css', 'utf8');
const LAYOUT = readFileSync('src/app/[lang]/layout.tsx', 'utf8');

function svg(): SVGSVGElement {
  const { container } = render(<BackdropMotifs />);
  const node = container.querySelector('svg');
  if (!node) throw new Error('BackdropMotifs rendered no <svg>');
  return node as unknown as SVGSVGElement;
}

describe('the backdrop motif layer', () => {
  it('is mounted inside .tech-backdrop, which is what gives it the mask and the fixed position', () => {
    // Beside the backdrop instead of inside it, the layer scrolls with the page
    // and runs at full strength under body copy. The nesting IS the design.
    expect(LAYOUT).toMatch(
      /<div className="tech-backdrop"[^>]*>\s*(\{\/\*[\s\S]*?\*\/\}\s*)?<BackdropMotifs\s*\/>/,
    );
  });

  it('fills its rect from a pattern that exists in the same document', () => {
    const root = svg();
    const rect = root.querySelector('rect[fill^="url("]');
    expect(rect, 'the layer paints nothing without a filled rect').not.toBeNull();

    const id = /url\(#([^)]+)\)/.exec(rect!.getAttribute('fill')!)?.[1];
    expect(id).toBeTruthy();
    expect(
      root.querySelector(`pattern[id="${id}"]`),
      `no <pattern id="${id}"> to resolve`,
    ).not.toBeNull();
  });

  it('draws every glyph the placements ask for', () => {
    expect(svg().querySelectorAll('.motif')).toHaveLength(PLACEMENTS.length);
  });

  it('names only tints the stylesheet gives a colour to, and defines no tint nothing uses', () => {
    const declared = new Set(
      [...BACKDROP_CSS.matchAll(/^\.motif-([a-z]+)\s*\{/gm)].map((m) => m[1]!),
    );
    // `ink` is the default on `.motif` itself rather than its own rule, so it
    // is declared by being the fallback — every other tint needs a rule.
    const used = new Set(PLACEMENTS.map((p) => p.tint).filter((t) => t !== 'ink'));

    expect([...used].sort()).toEqual([...declared].sort());
  });

  it('keeps every glyph inside its tile, so the repeat never cuts one in half', () => {
    for (const g of svg().querySelectorAll<SVGGElement>('.motif')) {
      const t = g.getAttribute('transform') ?? '';
      const [, tx, ty] = /translate\((-?[\d.]+) (-?[\d.]+)\)/.exec(t)!.map(Number) as number[];
      const scale = Number(/scale\((-?[\d.]+)\)/.exec(t)![1]);

      /* The bound is a RADIUS, not a box. Every placement carries a few degrees
         of rotation, and a radius is the one measure rotation cannot change —
         so this needs no trigonometry and cannot be wrong about the tilt. */
      const reach = Math.max(...points(g).map(([x, y]) => Math.hypot(x, y))) * scale;

      const where = `${g.getAttribute('class')} at ${tx},${ty}`;
      expect(tx! - reach, `${where} crosses the left edge`).toBeGreaterThanOrEqual(0);
      expect(tx! + reach, `${where} crosses the right edge`).toBeLessThanOrEqual(TILE);
      expect(ty! - reach, `${where} crosses the top edge`).toBeGreaterThanOrEqual(0);
      expect(ty! + reach, `${where} crosses the bottom edge`).toBeLessThanOrEqual(TILE);
    }
  });
});

/** Every point a glyph draws, in its own coordinates.
 *
 *  Curve control points are counted as if they were on the curve. They are not
 *  — a Bézier stays inside its control hull — so this OVERSTATES how far a
 *  curve reaches. That is the safe direction for a bounds check: it can ask a
 *  glyph to sit further from the edge than it strictly needs to, and can never
 *  wave through one that actually crosses. */
function points(g: SVGGElement): [number, number][] {
  const out: [number, number][] = [];
  const n = (el: Element, name: string) => Number(el.getAttribute(name) ?? 0);

  for (const el of g.querySelectorAll('*')) {
    switch (el.tagName.toLowerCase()) {
      case 'rect': {
        const [x, y, w, h] = [n(el, 'x'), n(el, 'y'), n(el, 'width'), n(el, 'height')];
        out.push([x, y], [x + w, y], [x, y + h], [x + w, y + h]);
        break;
      }
      case 'circle': {
        const [cx, cy, r] = [n(el, 'cx'), n(el, 'cy'), n(el, 'r')];
        out.push([cx - r, cy - r], [cx + r, cy - r], [cx - r, cy + r], [cx + r, cy + r]);
        break;
      }
      case 'ellipse': {
        const [cx, cy, rx, ry] = [n(el, 'cx'), n(el, 'cy'), n(el, 'rx'), n(el, 'ry')];
        out.push([cx - rx, cy - ry], [cx + rx, cy - ry], [cx - rx, cy + ry], [cx + rx, cy + ry]);
        break;
      }
      case 'path':
        out.push(...walk(el.getAttribute('d') ?? ''));
        break;
    }
  }
  return out;
}

/** Walks a path `d`, carrying the current point so relative commands land where
 *  they actually land. Taking the numbers out of a `d` with one regex would
 *  read the deltas of a relative curve as absolute coordinates and report a
 *  shape a fraction of its real size — which is the failure mode this check
 *  exists to catch, so it cannot be the way this check measures. */
function walk(d: string): [number, number][] {
  const out: [number, number][] = [];
  let [x, y] = [0, 0];

  for (const [, letter, body] of d.matchAll(/([MmLlHhVvCcZz])([^MmLlHhVvCcZz]*)/g)) {
    const args = (body!.match(/-?[\d.]+/g) ?? []).map(Number);
    const rel = letter! === letter!.toLowerCase();

    switch (letter!.toUpperCase()) {
      case 'M':
      case 'L':
        for (let i = 0; i + 1 < args.length; i += 2) {
          [x, y] = rel ? [x + args[i]!, y + args[i + 1]!] : [args[i]!, args[i + 1]!];
          out.push([x, y]);
        }
        break;
      case 'H':
        for (const a of args) {
          x = rel ? x + a : a;
          out.push([x, y]);
        }
        break;
      case 'V':
        for (const a of args) {
          y = rel ? y + a : a;
          out.push([x, y]);
        }
        break;
      case 'C':
        for (let i = 0; i + 5 < args.length; i += 6) {
          const [ox, oy] = rel ? [x, y] : [0, 0];
          out.push([ox + args[i]!, oy + args[i + 1]!], [ox + args[i + 2]!, oy + args[i + 3]!]);
          [x, y] = [ox + args[i + 4]!, oy + args[i + 5]!];
          out.push([x, y]);
        }
        break;
    }
  }
  return out;
}
