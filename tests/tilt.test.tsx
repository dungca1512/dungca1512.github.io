import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import postcss, { type AtRule, type Declaration } from 'postcss';
import { Tilt } from '@/components/motion/tilt';

/* jsdom 25 has no PointerEvent, and testing-library's fireEvent.pointerMove
   falls back to a bare Event that drops clientX. A MouseEvent carrying the
   pointer event's NAME reaches a `pointermove` listener with its coordinates
   intact, which is all the component reads. */
function pointer(el: Element, type: 'pointerenter' | 'pointermove' | 'pointerleave', x = 0, y = 0) {
  el.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }));
}

const WORK_CSS = readFileSync('src/styles/sections/work.css', 'utf8');
const REDUCED_CSS = readFileSync('src/styles/motion-reduced.css', 'utf8');
const WORK_TSX = readFileSync('src/components/sections/work.tsx', 'utf8');

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function media(...matching: string[]) {
  return (query: string) =>
    ({
      matches: matching.some((m) => query.includes(m)),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

function mount() {
  const { container } = render(
    <Tilt className="extra">
      <img alt="" />
    </Tilt>,
  );
  const el = container.firstElementChild as HTMLElement;
  // jsdom lays nothing out; give the wrapper a 200×100 box at the origin.
  el.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0 }) as DOMRect;
  return el;
}

describe('Tilt', () => {
  it('wraps its child in a .tilt div and keeps the caller class', () => {
    const el = mount();
    expect(el).toHaveClass('tilt');
    expect(el).toHaveClass('extra');
    expect(el.querySelector('img')).not.toBeNull();
  });

  it('writes the pointer position as two variables in [-0.5, 0.5]', () => {
    const el = mount();
    // The component measures the box on `pointerenter`, not on every move
    // (see tilt.tsx) — the mocked rect only takes effect once this fires.
    pointer(el, 'pointerenter');
    pointer(el, 'pointermove', 100, 50);
    expect(el.style.getPropertyValue('--tilt-x')).toBe('0.000');
    expect(el.style.getPropertyValue('--tilt-y')).toBe('0.000');
    expect(el.dataset.tilting).toBe('true');
    pointer(el, 'pointermove', 200, 0);
    expect(el.style.getPropertyValue('--tilt-x')).toBe('0.500');
    expect(el.style.getPropertyValue('--tilt-y')).toBe('-0.500');
  });

  it('returns to flat, softly, when the pointer leaves', () => {
    const el = mount();
    pointer(el, 'pointermove', 200, 100);
    pointer(el, 'pointerleave');
    expect(el.style.getPropertyValue('--tilt-x')).toBe('0');
    expect(el.style.getPropertyValue('--tilt-y')).toBe('0');
    expect(el.dataset.tilting).toBeUndefined();
  });

  it('attaches nothing on a touch device', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(media('pointer: coarse'));
    const el = mount();
    pointer(el, 'pointermove', 200, 100);
    expect(el.style.getPropertyValue('--tilt-x')).toBe('');
  });

  it('attaches nothing under reduced motion', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(media('prefers-reduced-motion'));
    const el = mount();
    pointer(el, 'pointermove', 200, 100);
    expect(el.style.getPropertyValue('--tilt-x')).toBe('');
  });

  it('is what wraps the case-study illustration', () => {
    expect(WORK_TSX).toMatch(/<Tilt[^>]*>\s*<Illustration\s+name="work"/);
  });
});

describe('Tilt stylesheet', () => {
  const decls = (css: string, selector: string, reducedOnly = false) => {
    const out: Declaration[] = [];
    const root = postcss.parse(css);
    root.walkRules((r) => {
      if (!r.selectors.includes(selector)) return;
      if (reducedOnly) {
        const media = r.parent;
        if (
          media?.type !== 'atrule' ||
          !/prefers-reduced-motion:\s*reduce/.test((media as postcss.AtRule).params)
        )
          return;
      }
      r.walkDecls((d) => {
        out.push(d);
      });
    });
    return out;
  };

  /** True if `d` sits anywhere inside an `@media (hover: hover) …` at-rule —
   *  mirrors `insideSupports` in tests/expertise-hub.test.tsx. */
  function insideHoverMedia(d: Declaration): boolean {
    for (let n: postcss.Container | undefined = d.parent; n; n = n.parent as postcss.Container) {
      if (
        n.type === 'atrule' &&
        (n as AtRule).name === 'media' &&
        /hover:\s*hover/.test((n as AtRule).params)
      )
        return true;
    }
    return false;
  }

  it('moves only transform, from the two variables, with a soft return and a tight follow, only for a fine pointer with hover', () => {
    const rest = decls(WORK_CSS, '.tilt');
    const transform = rest.find((d) => d.prop === 'transform')!;
    expect(transform.value).toContain('var(--tilt-x, 0)');
    expect(transform.value).toContain('var(--tilt-y, 0)');
    expect(transform.value).toMatch(/perspective\(/);
    expect(insideHoverMedia(transform)).toBe(true);
    const transition = rest.find((d) => d.prop === 'transition')!;
    expect(transition.value).toMatch(/^transform\b/);
    expect(transition.value).not.toContain(',');
    expect(insideHoverMedia(transition)).toBe(true);
    const follow = decls(WORK_CSS, ".tilt[data-tilting='true']");
    expect(follow.some((d) => d.prop === 'transition-duration')).toBe(true);
    expect(follow.every((d) => insideHoverMedia(d))).toBe(true);
  });

  it('is flat under reduced motion', () => {
    const r = decls(REDUCED_CSS, '.tilt', true);
    expect(r.some((d) => d.prop === 'transform' && d.value === 'none' && d.important)).toBe(true);
    expect(r.some((d) => d.prop === 'transition' && d.value === 'none' && d.important)).toBe(true);
  });
});
