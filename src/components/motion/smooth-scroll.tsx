'use client';

import { useEffect } from 'react';

/* ─── The wheel's inertia ──────────────────────────────────────────────────
   A mouse wheel scrolls in steps: each notch jumps the page a fixed distance
   and it stops dead. A trackpad, a finger, and wigin.ai seen through a
   trackpad all decay — the page keeps going after the input stops and
   settles. Asked for on 2026-09-26 ("quán tính khi lướt để nó chạy chậm
   dần"), for a reader on a mouse.

   The model: the wheel no longer moves the page. Each notch is added to a
   TARGET, and every frame the real scroll position closes a fixed fraction
   of the remaining distance to it (LERP_PER_FRAME at 60Hz, normalised by the
   frame's real length so 120Hz covers the same ground per millisecond). The
   first frames after a notch are the fastest, and the last ones creep in:
   that shape is the momentum.

   The page is scrolled for real, with `window.scrollTo`. Nothing here moves
   content with a transform, so IntersectionObserver (use-in-view.ts), the
   view timelines behind the art parallax and the blueprint drift, the
   sticky header and the scrollbar all see an ordinary scroll and need no
   changes.
   `behavior: 'instant'`, because <html> carries `scroll-behavior: smooth`
   for anchor links and a smooth scrollTo would ease this easing.

   What it stands down for, each on purpose:
   - a trackpad (isTrackpadWheel): it already has inertia, and a lerp on top
     of it reads as lag — the standard complaint about smooth-scroll
     libraries. Once a trackpad event is seen, the next half second of wheel
     events is the trackpad too, whatever their deltas look like.
   - a coarse pointer: touch scrolling decays on its own.
   - prefers-reduced-motion: this is motion that carries no information.
   - a sideways wheel (the marquee strip scrolls on its own axis), ctrl +
     wheel (pinch zoom), and a nested scroll container that still has room.
   - anything else moving the page mid-flight — the scrollbar, the keyboard,
     an anchor link. If the real position is not where the last frame put
     it, someone else has the page, and the loop stops. Without this the
     loop would drag the page back from wherever the reader took it. */

/** Fraction of the remaining distance closed per 60Hz frame. 0.1 settles a
 *  100px notch in about 60 frames (a second), which is what a trackpad
 *  flick of the same size takes on macOS. */
export const LERP_PER_FRAME = 0.1;
const FRAME_MS = 1000 / 60;
/** Under this, snap to the target: the tail of an exponential never arrives
 *  on its own, and half a pixel is under the browser's own rounding. */
const SETTLE_PX = 0.5;
/** How long after a trackpad event every wheel event is still the trackpad. */
const TRACKPAD_HOLD_MS = 500;
/** `deltaMode` 1 is lines; 16px is what browsers use for one. */
const LINE_PX = 16;

type LegacyWheelEvent = WheelEvent & { wheelDeltaY?: number };

/** A heuristic, and an honest one: the platform does not say which device a
 *  wheel event came from. Two signals, both from how macOS reports mice:
 *  - a real wheel's `wheelDeltaY` (WebKit and Blink still expose it) is a
 *    whole number of 120-unit notches, a trackpad's is not.
 *  - a real wheel's pixel delta is a whole number, a trackpad's usually
 *    is not.
 *  Line and page deltas only come from wheels. A pixel delta that is whole
 *  with no `wheelDeltaY` to check (Firefox, jsdom) is taken as a wheel: the
 *  cost of a wrong answer there is one eased notch, and the half-second
 *  hold in the caller ends it as soon as the trackpad shows itself. */
export function isTrackpadWheel(e: WheelEvent): boolean {
  if (e.deltaMode !== WheelEvent.DOM_DELTA_PIXEL) return false;
  if (!Number.isInteger(e.deltaY)) return true;
  const legacy = (e as LegacyWheelEvent).wheelDeltaY;
  if (typeof legacy === 'number' && legacy % 120 !== 0) return true;
  return false;
}

/** True when an ancestor of the wheel's target scrolls vertically and still
 *  has room in the wheel's direction; the wheel belongs to it, not the page. */
function nestedScrollerTakes(target: EventTarget | null, deltaY: number): boolean {
  let el = target instanceof Element ? target : null;
  while (el && el !== document.body && el !== document.documentElement) {
    const overflow = getComputedStyle(el).overflowY;
    if ((overflow === 'auto' || overflow === 'scroll') && el.scrollHeight > el.clientHeight) {
      const down = deltaY > 0;
      const room = down ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0;
      if (room) return true;
    }
    el = el.parentElement;
  }
  return false;
}

function pixels(e: WheelEvent): number {
  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) return e.deltaY * LINE_PX;
  if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) return e.deltaY * window.innerHeight;
  return e.deltaY;
}

const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let target = 0;
    let current = 0;
    let raf = 0;
    let last = 0;
    let trackpadUntil = 0;

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    };

    const step = (now: number) => {
      // Someone else moved the page since the last frame: hand it over.
      if (Math.abs(window.scrollY - current) > 1) {
        raf = 0;
        last = 0;
        return;
      }
      const dt = now - last;
      last = now;
      // The per-frame fraction, re-expressed for a frame of this length, so
      // the decay is a function of time and not of the display's refresh.
      const k = 1 - Math.pow(1 - LERP_PER_FRAME, dt / FRAME_MS);
      current += (target - current) * k;
      if (Math.abs(target - current) < SETTLE_PX) current = target;
      window.scrollTo({ top: current, behavior: 'instant' });
      if (current === target) {
        raf = 0;
        last = 0;
        return;
      }
      raf = requestAnimationFrame(step);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.defaultPrevented || e.ctrlKey) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const now = performance.now();
      if (now < trackpadUntil || isTrackpadWheel(e)) {
        trackpadUntil = now + TRACKPAD_HOLD_MS;
        stop();
        return;
      }
      if (nestedScrollerTakes(e.target, e.deltaY)) return;
      e.preventDefault();
      if (!raf) {
        // Start from where the page really is, not from where the last
        // flight ended — the reader may have dragged the scrollbar since.
        current = window.scrollY;
        target = current;
      }
      target = Math.min(maxScroll(), Math.max(0, target + pixels(e)));
      if (!raf) {
        // The first frame's length is measured from now, not assumed to be
        // one 60Hz frame: on a 120Hz display that assumption moved the page
        // twice as far in the first frame as in any other.
        last = performance.now();
        raf = requestAnimationFrame(step);
      }
    };

    // Not passive: this listener is the one thing on the page that
    // prevents a default, and a passive one cannot.
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel);
      stop();
    };
  }, []);

  return null;
}
