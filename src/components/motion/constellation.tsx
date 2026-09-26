'use client';

import { useEffect, useRef } from 'react';

/* ─── The constellation ────────────────────────────────────────────────────
   A slow field of points, joined by a line whenever two of them drift close,
   drawn behind the whole page. It is the one moving thing in the backdrop;
   the circuit board it sits on (layout/tech-backdrop.css) is still.

   Numbers below are wigin.ai's, measured from their bundle on 2026-09-21,
   and kept because they were chosen by eye against a full page of text:
   one point per 30 000 px² of viewport, links under 168px, one frame per
   33ms. 30fps is deliberate — for motion this slow 60 buys nothing visible
   and doubles the work done next to every other animation on the page.

   One departure from wigin: movement is integrated over the clock, not
   added per draw. wigin moves each point a fixed 0.07px every draw behind
   a `t - last < 33` gate, and on a 60Hz display two frames are 33.3ms —
   a third of a millisecond inside that gate. Any vsync jitter let one
   draw through at 33ms and held the next to 50ms, and with a fixed step
   per draw the field alternated between two speeds. Here the gate has a
   few ms of slack (see FRAME_SLACK_MS) and each draw moves the points by
   velocity × elapsed time, so a frame that arrives late or early moves
   them exactly as far as the clock says. Verified in tests/constellation.

   No colour is written here. The two tokens are read off <html> and read
   AGAIN when data-theme changes, so IF a theme ever redefines --base-info
   or --base-accent the field follows with no reload and no second
   component. Today neither token is redefined under [data-theme='dark']
   in globals.css — the per-theme difference is the opacity step in
   layout/tech-backdrop.css. */

const AREA_PER_POINT = 30_000;
const MIN_POINTS = 24;
const MAX_POINTS = 60;
const LINK_DISTANCE = 168;
const FRAME_MS = 33;
/* A draw is due once FRAME_MS − FRAME_SLACK_MS have passed. Two 60Hz frames
   are 33.3ms, three 120Hz frames 25ms and four 33.3ms, three 90Hz frames
   33.3ms: with 4ms of slack every common refresh rate settles on the same
   whole number of frames per draw instead of flipping between two. */
const FRAME_SLACK_MS = 4;
const SPEED = 2.1; // px per second, per axis, at most — wigin's 0.07px per draw at 30 draws/s
const DPR_CAP = 2;
const RESIZE_DEBOUNCE_MS = 120;

type Point = { x: number; y: number; vx: number; vy: number; r: number };

function makePoint(w: number, h: number): Point {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 2 * SPEED,
    vy: (Math.random() - 0.5) * 2 * SPEED,
    r: 1 + 1.5 * Math.random(),
  };
}

function pointCount(w: number, h: number): number {
  return Math.max(MIN_POINTS, Math.min(MAX_POINTS, Math.round((w * h) / AREA_PER_POINT)));
}

export function Constellation() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let w = 0;
    let h = 0;
    const points: Point[] = [];
    let gradient: CanvasGradient | string = '';
    let frame = 0;
    /* Timestamp of the last draw, in rAF time. `undefined` between `stop()`
       and the first frame after `start()`, so a tab coming back from the
       background does not integrate the whole time it was hidden. */
    let last: number | undefined;
    let running = false;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* One gradient across the width does the blue→cyan interpolation the
       canvas would otherwise need a colour parser for: any string the tokens
       resolve to — hex today, oklch tomorrow — is a valid gradient stop. */
    const readColours = () => {
      const style = window.getComputedStyle(document.documentElement);
      const info = style.getPropertyValue('--base-info').trim();
      const accent = style.getPropertyValue('--base-accent').trim();
      const g = ctx.createLinearGradient(0, 0, w || 1, 0);
      // A canvas gradient has no `currentColor` — passing it is not a valid
      // stop and throws in some engines. 'transparent' is a silent no-op
      // fallback instead.
      g.addColorStop(0, info || 'transparent');
      g.addColorStop(1, accent || 'transparent');
      gradient = g;
    };

    /* `dt` is seconds since the last draw. The static draws — first paint,
       resize, theme change, reduced motion — pass nothing and move nothing. */
    const draw = (dt = 0) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of points) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < 0 || p.x > w) p.vx = -p.vx;
        if (p.y < 0 || p.y > h) p.vy = -p.vy;
      }
      ctx.strokeStyle = gradient;
      ctx.fillStyle = gradient;
      ctx.lineWidth = 1;
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i]!;
          const b = points[j]!;
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d >= LINK_DISTANCE) continue;
          ctx.globalAlpha = (1 - d / LINK_DISTANCE) * 0.48;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 0.8;
      for (const p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    /* Existing points are scaled into the new box rather than re-rolled, so
       rotating a phone or dragging a window edge does not reshuffle the sky. */
    const resize = () => {
      // The canvas is `width:100%; height:100%` inside `.tech-backdrop`
      // (fixed, inset 0), so its own box is the truth about what's on
      // screen. `window.innerWidth` is wider than that box with a classic
      // scrollbar (1440 buffer over 1425 CSS px observed) and, on phones,
      // moves independently of it as the URL bar collapses.
      const nw = canvas.clientWidth;
      const nh = canvas.clientHeight;
      if (!nw || !nh) {
        // `@media (prefers-contrast: more)` sets `.tech-backdrop { display:
        // none }`, which makes this a 0×0 box. Stop the loop rather than
        // keep drawing into a buffer nobody sees; leave `w`/`h` and the
        // points untouched so a later non-zero resize scales them instead
        // of re-rolling.
        stop();
        return;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      if (w && h) {
        for (const p of points) {
          p.x *= nw / w;
          p.y *= nh / h;
        }
      }
      w = nw;
      h = nh;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = pointCount(w, h);
      while (points.length < n) points.push(makePoint(w, h));
      points.length = Math.min(points.length, n);
      readColours();
      draw();
      // The box just measured non-zero: if the canvas was hidden (contrast
      // preference toggled off) and the loop had stopped, this restarts it.
      // No-op otherwise — `start()` is idempotent via `running`.
      start();
    };

    /* `window.`-prefixed on purpose: the tests spy on `window.requestAnimationFrame`
       and `window.getComputedStyle`, and under vitest's jsdom a bare global is a
       separate copy the spy never sees. In a browser they are the same function. */
    const tick = (t: number) => {
      frame = window.requestAnimationFrame(tick);
      if (last === undefined) {
        // First frame after start(): a reference time, nothing to integrate.
        last = t;
        return;
      }
      const elapsed = t - last;
      if (elapsed < FRAME_MS - FRAME_SLACK_MS) return;
      last = t;
      draw(elapsed / 1000);
    };
    const start = () => {
      // `!w || !h` covers the frame before the first `resize()` measurement
      // and a canvas hidden by `(prefers-contrast: more)`: a hidden canvas
      // never starts the loop.
      if (running || reduced || !w || !h) return;
      running = true;
      frame = window.requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      last = undefined;
      window.cancelAnimationFrame(frame);
    };

    const onVisibility = () => (document.hidden ? stop() : start());
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, RESIZE_DEBOUNCE_MS);
    };
    const themeObserver = new MutationObserver(() => {
      readColours();
      if (reduced) draw();
    });

    resize();
    start();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      stop();
      clearTimeout(resizeTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
      themeObserver.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="constellation" aria-hidden="true" />;
}
