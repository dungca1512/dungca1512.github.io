'use client';

import { useEffect, useRef } from 'react';

/* ─── The constellation ────────────────────────────────────────────────────
   A slow field of points, joined by a line whenever two of them drift close,
   drawn behind the whole page. It is the one moving thing in the backdrop;
   the circuit board it sits on (layout/tech-backdrop.css) is still.

   The engine is wigin.ai's, measured from their bundle on 2026-09-21: a
   point per so many px² of viewport, links under 168px, one frame per 33ms.
   30fps is deliberate — for motion this slow 60 buys nothing visible and
   doubles the work done next to every other animation on the page.

   Since 2026-09-26 it is drawn as a NEURAL FIELD rather than a flat one,
   after the owner's reference picture: every point has a depth, and depth
   sets its size, its brightness and its speed, so the field reads as
   clusters near and far instead of confetti on a plane; every point wears a
   soft halo, drawn from a pre-rendered sprite so it costs one drawImage and
   no per-frame gradient; and every point breathes on its own phase, with
   one in six a "hot" node that breathes deeper and glows wider. The link
   rule is unchanged.

   One departure from wigin, kept: movement is integrated over the clock,
   not added per draw. wigin moves each point a fixed 0.07px every draw
   behind a `t - last < 33` gate, and on a 60Hz display two frames are
   33.3ms — a third of a millisecond inside that gate. Any vsync jitter let
   one draw through at 33ms and held the next to 50ms, and with a fixed
   step per draw the field alternated between two speeds. Here the gate has
   a few ms of slack (see FRAME_SLACK_MS) and each draw moves the points by
   velocity × elapsed time, so a frame that arrives late or early moves
   them exactly as far as the clock says. Verified in tests/constellation.

   No colour is written here. The two tokens are read off <html> and read
   AGAIN when data-theme changes, so the field follows a theme that
   redefines --base-info or --base-accent with no reload — which the dark
   theme now does (globals.css, Step C), with wigin's pair on the navy ground. */

const AREA_PER_POINT = 24_000;
const MIN_POINTS = 28;
const MAX_POINTS = 72;
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

/* The halo sprite: a radial fade from the token colour to the same colour
   at zero alpha, drawn once per colour at this size and scaled per point.
   64px covers the widest halo drawn (a hot near point, ~40px) without
   upscaling. HALO_SCALE is halo diameter over point radius. */
const HALO_SPRITE_PX = 64;
const HALO_SCALE = 7;
const HALO_ALPHA = 0.55;
const HOT_EVERY = 6;
const PULSE_RATE = 0.9; // radians per second — one breath every ~7s

type Point = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** 0 is far, 1 is near. Sets size, brightness and speed together, so a
   *  big bright point is also a fast one, the way parallax says it should be. */
  z: number;
  phase: number;
  hot: boolean;
};

function makePoint(w: number, h: number, index: number): Point {
  const z = Math.random();
  const speed = SPEED * (0.45 + 0.55 * z);
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 2 * speed,
    vy: (Math.random() - 0.5) * 2 * speed,
    r: 0.8 + 2.2 * z,
    z,
    phase: Math.random() * Math.PI * 2,
    hot: index % HOT_EVERY === 0,
  };
}

function pointCount(w: number, h: number): number {
  return Math.max(MIN_POINTS, Math.min(MAX_POINTS, Math.round((w * h) / AREA_PER_POINT)));
}

/** The point's breath at clock time `t`: hot nodes swing deeper. */
function pulse(p: Point, t: number): number {
  const depth = p.hot ? 0.45 : 0.28;
  return 1 - depth + depth * Math.sin(t * PULSE_RATE + p.phase);
}

/** A halo sprite in `colour`, or null where the runtime cannot draw one
 *  (no 2D context, or a context without radial gradients — the test DOM).
 *  The sprite fades to the SAME colour at zero alpha rather than to
 *  'transparent': a gradient towards transparent black passes through dark
 *  greys on the way, which on the light page draws a grey ring round every
 *  point. The colour is normalised through `fillStyle`, which every engine
 *  returns as `#rrggbb` for an opaque colour, so an alpha can be appended. */
function makeHalo(colour: string): HTMLCanvasElement | null {
  const sprite = document.createElement('canvas');
  sprite.width = HALO_SPRITE_PX;
  sprite.height = HALO_SPRITE_PX;
  const s = sprite.getContext('2d');
  if (!s || typeof s.createRadialGradient !== 'function') return null;
  s.fillStyle = colour;
  const normalised = String(s.fillStyle);
  if (!/^#[0-9a-f]{6}$/i.test(normalised)) return null;
  const half = HALO_SPRITE_PX / 2;
  const g = s.createRadialGradient(half, half, 0, half, half, half);
  g.addColorStop(0, normalised);
  g.addColorStop(0.28, normalised + '99');
  g.addColorStop(1, normalised + '00');
  s.fillStyle = g;
  s.fillRect(0, 0, HALO_SPRITE_PX, HALO_SPRITE_PX);
  return sprite;
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
    let haloInfo: HTMLCanvasElement | null = null;
    let haloAccent: HTMLCanvasElement | null = null;
    let frame = 0;
    /* Timestamp of the last draw, in rAF time. `undefined` between `stop()`
       and the first frame after `start()`, so a tab coming back from the
       background does not integrate the whole time it was hidden. */
    let last: number | undefined;
    /* Seconds of motion so far. Drives the breathing; unlike `last` it is
       never reset, so a point's phase does not jump when the tab returns. */
    let clock = 0;
    let running = false;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* One gradient across the width does the blue→cyan interpolation the
       canvas would otherwise need a colour parser for: any string the tokens
       resolve to — hex today, oklch tomorrow — is a valid gradient stop. The
       halos get the same blend a different way: two sprites, one per token,
       drawn over each other with alphas that cross at mid-width. */
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
      haloInfo = info ? makeHalo(info) : null;
      haloAccent = accent ? makeHalo(accent) : null;
    };

    /* `dt` is seconds since the last draw. The static draws — first paint,
       resize, theme change, reduced motion — pass nothing and move nothing. */
    const draw = (dt = 0) => {
      clock += dt;
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
          // A link between two far points is fainter than one between two
          // near ones, which is most of what makes the depth read.
          ctx.globalAlpha = (1 - d / LINK_DISTANCE) * 0.48 * (0.4 + 0.6 * Math.min(a.z, b.z));
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      if (haloInfo && haloAccent) {
        for (const p of points) {
          const breath = pulse(p, clock);
          const size = p.r * HALO_SCALE * (p.hot ? 1.8 : 1);
          const alpha = HALO_ALPHA * (0.35 + 0.65 * p.z) * breath;
          const t = w ? Math.min(1, Math.max(0, p.x / w)) : 0;
          const left = p.x - size / 2;
          const top = p.y - size / 2;
          ctx.globalAlpha = alpha * (1 - t);
          ctx.drawImage(haloInfo, left, top, size, size);
          ctx.globalAlpha = alpha * t;
          ctx.drawImage(haloAccent, left, top, size, size);
        }
      }
      for (const p of points) {
        ctx.globalAlpha = 0.9 * (0.5 + 0.5 * p.z) * pulse(p, clock);
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
      while (points.length < n) points.push(makePoint(w, h, points.length));
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
