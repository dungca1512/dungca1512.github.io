// tests/constellation.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import postcss, { type Rule, type Declaration } from 'postcss';
import { Constellation } from '@/components/motion/constellation';

const BACKDROP_CSS = readFileSync('src/styles/layout/tech-backdrop.css', 'utf8');
const LAYOUT = readFileSync('src/app/[lang]/layout.tsx', 'utf8');

/* jsdom has no canvas. `getContext('2d')` returns null there, so every test
   hands the component a recording context and asserts on what was drawn. */
function mockContext() {
  return {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    globalAlpha: 1,
    lineWidth: 1,
    strokeStyle: '',
    fillStyle: '',
  };
}

function mediaMatching(...matching: string[]) {
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

let ctx: ReturnType<typeof mockContext>;

beforeEach(() => {
  ctx = mockContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  );
  // Never let a frame loop actually run under jsdom.
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete document.documentElement.dataset.theme;
});

describe('Constellation', () => {
  it('renders one aria-hidden canvas and nothing else', () => {
    const { container } = render(<Constellation />);
    expect(container.children).toHaveLength(1);
    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveClass('constellation');
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
  });

  it('starts a frame loop when motion is allowed', () => {
    render(<Constellation />);
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it('under reduced motion draws exactly one frame and schedules none', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(mediaMatching('prefers-reduced-motion'));
    render(<Constellation />);
    expect(ctx.clearRect).toHaveBeenCalledTimes(1);
    expect(ctx.arc.mock.calls.length).toBeGreaterThanOrEqual(24);
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('sizes the buffer to the viewport times a capped device pixel ratio', () => {
    Object.defineProperty(window, 'devicePixelRatio', { value: 3, configurable: true });
    const { container } = render(<Constellation />);
    const canvas = container.querySelector('canvas')!;
    expect(canvas.width).toBe(window.innerWidth * 2);
    expect(canvas.height).toBe(window.innerHeight * 2);
    expect(ctx.setTransform).toHaveBeenLastCalledWith(2, 0, 0, 2, 0, 0);
  });

  it('re-reads the colour tokens when the theme attribute changes', async () => {
    const spy = vi.spyOn(window, 'getComputedStyle');
    render(<Constellation />);
    const before = spy.mock.calls.length;
    document.documentElement.dataset.theme = 'dark';
    await new Promise((r) => setTimeout(r, 0)); // MutationObserver delivers asynchronously
    expect(spy.mock.calls.length).toBeGreaterThan(before);
    expect(ctx.createLinearGradient.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('draws the whole field again after a resize, once the debounce has passed', () => {
    // Only the debounce timer is faked: faking requestAnimationFrame too would
    // let advanceTimersByTime fire frames and count them as draws.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    render(<Constellation />);
    const drawsBefore = ctx.clearRect.mock.calls.length;
    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(119);
    expect(ctx.clearRect.mock.calls.length).toBe(drawsBefore);
    vi.advanceTimersByTime(2);
    expect(ctx.clearRect.mock.calls.length).toBe(drawsBefore + 1);
    vi.useRealTimers();
  });

  it('cancels the frame and stops listening on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<Constellation />);
    unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
    expect(remove.mock.calls.map((c) => c[0])).toContain('resize');
  });

  it('survives a runtime with no 2D context', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(() => render(<Constellation />)).not.toThrow();
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });
});

describe('the backdrop stylesheet and layout', () => {
  const root = postcss.parse(BACKDROP_CSS);
  const rules = (selector: string) => {
    const out: Rule[] = [];
    root.walkRules((r) => {
      if (r.selectors.includes(selector)) out.push(r);
    });
    return out;
  };

  it('no longer styles the motif layer', () => {
    expect(rules('.tech-motifs')).toHaveLength(0);
    expect(rules('.motif')).toHaveLength(0);
  });

  it('gives the canvas a lower opacity in light than in dark', () => {
    const light = rules('.constellation').find((r) => r.parent === root);
    const dark = rules("[data-theme='dark'] .constellation")[0];
    // `Rule['nodes']` is a union of postcss node types; `.find()` can't narrow it from
    // the predicate, so the declaration is cast explicitly after the `type` check above.
    const opacity = (r: Rule | undefined) =>
      Number(
        (r?.nodes.find((n) => n.type === 'decl' && n.prop === 'opacity') as Declaration | undefined)
          ?.value,
      );
    expect(opacity(light)).toBeGreaterThan(0);
    expect(opacity(dark)).toBeGreaterThan(opacity(light));
    expect(opacity(dark)).toBeLessThanOrEqual(1);
  });

  it('is mounted inside .tech-backdrop, where the motifs were', () => {
    expect(LAYOUT).toMatch(/className="tech-backdrop"[^>]*>\s*<Constellation \/>\s*<\/div>/);
    expect(LAYOUT).not.toContain('BackdropMotifs');
  });
});
