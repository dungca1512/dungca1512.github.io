/* The wheel's inertia. A mouse wheel scrolls in steps and stops dead; the
 * ask on 2026-09-26 was "quán tính khi lướt để nó chạy chậm dần" — momentum
 * that decays. SmoothScroll takes the wheel's steps as a TARGET and eases the
 * real scroll position towards it a fraction per frame, so the page keeps
 * moving after the wheel stops and settles rather than halting.
 *
 * What it must never do is fight an input that already has inertia (a
 * trackpad, a finger) or a reader who asked for less motion, or take over
 * from the scrollbar, the keyboard or an anchor link mid-flight. Most of the
 * cases below are about standing down. */
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SmoothScroll, isTrackpadWheel } from '@/components/motion/smooth-scroll';

type Frame = (now: number) => void;

let queue: Frame[] = [];
let now = 0;
let scrollTo: ReturnType<typeof vi.fn>;

/** Runs one animation frame `ms` later. */
const frame = (ms = 1000 / 60) => {
  now += ms;
  const due = queue;
  queue = [];
  due.forEach((cb) => cb(now));
};

const wheel = (
  init: WheelEventInit & { wheelDeltaY?: number },
  target: Element = document.body,
) => {
  const e = new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init });
  if (init.wheelDeltaY !== undefined) {
    Object.defineProperty(e, 'wheelDeltaY', { value: init.wheelDeltaY });
  }
  target.dispatchEvent(e);
  return e;
};

const setScrollY = (y: number) =>
  Object.defineProperty(window, 'scrollY', { value: y, writable: true, configurable: true });

beforeEach(() => {
  queue = [];
  now = 0;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    queue.push(cb as Frame);
    return queue.length;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {
    queue = [];
  });
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  scrollTo = vi.fn((opts: ScrollToOptions) => setScrollY(opts.top ?? 0));
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
  setScrollY(0);
  Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: 5000,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const positions = () => scrollTo.mock.calls.map((c) => (c[0] as ScrollToOptions).top as number);

describe('a mouse wheel', () => {
  it('is taken over and eased towards where the wheel asked to go', () => {
    render(<SmoothScroll />);
    const e = wheel({ deltaY: 100, wheelDeltaY: -120 });
    expect(e.defaultPrevented).toBe(true);
    for (let i = 0; i < 120; i++) frame();
    const ys = positions();
    expect(ys.length).toBeGreaterThan(5);
    // Every frame moves forward, by less than the one before: decay.
    for (let i = 1; i < ys.length - 1; i++) {
      expect(ys[i]).toBeGreaterThan(ys[i - 1]);
      expect(ys[i] - ys[i - 1]).toBeLessThanOrEqual(ys[i - 1] - (ys[i - 2] ?? 0) + 1e-9);
    }
    // ...and lands exactly on the target, not 0.4px short of it for ever.
    expect(ys.at(-1)).toBe(100);
    expect(queue).toHaveLength(0);
  });

  it('never scrolls the page itself with a smooth behaviour — that would ease the ease', () => {
    render(<SmoothScroll />);
    wheel({ deltaY: 100, wheelDeltaY: -120 });
    frame();
    expect((scrollTo.mock.calls[0][0] as ScrollToOptions).behavior).toBe('instant');
  });

  it('adds up notches that arrive mid-flight instead of restarting from the wheel', () => {
    render(<SmoothScroll />);
    wheel({ deltaY: 100, wheelDeltaY: -120 });
    frame();
    frame();
    wheel({ deltaY: 100, wheelDeltaY: -120 });
    for (let i = 0; i < 200; i++) frame();
    expect(positions().at(-1)).toBe(200);
  });

  it('converts line and page deltas, which only wheels send', () => {
    render(<SmoothScroll />);
    wheel({ deltaY: 3, deltaMode: WheelEvent.DOM_DELTA_LINE, wheelDeltaY: -120 });
    for (let i = 0; i < 200; i++) frame();
    expect(positions().at(-1)).toBe(48);
  });

  it('cannot be asked past either end of the document', () => {
    render(<SmoothScroll />);
    wheel({ deltaY: -500, wheelDeltaY: 600 });
    for (let i = 0; i < 200; i++) frame();
    expect(positions().at(-1)).toBe(0);
    wheel({ deltaY: 99999, wheelDeltaY: -120000 });
    for (let i = 0; i < 400; i++) frame();
    expect(positions().at(-1)).toBe(5000 - 800);
  });

  it('covers the same ground per millisecond at 60Hz and at 120Hz', () => {
    const run = (frames: number, ms: number) => {
      const view = render(<SmoothScroll />);
      wheel({ deltaY: 1000, wheelDeltaY: -1200 });
      for (let i = 0; i < frames; i++) frame(ms);
      const y = positions().at(-1)!;
      view.unmount();
      scrollTo.mockClear();
      setScrollY(0);
      return y;
    };
    const at60 = run(6, 1000 / 60);
    const at120 = run(12, 1000 / 120);
    expect(at120).toBeCloseTo(at60, 6);
  });
});

describe('standing down', () => {
  it('leaves a trackpad alone — it has its own inertia, and two stacked read as lag', () => {
    render(<SmoothScroll />);
    const e = wheel({ deltaY: 12.5, wheelDeltaY: -37 });
    expect(e.defaultPrevented).toBe(false);
    frame();
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('treats anything that follows a trackpad event within half a second as the trackpad', () => {
    render(<SmoothScroll />);
    wheel({ deltaY: 12.5, wheelDeltaY: -37 });
    // A trackpad flick can produce one event whose deltas happen to look
    // like a wheel's. It is still the trackpad.
    const e = wheel({ deltaY: 40, wheelDeltaY: -120 });
    expect(e.defaultPrevented).toBe(false);
  });

  it('stops mid-flight the moment a trackpad event arrives', () => {
    render(<SmoothScroll />);
    wheel({ deltaY: 400, wheelDeltaY: -480 });
    frame();
    frame();
    const before = scrollTo.mock.calls.length;
    wheel({ deltaY: 12.5, wheelDeltaY: -37 });
    frame();
    frame();
    expect(scrollTo.mock.calls.length).toBe(before);
  });

  it('stops the moment something else moves the page — scrollbar, keyboard, an anchor', () => {
    render(<SmoothScroll />);
    wheel({ deltaY: 400, wheelDeltaY: -480 });
    frame();
    frame();
    const before = scrollTo.mock.calls.length;
    setScrollY(2000); // the reader grabbed the scrollbar
    frame();
    frame();
    expect(scrollTo.mock.calls.length).toBe(before);
    // ...and the next notch starts from where the page really is.
    wheel({ deltaY: 100, wheelDeltaY: -120 });
    for (let i = 0; i < 200; i++) frame();
    expect(positions().at(-1)).toBe(2100);
  });

  it('lets a sideways wheel through — the marquee strip scrolls on its own axis', () => {
    render(<SmoothScroll />);
    const e = wheel({ deltaX: 80, deltaY: 10, wheelDeltaY: -12 });
    expect(e.defaultPrevented).toBe(false);
  });

  it('lets a pinch-zoom (ctrl + wheel) through', () => {
    render(<SmoothScroll />);
    const e = wheel({ deltaY: 100, ctrlKey: true, wheelDeltaY: -120 });
    expect(e.defaultPrevented).toBe(false);
  });

  it('lets a nested scroll container take the wheel while it still has room', () => {
    render(<SmoothScroll />);
    const box = document.createElement('div');
    box.style.overflowY = 'auto';
    Object.defineProperty(box, 'scrollHeight', { value: 1000 });
    Object.defineProperty(box, 'clientHeight', { value: 200 });
    box.scrollTop = 0;
    document.body.appendChild(box);
    expect(wheel({ deltaY: 100, wheelDeltaY: -120 }, box).defaultPrevented).toBe(false);
    // At its bottom, scrolling down falls through to the page.
    box.scrollTop = 800;
    expect(wheel({ deltaY: 100, wheelDeltaY: -120 }, box).defaultPrevented).toBe(true);
    box.remove();
  });

  it('does nothing at all for someone who asked for reduced motion', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (q) =>
        ({
          matches: q.includes('reduced-motion'),
          media: q,
          addEventListener() {},
          removeEventListener() {},
        }) as unknown as MediaQueryList,
    );
    render(<SmoothScroll />);
    expect(wheel({ deltaY: 100, wheelDeltaY: -120 }).defaultPrevented).toBe(false);
  });

  it('does nothing on a coarse pointer — touch already decays on its own', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (q) =>
        ({
          matches: q.includes('coarse'),
          media: q,
          addEventListener() {},
          removeEventListener() {},
        }) as unknown as MediaQueryList,
    );
    render(<SmoothScroll />);
    expect(wheel({ deltaY: 100, wheelDeltaY: -120 }).defaultPrevented).toBe(false);
  });

  it('takes its listener with it on unmount', () => {
    const { unmount } = render(<SmoothScroll />);
    unmount();
    expect(wheel({ deltaY: 100, wheelDeltaY: -120 }).defaultPrevented).toBe(false);
  });
});

describe('isTrackpadWheel', () => {
  const ev = (init: WheelEventInit, wheelDeltaY?: number) => {
    const e = new WheelEvent('wheel', init);
    if (wheelDeltaY !== undefined) Object.defineProperty(e, 'wheelDeltaY', { value: wheelDeltaY });
    return e;
  };
  it('reads a fractional pixel delta as a trackpad', () => {
    expect(isTrackpadWheel(ev({ deltaY: 4.5 }))).toBe(true);
  });
  it('reads a wheelDelta off the 120 grid as a trackpad', () => {
    expect(isTrackpadWheel(ev({ deltaY: 4 }, -12))).toBe(true);
  });
  it('reads a wheelDelta on the 120 grid with a whole pixel delta as a mouse', () => {
    expect(isTrackpadWheel(ev({ deltaY: 100 }, -120))).toBe(false);
    expect(isTrackpadWheel(ev({ deltaY: 300 }, -360))).toBe(false);
  });
  it('reads line and page deltas as a mouse, whatever else they carry', () => {
    expect(isTrackpadWheel(ev({ deltaY: 3.5, deltaMode: WheelEvent.DOM_DELTA_LINE }))).toBe(false);
  });
  it('reads a whole pixel delta with no wheelDelta at all as a mouse (jsdom, Firefox)', () => {
    expect(isTrackpadWheel(ev({ deltaY: 100 }))).toBe(false);
  });
});
