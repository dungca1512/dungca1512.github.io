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

// jsdom reports `clientWidth`/`clientHeight` as 0 for every element.
// `resize()` now reads the canvas's own box (§A of the final-fix brief), so
// the suite needs a non-zero default; individual tests reassign these to
// exercise the zero-box and resize paths.
let mockClientWidth = 1024;
let mockClientHeight = 768;

beforeEach(() => {
  ctx = mockContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  );
  // Never let a frame loop actually run under jsdom.
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  mockClientWidth = 1024;
  mockClientHeight = 768;
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => mockClientWidth,
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => mockClientHeight,
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete document.documentElement.dataset.theme;
  // Hand the prototype back to jsdom's own (always-0) accessor.
  delete (HTMLCanvasElement.prototype as { clientWidth?: number }).clientWidth;
  delete (HTMLCanvasElement.prototype as { clientHeight?: number }).clientHeight;
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

  it('sizes the buffer to its own box times a capped device pixel ratio', () => {
    Object.defineProperty(window, 'devicePixelRatio', { value: 3, configurable: true });
    const { container } = render(<Constellation />);
    const canvas = container.querySelector('canvas')!;
    expect(canvas.width).toBe(1024 * 2);
    expect(canvas.height).toBe(768 * 2);
    expect(ctx.setTransform).toHaveBeenLastCalledWith(2, 0, 0, 2, 0, 0);
  });

  it('stops the loop and draws nothing when its box is zero', () => {
    mockClientWidth = 0;
    mockClientHeight = 0;
    render(<Constellation />);
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    expect(ctx.clearRect).not.toHaveBeenCalled();
  });

  it('scales existing points into the new box instead of re-rolling', () => {
    // Only the debounce timer is faked, same reasoning as the resize test
    // below: faking requestAnimationFrame too would let advanceTimersByTime
    // fire frames and count them as draws. `Math.random` is pinned to 0.5 so
    // every point's velocity is exactly 0 — `draw()` still runs (once inside
    // the initial `resize()`, once inside the debounced one) and would
    // otherwise add a frame of drift on top of the scale, which this
    // assertion's 1e-6 tolerance has no room for.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    mockClientWidth = 1000;
    mockClientHeight = 500;
    render(<Constellation />);
    const before = ctx.arc.mock.calls.map((call) => [call[0], call[1]]);
    expect(before.length).toBeGreaterThan(0);

    mockClientWidth = 500;
    mockClientHeight = 500;
    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(120);

    const after = ctx.arc.mock.calls.slice(-before.length).map((call) => [call[0], call[1]]);
    before.forEach(([x, y], i) => {
      expect(after[i]![0]).toBeCloseTo((x as number) * 0.5, 6);
      expect(after[i]![1]).toBeCloseTo(y as number, 6);
    });
    vi.useRealTimers();
  });

  it('starts again when the box becomes non-zero after a resize', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    mockClientWidth = 0;
    mockClientHeight = 0;
    render(<Constellation />);
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();

    mockClientWidth = 1024;
    mockClientHeight = 768;
    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(120);

    expect(window.requestAnimationFrame).toHaveBeenCalled();
    vi.useRealTimers();
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

  /* Movement is integrated over the clock, not counted in draws. The old
     loop added a fixed 0.07px per draw behind a `t - last < 33` gate, and on
     a 60Hz display two frames are 33.3ms — a third of a millisecond inside
     the gate. Any vsync jitter let one draw through at 33ms and held the
     next to 50ms, so the field alternated between two speeds: the unevenness
     the eye reads as "not smooth". Two invariants: one draw 66ms after the
     last moves a point exactly as far as two draws 33ms apart, and a
     two-frame gap that lands a hair short of 33ms still draws. */
  it('moves the field by elapsed time and tolerates a slightly short frame pair', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.75); // velocity +0.5·SPEED, far from any edge
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      frames.push(cb);
      return frames.length;
    });
    render(<Constellation />);
    const tick = (t: number) => frames[frames.length - 1]!(t);
    const lastX = () => ctx.arc.mock.calls[ctx.arc.mock.calls.length - 1]![0] as number;
    const draws = () => ctx.clearRect.mock.calls.length;

    tick(1000); // the first frame after start only sets the reference time
    const x0 = lastX();
    const d0 = draws();
    tick(1010); // 10ms on: under the gate, nothing drawn
    expect(draws()).toBe(d0);
    tick(1033);
    const step = lastX() - x0;
    expect(step).toBeGreaterThan(0);
    tick(1066);
    expect(lastX() - x0).toBeCloseTo(2 * step, 6);
    tick(1132); // one draw across twice the gap
    expect(lastX() - x0).toBeCloseTo(4 * step, 6);
    tick(1164); // 32ms: a 60Hz frame pair that arrived a hair early
    expect(draws()).toBe(d0 + 4);
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
