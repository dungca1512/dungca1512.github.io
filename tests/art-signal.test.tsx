/* The packets that run along the drawn art's wires. Asked for on 2026-09-26:
 * "chạy liên tục như thể nó đang nhận tín hiệu từ ngoài vào chip như
 * streaming" — a continuous stream INTO the chip, so the direction is a
 * requirement and not a detail: a dash pattern moves towards a path's END,
 * which means every signal path has to be drawn from the outside world in to
 * the chip's body. That geometry is what most of this file checks, because
 * a leg written the other way round compiles, animates, and streams the
 * wrong way. */
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import { TechArt } from '@/components/site/tech-art';

/* The chip's body, in tech-art.tsx's 320×200 viewBox. */
const BODY = { left: 110, right: 210, top: 46, bottom: 154 };

const signalsIn = (variant: 3 | 5 | 10, still = false) => {
  const { container } = render(<TechArt variant={variant} accent="info" still={still} />);
  return Array.from(container.querySelectorAll<SVGPathElement>('path.art-signal'));
};

describe('the signal into the chip', () => {
  it('runs one packet stream down each of the sixteen legs', () => {
    expect(signalsIn(5)).toHaveLength(16);
  });

  it('draws every leg from the outside in, so the stream ENTERS the chip', () => {
    for (const path of signalsIn(5)) {
      const d = path.getAttribute('d') ?? '';
      const m = /^M(\d+) (\d+)([HV])(\d+)$/.exec(d);
      expect(m, `${d} is not a single straight leg`).not.toBeNull();
      const [, sx, sy, axis, end] = m!;
      const x = Number(sx);
      const y = Number(sy);
      const outside = x < BODY.left || x > BODY.right || y < BODY.top || y > BODY.bottom;
      expect(outside, `${d} starts inside the chip`).toBe(true);
      const landsOnEdge =
        axis === 'V'
          ? Number(end) === BODY.top || Number(end) === BODY.bottom
          : Number(end) === BODY.left || Number(end) === BODY.right;
      expect(landsOnEdge, `${d} does not end on the chip's edge`).toBe(true);
    }
  });

  it('staggers the legs so the packets do not march in step', () => {
    const phases = new Set(signalsIn(5).map((p) => p.style.getPropertyValue('--i')));
    expect(phases.size).toBeGreaterThan(1);
  });

  it('keeps streaming on `still` art — the stream is the point, the drift was the noise', () => {
    const { container } = render(<TechArt variant={5} accent="info" still />);
    expect(container.querySelectorAll('.art-pulse')).toHaveLength(0);
    expect(container.querySelectorAll('.art-signal')).toHaveLength(16);
  });

  it('flows along the pipeline and into the stream too', () => {
    expect(signalsIn(3).length).toBeGreaterThan(0);
    expect(signalsIn(10).length).toBeGreaterThan(0);
  });
});

describe('the signal stylesheet', () => {
  const css = readFileSync('src/styles/motion/art.css', 'utf8');
  const root = postcss.parse(css);
  const decls = (selector: string) => {
    const out: Record<string, string> = {};
    root.walkRules(selector, (rule) =>
      rule.walkDecls((d) => {
        out[d.prop] = d.value;
      }),
    );
    return out;
  };

  it('is a short dash on a long gap, moving forward without end, on a linear clock', () => {
    const signal = decls('.art-signal');
    expect(signal['stroke-dasharray']).toMatch(/^\d+ \d+$/);
    const [dash, gap] = signal['stroke-dasharray'].split(' ').map(Number);
    expect(gap).toBeGreaterThan(dash);
    expect(signal.animation).toMatch(/^site-art-signal [\d.]+s linear infinite$/);
    // Negative delay, so every leg is already mid-stream at first paint
    // instead of all sixteen waiting their turn from empty.
    expect(signal['animation-delay']).toMatch(/calc\(var\(--i, 0\) \* -[\d.]+s\)/);
    let to: string | undefined;
    root.walkAtRules('keyframes', (at) => {
      if (at.params !== 'site-art-signal') return;
      at.walkRules('to', (r) =>
        r.walkDecls('stroke-dashoffset', (d) => {
          to = d.value;
        }),
      );
    });
    // Forward means a NEGATIVE offset, and one full period (dash + gap) so
    // the loop closes on itself with no jump.
    expect(to).toBe(String(-(dash + gap)));
  });

  it('is gone, not merely stopped, under prefers-reduced-motion', () => {
    const reduced = readFileSync('src/styles/motion-reduced.css', 'utf8');
    const block = reduced.slice(reduced.indexOf('prefers-reduced-motion'));
    expect(block).toMatch(/\.art-signal\s*\{[^}]*animation:\s*none\s*!important/);
    // A frozen dash pattern would read as a broken wire.
    expect(block).toMatch(/\.art-signal\s*\{[^}]*opacity:\s*0\s*!important/);
  });
});
