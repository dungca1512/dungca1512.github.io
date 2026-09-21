# wigin.ai Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port three effects from wigin.ai — a fixed particle-constellation backdrop, a drawn-and-pulsing SVG hub over the Expertise grid, and a pointer tilt on the case-study illustration — with no smooth-scroll library and no new dependency.

**Architecture:** One `'use client'` canvas component replaces the SVG motif layer inside the existing fixed `.tech-backdrop`. The hub is server-rendered SVG whose "draw" runs on `animation-timeline: view()` and whose "pulse" is a timed keyframe gated by a tiny IntersectionObserver in the same client component. The tilt is a client wrapper that writes two CSS custom properties; the `transform` lives in the stylesheet. Everything else is CSS following the `@supports (animation-timeline: view())` inversion already used in `work.css`.

**Tech Stack:** Next.js 16 App Router (`output: 'export'`), React 19, Tailwind v4, vitest + jsdom + @testing-library/react, PostCSS for stylesheet tests. No new packages.

**Spec:** `docs/superpowers/specs/2026-09-21-wigin-effects-design.md`

## Global Constraints

Copied from the spec. Every task inherits them.

- No smooth-scroll library, no wheel listener, no `scroll-behavior` change, no snapping. Nothing reads scroll position in JS.
- `prefers-reduced-motion: reduce` shows the finished state: canvas draws one frame, hub links fully drawn, pulses hidden, tilt flat.
- No JS: canvas transparent over the circuit board, hub links drawn, pulses hidden, image flat. Every `<h3>` and every word of content unchanged.
- Only `transform` and `opacity` animate, with one documented exception: `stroke-dashoffset` on the hub's eight `<path>` elements.
- `dvh`, never `vh`.
- Below `48rem` the hub is `display: none` and the grid is untouched.
- Deep links (`#expertise`, `#projects`) land where they do today.
- No colour literal outside `src/app/globals.css` (`check:colors`). All colours through `--base-*` tokens.
- JS budget `200 KB gzip` per page (`check:budget`); today 175.8 KB.
- Code comments in English, in the repo's existing voice: say why, cite the measurement.
- Branch `feat/constellation-backdrop`. Commit per task. Never push to `main`; open a PR.
- Commit trailer: `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Run `npx prettier --write <files>` before every commit; `format:check` is the first verify gate.

**Two deviations from the spec, decided while planning:**

1. `view-timeline-name: --hub` goes on the hub WRAPPER, not the `<ul>`. Named timelines resolve through ancestors only, and the SVG paths are siblings of the `<ul>`, not descendants. The wrapper is the same box.
2. There is no separate `HubGate`. The `Hub` component is itself `'use client'` and owns the IntersectionObserver; the cards are passed in as `children` from the server component, which React allows.

## File Map

| Path                                      | Action | Responsibility                                                                     |
| ----------------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| `src/components/site/glyphs.tsx`          | create | `NeuralNet` glyph, lifted out of the motif file so it survives that file's removal |
| `src/components/motion/constellation.tsx` | create | The canvas: particles, links, 30fps loop, theme re-read, resize                    |
| `src/styles/layout/tech-backdrop.css`     | modify | Remove `.tech-motifs`/`.motif*`; add `.constellation` opacity per theme            |
| `src/app/[lang]/layout.tsx`               | modify | Mount `<Constellation />` where `<BackdropMotifs />` was                           |
| `src/components/site/backdrop-motifs.tsx` | delete |                                                                                    |
| `tests/backdrop-motifs.test.tsx`          | delete |                                                                                    |
| `tests/constellation.test.tsx`            | create | Reduced motion, theme re-read, resize, unmount, CSS placement                      |
| `src/components/site/hub.tsx`             | create | `Hub`: wrapper, core, links SVG, in-view attribute                                 |
| `src/styles/sections/expertise.css`       | create | Hub layout, draw keyframe (scroll), pulse keyframe (time)                          |
| `src/app/globals.css`                     | modify | `@import '../styles/sections/expertise.css'`                                       |
| `src/components/sections/expertise.tsx`   | modify | Wrap the EXPERTISE `<ul>` in `<Hub>`, move gap to CSS                              |
| `src/styles/motion-reduced.css`           | modify | Resets for `.hub-link`, `.hub-pulse`, `.tilt`                                      |
| `tests/expertise-hub.test.tsx`            | create | Render + PostCSS assertions for the hub                                            |
| `src/components/motion/tilt.tsx`          | create | `Tilt`: pointer → `--tilt-x/--tilt-y`                                              |
| `src/styles/sections/work.css`            | modify | `.tilt` transform and transitions                                                  |
| `src/components/sections/work.tsx`        | modify | Wrap the case-study `<Illustration>` in `<Tilt>`                                   |
| `tests/tilt.test.tsx`                     | create | Listener gating, variable writes, CSS                                              |

---

### Task 1: Lift the NeuralNet glyph out of the motif file

**Files:**

- Create: `src/components/site/glyphs.tsx`
- Modify: `src/components/site/backdrop-motifs.tsx:136-176` (delete the local `NeuralNet`, import it)
- Test: `tests/glyphs.test.tsx`

**Interfaces:**

- Produces: `export function NeuralNet(): React.ReactElement` — a fragment of `<path>`/`<circle>` drawn around `(0,0)` inside a roughly 160×160 box, `stroke: currentColor` expected from the parent.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/glyphs.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NeuralNet } from '@/components/site/glyphs';

describe('NeuralNet glyph', () => {
  it('draws every edge of a 3-4-2 net and every node', () => {
    const { container } = render(
      <svg>
        <NeuralNet />
      </svg>,
    );
    // 3×4 + 4×2 edges, 3+4+2 nodes.
    expect(container.querySelectorAll('path')).toHaveLength(20);
    expect(container.querySelectorAll('circle')).toHaveLength(9);
  });

  it('stays inside an 80-unit radius of its origin, so a caller can size the box', () => {
    const { container } = render(
      <svg>
        <NeuralNet />
      </svg>,
    );
    for (const c of container.querySelectorAll('circle')) {
      expect(Math.abs(Number(c.getAttribute('cx')))).toBeLessThanOrEqual(80);
      expect(Math.abs(Number(c.getAttribute('cy')))).toBeLessThanOrEqual(80);
    }
  });
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `npx vitest run tests/glyphs.test.tsx`
Expected: FAIL — `Cannot find module '@/components/site/glyphs'`.

- [ ] **Step 3: Create the glyph file and re-point the motif file**

Create `src/components/site/glyphs.tsx` with the body of `NeuralNet` moved verbatim from `backdrop-motifs.tsx`:

```tsx
/* Glyphs shared between the backdrop and the hub in Expertise. Each one is
   drawn around its own origin in `currentColor` with no fill of its own, so
   the parent <svg> decides size, colour and stroke through CSS. */

/** A three-layer net, every edge drawn: the model, not a metaphor for one. */
export function NeuralNet() {
  const layers: { x: number; ys: number[] }[] = [
    { x: -62, ys: [-40, 0, 40] },
    { x: 0, ys: [-60, -20, 20, 60] },
    { x: 62, ys: [-26, 26] },
  ];
  return (
    <>
      {layers
        .slice(0, -1)
        .map((layer, i) =>
          layer.ys.map((from) =>
            layers[i + 1]!.ys.map((to) => (
              <path
                key={`${layer.x}-${from}-${to}`}
                d={`M${layer.x} ${from} L${layers[i + 1]!.x} ${to}`}
                strokeWidth="1.5"
                opacity="0.4"
              />
            )),
          ),
        )}
      {layers.map((layer) =>
        layer.ys.map((y) => (
          <circle
            key={`${layer.x}-${y}`}
            cx={layer.x}
            cy={y}
            r="6"
            fill="currentColor"
            stroke="none"
            opacity="0.85"
          />
        )),
      )}
    </>
  );
}
```

In `backdrop-motifs.tsx`: delete the local `function NeuralNet() {…}` (the doc comment at line 136 through the closing brace before `function Chip()` at line 177) and add after the existing imports at the top:

```tsx
import { NeuralNet } from './glyphs';
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/glyphs.test.tsx tests/backdrop-motifs.test.tsx`
Expected: both PASS (the motif test still renders the same SVG).

- [ ] **Step 5: Commit**

```bash
npx prettier --write src/components/site/glyphs.tsx src/components/site/backdrop-motifs.tsx tests/glyphs.test.tsx
git add src/components/site/glyphs.tsx src/components/site/backdrop-motifs.tsx tests/glyphs.test.tsx
git commit -m "refactor: lift the neural-net glyph out of the motif layer

The motif layer goes in the next commit; the hub in Expertise keeps this
one drawing.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Constellation canvas replaces the motif layer

**Files:**

- Create: `src/components/motion/constellation.tsx`
- Modify: `src/styles/layout/tech-backdrop.css:67,85-131,135` (remove motif rules, add `.constellation`, two comments)
- Modify: `src/app/[lang]/layout.tsx:12,66-71`
- Delete: `src/components/site/backdrop-motifs.tsx`, `tests/backdrop-motifs.test.tsx`
- Test: `tests/constellation.test.tsx`

**Interfaces:**

- Produces: `export function Constellation(): React.ReactElement` — renders `<canvas className="constellation" aria-hidden="true" />`. No props.
- Consumes: CSS custom properties `--base-info`, `--base-accent` on `<html>`; the `data-theme` attribute on `<html>`.

- [ ] **Step 1: Write the failing tests**

```tsx
// tests/constellation.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import postcss, { type Rule } from 'postcss';
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
    vi.useFakeTimers();
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
    const opacity = (r: Rule | undefined) =>
      Number(r?.nodes.find((n) => n.type === 'decl' && n.prop === 'opacity')?.['value']);
    expect(opacity(light)).toBeGreaterThan(0);
    expect(opacity(dark)).toBeGreaterThan(opacity(light));
    expect(opacity(dark)).toBeLessThanOrEqual(1);
  });

  it('is mounted inside .tech-backdrop, where the motifs were', () => {
    expect(LAYOUT).toMatch(/className="tech-backdrop"[^>]*>\s*<Constellation \/>\s*<\/div>/);
    expect(LAYOUT).not.toContain('BackdropMotifs');
  });
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `npx vitest run tests/constellation.test.tsx`
Expected: FAIL — `Cannot find module '@/components/motion/constellation'`.

- [ ] **Step 3: Write the component**

```tsx
// src/components/motion/constellation.tsx
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

   No colour is written here. The two tokens are read off <html> and read
   AGAIN when data-theme changes, so the theme toggle recolours the field
   with no reload and no second component. */

const AREA_PER_POINT = 30_000;
const MIN_POINTS = 24;
const MAX_POINTS = 60;
const LINK_DISTANCE = 168;
const FRAME_MS = 33;
const SPEED = 0.07; // px per frame, per axis, at most
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
    let points: Point[] = [];
    let gradient: CanvasGradient | string = '';
    let frame = 0;
    let last = 0;
    let running = false;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* One gradient across the width does the blue→cyan interpolation the
       canvas would otherwise need a colour parser for: any string the tokens
       resolve to — hex today, oklch tomorrow — is a valid gradient stop. */
    const readColours = () => {
      const style = getComputedStyle(document.documentElement);
      const info = style.getPropertyValue('--base-info').trim();
      const accent = style.getPropertyValue('--base-accent').trim();
      const g = ctx.createLinearGradient(0, 0, w || 1, 0);
      g.addColorStop(0, info || 'currentColor');
      g.addColorStop(1, accent || 'currentColor');
      gradient = g;
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
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
      const nw = window.innerWidth;
      const nh = window.innerHeight;
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
    };

    const tick = (t: number) => {
      frame = requestAnimationFrame(tick);
      if (t - last < FRAME_MS) return;
      last = t;
      draw();
    };
    const start = () => {
      if (running || reduced) return;
      running = true;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
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
```

- [ ] **Step 4: Replace the motif rules in the stylesheet**

In `src/styles/layout/tech-backdrop.css`, delete everything from the comment `/* ─── The motif layer ───` (line 85) through the closing brace of the `.motif-success { … }` rule (line 131, as of `36f5377`). Keep the `@media (prefers-contrast: more)` block that follows, but change its inner comment `The motif layer is a child, so it goes with this — no second rule.` to `The canvas is a child, so it goes with this — no second rule.` In place of the deleted block write:

```css
/* ─── The constellation ───────────────────────────────────────────────────
   Goes with src/components/motion/constellation.tsx, which draws the points.
   Colour is read from the tokens by that component; the only thing decided
   here is how much of it shows. Two numbers because the same blue line is
   louder on white than on near-black: these are starting values, to be fixed
   against a contrast measurement of body text over the busiest patch of the
   field in both themes (see the spec, §3.4).

   It inherits the mask and the fixed positioning from `.tech-backdrop`, which
   is why it is a child of it rather than a second fixed element. */
.constellation {
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0.35;
}

[data-theme='dark'] .constellation {
  opacity: 0.55;
}
```

Also update the header comment of the file: the line `The motif layer is the subject now; this is the field behind it.` (around line 67) becomes `The constellation is the subject now; this is the field behind it.`

- [ ] **Step 5: Swap the layout mount, delete the motif files**

In `src/app/[lang]/layout.tsx`: replace `import { BackdropMotifs } from '@/components/site/backdrop-motifs';` with `import { Constellation } from '@/components/motion/constellation';`. Replace the block

```tsx
<div className="tech-backdrop" aria-hidden="true">
  <BackdropMotifs />
</div>
```

with

```tsx
<div className="tech-backdrop" aria-hidden="true">
  <Constellation />
</div>
```

and in the comment above it change the two lines

```
            paints the circuit board out of gradients; its one child draws the
            motifs on top of it, and inherits the mask and the fixed position
```

to

```
            paints the circuit board out of gradients; its one child draws the
            constellation on top of it, and inherits the mask and the fixed position
```

Then:

```bash
git rm -q src/components/site/backdrop-motifs.tsx tests/backdrop-motifs.test.tsx
```

- [ ] **Step 6: Run the tests and the static gates**

Run: `npx vitest run tests/constellation.test.tsx tests/glyphs.test.tsx && npm run -s lint && npm run -s typecheck && npm run -s check:colors`
Expected: all PASS. If `lint` flags the unused `Tint`/`Placement` exports having vanished, that is expected — they left with the file.

- [ ] **Step 7: Build and measure**

Run: `npm run -s build && npm run -s check:budget`
Expected: budget OK. Record the new `KB gzip` figure for the commit message (baseline 175.8 KB).

- [ ] **Step 8: Commit**

```bash
npx prettier --write src/components/motion/constellation.tsx src/styles/layout/tech-backdrop.css 'src/app/[lang]/layout.tsx' tests/constellation.test.tsx
git add -A src/components/motion/constellation.tsx src/styles/layout/tech-backdrop.css 'src/app/[lang]/layout.tsx' tests/constellation.test.tsx src/components/site/backdrop-motifs.tsx tests/backdrop-motifs.test.tsx
git commit -m "feat: a constellation over the circuit board, in place of the motifs

<N> points per viewport, joined under 168px, redrawn at 30fps and never
under reduced motion. Colour is read from the theme tokens and re-read on
toggle. Budget: 175.8 → <X> KB gzip.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: The hub over the Expertise grid

**Files:**

- Create: `src/components/site/hub.tsx`
- Create: `src/styles/sections/expertise.css`
- Modify: `src/app/globals.css:376-378` (import)
- Modify: `src/components/sections/expertise.tsx:48-66`
- Modify: `src/styles/motion-reduced.css` (append inside the media block)
- Test: `tests/expertise-hub.test.tsx`

**Interfaces:**

- Consumes: `NeuralNet` from Task 1; `MockIntersectionObserver` from `tests/setup.ts`.
- Produces: `export function Hub({ children }: { children: React.ReactNode }): React.ReactElement` — renders `<div class="hub" data-inview?>` containing `children`, then `div.hub-core[aria-hidden]`, then `svg.hub-links[aria-hidden]` with four `path.hub-link` and four `path.hub-pulse`, each with `pathLength="1"` and `style="--i: n"`. Also `export const HUB_LINKS: readonly string[]` (four `d` strings).

- [ ] **Step 1: Write the failing tests**

```tsx
// tests/expertise-hub.test.tsx
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import postcss, { type AtRule, type Declaration, type Rule } from 'postcss';
import { MockIntersectionObserver } from './setup';
import { Hub, HUB_LINKS } from '@/components/site/hub';

const HUB_CSS = readFileSync('src/styles/sections/expertise.css', 'utf8');
const REDUCED_CSS = readFileSync('src/styles/motion-reduced.css', 'utf8');
const GLOBALS = readFileSync('src/app/globals.css', 'utf8');
const EXPERTISE_TSX = readFileSync('src/components/sections/expertise.tsx', 'utf8');

afterEach(cleanup);

function hub() {
  return render(
    <Hub>
      <ul className="hub-grid">
        <li>
          <h3>one</h3>
        </li>
        <li>
          <h3>two</h3>
        </li>
        <li>
          <h3>three</h3>
        </li>
        <li>
          <h3>four</h3>
        </li>
      </ul>
    </Hub>,
  ).container;
}

describe('Hub markup', () => {
  it('keeps the list it is given as the first child, untouched', () => {
    const c = hub();
    const wrapper = c.firstElementChild!;
    expect(wrapper).toHaveClass('hub');
    expect(wrapper.firstElementChild?.tagName).toBe('UL');
    expect(c.querySelectorAll('ul > li')).toHaveLength(4);
    expect(c.querySelectorAll('h3')).toHaveLength(4);
  });

  it('draws four links and four pulses from the core, each normalised to length 1', () => {
    const c = hub();
    const links = [...c.querySelectorAll('path.hub-link')];
    const pulses = [...c.querySelectorAll('path.hub-pulse')];
    expect(links).toHaveLength(4);
    expect(pulses).toHaveLength(4);
    for (const p of [...links, ...pulses]) {
      expect(p.getAttribute('d')).toMatch(/^M50 50 /);
      expect(p.getAttribute('pathLength')).toBe('1');
    }
    expect(links.map((p) => p.getAttribute('d'))).toEqual([...HUB_LINKS]);
    expect(links.map((p) => (p as HTMLElement).style.getPropertyValue('--i'))).toEqual([
      '0',
      '1',
      '2',
      '3',
    ]);
  });

  it('is decoration: core and links are hidden from assistive tech and stretch with the box', () => {
    const c = hub();
    expect(c.querySelector('.hub-core')).toHaveAttribute('aria-hidden', 'true');
    const svg = c.querySelector('svg.hub-links')!;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).toHaveAttribute('preserveAspectRatio', 'none');
    expect(svg).toHaveAttribute('viewBox', '0 0 100 100');
    // The core carries the lifted glyph.
    expect(c.querySelectorAll('.hub-core circle')).toHaveLength(9);
  });

  it('marks itself in view exactly while the observer says so', () => {
    const c = hub();
    const wrapper = c.querySelector('.hub') as HTMLElement;
    const io = MockIntersectionObserver.instances.find((i) => i.observed.has(wrapper));
    expect(io).toBeDefined();
    expect(wrapper.dataset.inview).toBeUndefined();
    io!.trigger(wrapper, true);
    expect(wrapper.dataset.inview).toBe('true');
    io!.trigger(wrapper, false);
    expect(wrapper.dataset.inview).toBe('false');
  });

  it('is what Expertise wraps its four areas in', () => {
    expect(EXPERTISE_TSX).toMatch(/<Hub>\s*<ul className="[^"]*\bhub-grid\b/);
    expect(GLOBALS).toContain("@import '../styles/sections/expertise.css';");
  });
});

/* ── Stylesheet ──────────────────────────────────────────────────────────── */

const root = postcss.parse(HUB_CSS);

function supportsGuard(): AtRule {
  let found: AtRule | undefined;
  root.walkAtRules('supports', (at) => {
    if (/^\s*not\b/.test(at.params)) return;
    if (/animation-timeline:\s*view\(\)/.test(at.params)) found = at;
  });
  if (!found) throw new Error('no @supports (animation-timeline: view()) in expertise.css');
  return found;
}

function motionMedia(parent: AtRule | postcss.Root): AtRule {
  let found: AtRule | undefined;
  parent.walkAtRules('media', (at) => {
    if (/min-width:\s*48rem/.test(at.params) && /no-preference/.test(at.params)) found = at;
  });
  if (!found) throw new Error('no (min-width: 48rem) and (prefers-reduced-motion: no-preference)');
  return found;
}

function decls(container: postcss.Container, selector: string): Declaration[] {
  const out: Declaration[] = [];
  container.walkRules((r) => {
    if (!r.selectors.includes(selector)) return;
    r.walkDecls((d) => out.push(d));
  });
  return out;
}

function keyframeProps(name: string): Set<string> {
  const props = new Set<string>();
  root.walkAtRules('keyframes', (at) => {
    if (at.params !== name) return;
    at.walkDecls((d) => props.add(d.prop));
  });
  if (props.size === 0) throw new Error(`no @keyframes ${name}`);
  return props;
}

describe('Hub stylesheet', () => {
  it('has no vh anywhere', () => {
    expect(HUB_CSS).not.toMatch(/\dvh\b/); // `74dvh` has a `d` before `vh`, so it passes; `74vh` does not
  });

  it('hides the hub by default and shows it only from 48rem', () => {
    const top = decls(root, '.hub-core').filter((d) => d.parent?.parent === root);
    expect(top.some((d) => d.prop === 'display' && d.value === 'none')).toBe(true);
    let shown = false;
    root.walkAtRules('media', (at) => {
      if (!/min-width:\s*48rem/.test(at.params)) return;
      if (decls(at, '.hub-core').some((d) => d.prop === 'display' && d.value !== 'none'))
        shown = true;
    });
    expect(shown).toBe(true);
  });

  it('draws the links on the scroll timeline, only inside the guard', () => {
    const inside = decls(motionMedia(supportsGuard()), '.hub-link');
    expect(inside.some((d) => d.prop === 'animation-timeline' && d.value === '--hub')).toBe(true);
    expect(inside.some((d) => d.prop === 'animation-range')).toBe(true);
    // Nothing outside the guard animates the link.
    const insideSupports = (d: Declaration) => {
      for (let n: postcss.Container | undefined = d.parent; n; n = n.parent as postcss.Container) {
        if (n.type === 'atrule' && (n as AtRule).name === 'supports') return true;
      }
      return false;
    };
    const outside = decls(root, '.hub-link').filter(
      (d) => d.prop.startsWith('animation') && !insideSupports(d),
    );
    expect(outside).toHaveLength(0);
    // The timeline is named on the wrapper, which is the paths' ancestor.
    expect(
      decls(motionMedia(supportsGuard()), '.hub').some(
        (d) => d.prop === 'view-timeline-name' && d.value === '--hub',
      ),
    ).toBe(true);
  });

  it('runs the pulse only while the wrapper is in view', () => {
    const paused = decls(root, '.hub-pulse');
    expect(paused.some((d) => d.prop === 'animation-play-state' && d.value === 'paused')).toBe(
      true,
    );
    const running = decls(root, ".hub[data-inview='true'] .hub-pulse");
    expect(running.some((d) => d.prop === 'animation-play-state' && d.value === 'running')).toBe(
      true,
    );
    expect(running.some((d) => d.prop === 'opacity' && d.value === '1')).toBe(true);
  });

  it('the two keyframes touch stroke-dashoffset and nothing else', () => {
    expect([...keyframeProps('site-hub-draw')]).toEqual(['stroke-dashoffset']);
    expect([...keyframeProps('site-hub-pulse')]).toEqual(['stroke-dashoffset']);
  });

  it('lands on the last frame under reduced motion', () => {
    const reduced = postcss.parse(REDUCED_CSS);
    const inReduced = (selector: string) => {
      const out: Declaration[] = [];
      reduced.walkAtRules('media', (at) => {
        if (/^\s*not\b/.test(at.params) || !/prefers-reduced-motion:\s*reduce/.test(at.params))
          return;
        out.push(...decls(at, selector));
      });
      return out;
    };
    const link = inReduced('.hub-link');
    expect(link.some((d) => d.prop === 'animation' && d.value === 'none' && d.important)).toBe(
      true,
    );
    expect(link.some((d) => d.prop === 'stroke-dashoffset' && d.value === '0' && d.important)).toBe(
      true,
    );
    const pulse = inReduced('.hub-pulse');
    expect(pulse.some((d) => d.prop === 'animation' && d.value === 'none' && d.important)).toBe(
      true,
    );
    expect(pulse.some((d) => d.prop === 'opacity' && d.value === '0' && d.important)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `npx vitest run tests/expertise-hub.test.tsx`
Expected: FAIL — `Cannot find module '@/components/site/hub'`.

- [ ] **Step 3: Write the component**

```tsx
// src/components/site/hub.tsx
'use client';

import { useEffect, useRef } from 'react';
import { NeuralNet } from './glyphs';

/* ─── The hub ──────────────────────────────────────────────────────────────
   A core at the meeting point of the Expertise grid's gutters, and a curve
   from it to each of the four cards. The curves draw themselves as the grid
   scrolls into view; then a short bright dash travels each one on a loop.

   Borrowed from wigin.ai's solutions hub, measured on 2026-09-21, minus the
   two libraries they build it with. Their draw is a GSAP ScrollTrigger tween
   — here it is `animation-timeline: view()`, the same mechanism as every
   reveal on this page. Their pulse is a GSAP `repeat: -1` — here a CSS
   keyframe, and the only JavaScript left is the observer below that pauses
   it off screen, so a looping animation is never running for a section
   nobody is looking at.

   The paths live in a 100×100 box stretched to the grid with
   `preserveAspectRatio="none"`, so one set of coordinates fits every grid
   size; `vector-effect: non-scaling-stroke` (in expertise.css) keeps the
   stroke a real 1.5px through that stretch. Each path carries
   `pathLength="1"`, so dash lengths and offsets are fractions of the path
   and the same keyframe serves all four regardless of their real length. */

/* The core is at (50,50). Ends sit a little INSIDE each card's inner corner
   — cards paint above the SVG, so overshoot is hidden and the join is clean
   whatever the gutter's exact share of the box. Control points sit straight
   above/below the core, so every link leaves it vertically and bends out. */
export const HUB_LINKS: readonly string[] = [
  'M50 50 Q50 41 44 41',
  'M50 50 Q50 41 56 41',
  'M50 50 Q50 59 44 59',
  'M50 50 Q50 59 56 59',
];

export function Hub({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  /* Not use-in-view.ts: that hook is a FALLBACK that attaches nothing where
     `animation-timeline` is supported, and this gate has to work everywhere
     the pulse runs, which is every browser. threshold 0: any pixel on
     screen is enough for a decoration to be worth animating. */
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        el.dataset.inview = entries[0]?.isIntersecting ? 'true' : 'false';
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="hub">
      {children}
      <div className="hub-core" aria-hidden="true">
        <svg className="hub-glyph" viewBox="-80 -80 160 160" focusable="false">
          <NeuralNet />
        </svg>
      </div>
      <svg
        className="hub-links"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        {HUB_LINKS.map((d, i) => (
          <path
            key={`link-${i}`}
            className="hub-link"
            d={d}
            pathLength={1}
            style={{ '--i': i } as React.CSSProperties}
          />
        ))}
        {HUB_LINKS.map((d, i) => (
          <path
            key={`pulse-${i}`}
            className="hub-pulse"
            d={d}
            pathLength={1}
            style={{ '--i': i } as React.CSSProperties}
          />
        ))}
      </svg>
    </div>
  );
}
```

- [ ] **Step 4: Write the stylesheet**

```css
/* src/styles/sections/expertise.css */

/* ─── The hub over the four areas ─────────────────────────────────────────
   Goes with src/components/site/hub.tsx. Same inversion as sections/work.css:
   the defaults below are the FINISHED picture — links drawn, pulses hidden —
   and the block at the bottom only ever adds motion inside a guard. Firefox,
   Safari before 26, JS off and reduced motion all land on the defaults.

   THE ONE EXCEPTION TO "TRANSFORM AND OPACITY ONLY" ON THIS SITE.
   `stroke-dashoffset` is a paint property. It is animated here on eight
   <path> elements that between them cover one grid's gutters and nothing
   else — a repaint of a few hundred pixels of 1.5px stroke, on a layer
   that contains no text. Measured against the alternative (a moving
   <circle> on `offset-path`, which is not composited either), this is the
   cheaper of two paints, and it is what the effect IS. Do not extend the
   exception to anything with text in it. */

.hub {
  position: relative;
}

/* The wrapper's own grid. `gap` lives here rather than in a Tailwind utility
   on the <ul> so the 48rem override below has one place to override. */
.hub-grid {
  gap: 1.5rem;
}

/* Cards paint above the links, so a path end that overshoots into a card is
   covered, and the join looks like it stops at the edge. */
.hub-grid > li {
  position: relative;
  z-index: 1;
}

/* Hidden until the grid is two columns wide enough to have a gutter to sit
   in. Below 48rem the list is the list. */
.hub-core,
.hub-links {
  display: none;
}

@media (min-width: 48rem) {
  /* 5rem, from 1.5rem: the channel the core and the curves live in. Cards
     lose 1.75rem each; the grid gains a centre. */
  .hub-grid {
    gap: 5rem;
  }

  .hub-core {
    display: grid;
    place-items: center;
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 2;
    width: 3.5rem;
    height: 3.5rem;
    translate: -50% -50%;
    border: 1px solid var(--base-border);
    border-radius: var(--base-radius-md);
    background-color: var(--base-surface);
    box-shadow: var(--base-shadow-raised);
    color: var(--site-ink-primary);
  }

  .hub-glyph {
    width: 2.25rem;
    height: 2.25rem;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .hub-links {
    display: block;
    position: absolute;
    inset: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  .hub-link,
  .hub-pulse {
    fill: none;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }

  /* Drawn. `pathLength="1"` on the element makes these fractions. */
  .hub-link {
    stroke: color-mix(in srgb, var(--base-info) 45%, transparent);
    stroke-width: 1.5;
    stroke-dasharray: 1 1;
    stroke-dashoffset: 0;
  }

  /* A 12%-of-path dash, parked past the end of the path (offset -1) where it
     cannot be seen, and transparent besides. Both are undone only while the
     wrapper reports itself in view — see the two rules after the media
     block — so the loop below is never running off screen. */
  .hub-pulse {
    stroke: var(--base-accent);
    stroke-width: 2.5;
    stroke-dasharray: 0.12 1;
    stroke-dashoffset: -1;
    opacity: 0;
    animation-play-state: paused;
  }
}

/* Outside the media block so the specificity story is one line: these two
   selectors are (0,3,0) and (0,2,0) against the (0,1,0) defaults above. */
.hub[data-inview='true'] .hub-pulse {
  opacity: 1;
  animation-play-state: running;
}

/* ── Motion ─────────────────────────────────────────────────────────────── */

/* Offset 1 with a `1 1` dash on a unit path is a full gap: nothing drawn.
   Offset 0 is the whole path. */
@keyframes site-hub-draw {
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
}

/* With dasharray `0.12 1` (period 1.12), offset 0 puts the dash on [0, 0.12)
   — at the core — and offset -1 puts it on [1, 1.12), off the far end. One
   sweep, core to card, per iteration. */
@keyframes site-hub-pulse {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: -1;
  }
}

@supports (animation-timeline: view()) {
  @media (min-width: 48rem) and (prefers-reduced-motion: no-preference) {
    /* The wrapper is the paths' ancestor; the <ul> is their sibling, and a
       named timeline resolves through ancestors only. Same box either way. */
    .hub {
      view-timeline-name: --hub;
      view-timeline-axis: block;
    }

    /* Each link draws over 40% of the grid's entry into the viewport,
       starting 6% later than the one before it — wigin's 0.12s stagger,
       expressed in scroll rather than seconds. */
    .hub-link {
      animation: site-hub-draw linear both;
      animation-timeline: --hub;
      animation-range: entry calc(20% + var(--i) * 6%) entry calc(60% + var(--i) * 6%);
    }

    /* Timed, not scrolled: a pulse that only moved when the reader did would
       read as the reader dragging it. 2.4s and a 0.55s stagger are wigin's;
       the 0.8s lead lets the draw finish first on a normal scroll. */
    .hub-pulse {
      animation: site-hub-pulse 2.4s linear infinite;
      animation-delay: calc(0.8s + var(--i) * 0.55s);
    }
  }
}
```

Note the pulse's `animation` is set inside the `@supports` block even though it does not need the timeline. That is deliberate: a browser without scroll-driven animation gets no half-effect (pulses sweeping over links that were never drawn in), it gets the still picture.

- [ ] **Step 5: Import the stylesheet, wrap the grid, add the reduced-motion resets**

`src/app/globals.css`: after `@import '../styles/sections/work.css';` add

```css
@import '../styles/sections/expertise.css';
```

`src/components/sections/expertise.tsx`: add `import { Hub } from '@/components/site/hub';` and change

```tsx
        <ul className="stagger grid gap-6 sm:grid-cols-2">
          {EXPERTISE.map((area, i) => (
```

to

```tsx
        {/* The hub draws a core at the crossing of this grid's gutters and a
            link to each card — see site/hub.tsx. The <ul> is unchanged as a
            list: four items, four <h3>s, and the core is aria-hidden. `gap`
            moved to expertise.css so the hub's wider gutter has one place to
            override it. */}
        <Hub>
          <ul className="stagger hub-grid grid sm:grid-cols-2">
            {EXPERTISE.map((area, i) => (
```

and close `</ul>` with `</Hub>` after it (re-indent the block by one level).

`src/styles/motion-reduced.css`: inside the `@media (prefers-reduced-motion: reduce)` block, after the `.pin-art, .pin-panel, .pin-name { … }` rule (line ~114) and before `.pop-on-hover`, add

```css
/* The hub in Expertise (sections/expertise.css). The link's last frame is
     the whole line; the pulse's is off the end of the path, so it goes. */
.hub-link {
  animation: none !important;
  stroke-dashoffset: 0 !important;
}

.hub-pulse {
  animation: none !important;
  opacity: 0 !important;
}
```

- [ ] **Step 6: Run the tests and gates**

Run: `npx vitest run tests/expertise-hub.test.tsx tests/motion.test.tsx tests/work-pin.test.ts && npm run -s lint && npm run -s typecheck && npm run -s check:colors`
Expected: PASS. `tests/motion.test.tsx` reads `motion-reduced.css` but looks up selectors by name rather than enumerating them, so two new rules do not disturb it.

- [ ] **Step 7: Build and check content**

Run: `npm run -s build && npm run -s check:content && npm run -s check:budget`
Expected: OK. `check:content` counts four Expertise `<h3>`s as before. Record the budget figure.

- [ ] **Step 8: Look at it**

Run: `npx serve out -l 4321` in the background, open `http://localhost:4321/vi/#expertise` at 1440×900. Confirm: core centred on the gutter crossing, four curves end under the cards, pulses travel core→card. Resize below 768px: hub gone, grid one column. If the curve ends visibly stop short of a card, widen the endpoints (`44`→`43`, `56`→`57`, `41`→`40`, `59`→`60`) in `HUB_LINKS` and re-run the test file (it compares to the constant, so it stays green).

- [ ] **Step 9: Commit**

```bash
npx prettier --write src/components/site/hub.tsx src/styles/sections/expertise.css src/app/globals.css src/components/sections/expertise.tsx src/styles/motion-reduced.css tests/expertise-hub.test.tsx
git add src/components/site/hub.tsx src/styles/sections/expertise.css src/app/globals.css src/components/sections/expertise.tsx src/styles/motion-reduced.css tests/expertise-hub.test.tsx
git commit -m "feat: a hub at the centre of the Expertise grid

Four links draw in on the scroll timeline; a dash travels each one while
the grid is on screen. One documented paint-property exception. Budget:
<X> KB gzip.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Tilt on the case-study illustration

**Files:**

- Create: `src/components/motion/tilt.tsx`
- Modify: `src/styles/sections/work.css:24-28` (after `.case-band`)
- Modify: `src/components/sections/work.tsx:229-236`
- Modify: `src/styles/motion-reduced.css` (append inside the media block)
- Test: `tests/tilt.test.tsx`

**Interfaces:**

- Produces: `export function Tilt({ children, className }: { children: React.ReactNode; className?: string }): React.ReactElement` — renders `<div class="tilt …" data-tilting?>` and writes `--tilt-x`, `--tilt-y` in `[-0.5, 0.5]` as inline styles.

- [ ] **Step 1: Write the failing tests**

```tsx
// tests/tilt.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import postcss, { type Declaration } from 'postcss';
import { Tilt } from '@/components/motion/tilt';

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
    fireEvent.pointerMove(el, { clientX: 100, clientY: 50 });
    expect(el.style.getPropertyValue('--tilt-x')).toBe('0.000');
    expect(el.style.getPropertyValue('--tilt-y')).toBe('0.000');
    expect(el.dataset.tilting).toBe('true');
    fireEvent.pointerMove(el, { clientX: 200, clientY: 0 });
    expect(el.style.getPropertyValue('--tilt-x')).toBe('0.500');
    expect(el.style.getPropertyValue('--tilt-y')).toBe('-0.500');
  });

  it('returns to flat, softly, when the pointer leaves', () => {
    const el = mount();
    fireEvent.pointerMove(el, { clientX: 200, clientY: 100 });
    fireEvent.pointerLeave(el);
    expect(el.style.getPropertyValue('--tilt-x')).toBe('0');
    expect(el.style.getPropertyValue('--tilt-y')).toBe('0');
    expect(el.dataset.tilting).toBeUndefined();
  });

  it('attaches nothing on a touch device', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(media('pointer: coarse'));
    const el = mount();
    fireEvent.pointerMove(el, { clientX: 200, clientY: 100 });
    expect(el.style.getPropertyValue('--tilt-x')).toBe('');
  });

  it('attaches nothing under reduced motion', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(media('prefers-reduced-motion'));
    const el = mount();
    fireEvent.pointerMove(el, { clientX: 200, clientY: 100 });
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
      r.walkDecls((d) => out.push(d));
    });
    return out;
  };

  it('moves only transform, from the two variables, with a soft return and a tight follow', () => {
    const rest = decls(WORK_CSS, '.tilt');
    const transform = rest.find((d) => d.prop === 'transform')!;
    expect(transform.value).toContain('var(--tilt-x, 0)');
    expect(transform.value).toContain('var(--tilt-y, 0)');
    expect(transform.value).toMatch(/perspective\(/);
    const transition = rest.find((d) => d.prop === 'transition')!;
    expect(transition.value).toMatch(/^transform\b/);
    expect(transition.value).not.toContain(',');
    const follow = decls(WORK_CSS, ".tilt[data-tilting='true']");
    expect(follow.some((d) => d.prop === 'transition-duration')).toBe(true);
  });

  it('is flat under reduced motion', () => {
    const r = decls(REDUCED_CSS, '.tilt', true);
    expect(r.some((d) => d.prop === 'transform' && d.value === 'none' && d.important)).toBe(true);
    expect(r.some((d) => d.prop === 'transition' && d.value === 'none' && d.important)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `npx vitest run tests/tilt.test.tsx`
Expected: FAIL — `Cannot find module '@/components/motion/tilt'`.

- [ ] **Step 3: Write the component**

```tsx
// src/components/motion/tilt.tsx
'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

/* ─── Tilt ─────────────────────────────────────────────────────────────────
   The picture leans a few degrees toward the pointer. wigin.ai does this to
   the photo in its About band (6°, measured 2026-09-21); here it is the
   case-study illustration in Work.

   The JavaScript here does one thing: it turns a pointer position into two
   numbers in [-0.5, 0.5] and writes them as custom properties. What those
   numbers DO — the perspective, the angle, the timing — is in work.css, on
   `.tilt`, where it can be read and changed beside the rest of the section's
   motion. Every frame is a `transform` change and nothing else.

   Two reasons never to attach at all: a coarse pointer (a finger has no
   hover, so the effect would fire only while tapping and read as a
   glitch), and a reduced-motion preference. Without JS the variables are
   never set, `var(--tilt-x, 0)` falls back to zero, and the image is flat. */

export function Tilt({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;

    const move = (e: PointerEvent) => {
      const box = el.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const x = (e.clientX - box.left) / box.width - 0.5;
      const y = (e.clientY - box.top) / box.height - 0.5;
      el.style.setProperty('--tilt-x', x.toFixed(3));
      el.style.setProperty('--tilt-y', y.toFixed(3));
      el.dataset.tilting = 'true';
    };
    const leave = () => {
      el.style.setProperty('--tilt-x', '0');
      el.style.setProperty('--tilt-y', '0');
      delete el.dataset.tilting;
    };

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <div ref={ref} className={cn('tilt', className)}>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: The stylesheet and the mount**

`src/styles/sections/work.css`, after the `.case-band` rule:

```css
/* The case-study picture leans toward the pointer — motion/tilt.tsx writes
   `--tilt-x`/`--tilt-y` in [-0.5, 0.5]; everything visible about the effect
   is this rule. 6° is wigin.ai's number and it is about the most a flat
   picture can lean before the far edge starts to look cropped. The return
   is four times slower than the follow (the second rule): a picture that
   snaps back reads as a bug, one that drifts back reads as weight. */
.tilt {
  transform: perspective(900px) rotateY(calc(var(--tilt-x, 0) * 6deg))
    rotateX(calc(var(--tilt-y, 0) * -6deg));
  transform-style: preserve-3d;
  transition: transform 0.4s var(--ease-out-soft);
}

.tilt[data-tilting='true'] {
  transition-duration: 0.1s;
  transition-timing-function: linear;
}
```

`src/components/sections/work.tsx`: add `import { Tilt } from '@/components/motion/tilt';` and wrap the case-study picture:

```tsx
{
  /* Leans toward the pointer on a fine-pointer device; flat
              everywhere else. The parallax on the <img> inside and the tilt
              on this wrapper are two transforms on two elements, so neither
              overwrites the other. */
}
<Tilt>
  <Illustration
    name="work"
    parallax
    alt=""
    width={640}
    height={640}
    className="block overflow-hidden rounded-lg"
  />
</Tilt>;
```

`src/styles/motion-reduced.css`, inside the media block after the hub resets:

```css
/* The tilt never attaches its listeners under reduced motion, so this is
     the second line, for a preference toggled after load. */
.tilt {
  transform: none !important;
  transition: none !important;
}
```

- [ ] **Step 5: Run the tests and gates**

Run: `npx vitest run tests/tilt.test.tsx tests/work-pin.test.ts tests/motion.test.tsx && npm run -s lint && npm run -s typecheck && npm run -s check:colors`
Expected: PASS. `work-pin.test.ts` walks keyframes and the `@supports` block only, so a new top-level `.tilt` rule does not disturb it.

- [ ] **Step 6: Build, look, measure**

Run: `npm run -s build && npm run -s check:budget`, serve `out`, open `/vi/#projects`, move the pointer over the case-study picture: it leans up to 6°, and settles when the pointer leaves. Record the budget figure.

- [ ] **Step 7: Commit**

```bash
npx prettier --write src/components/motion/tilt.tsx src/styles/sections/work.css src/components/sections/work.tsx src/styles/motion-reduced.css tests/tilt.test.tsx
git add src/components/motion/tilt.tsx src/styles/sections/work.css src/components/sections/work.tsx src/styles/motion-reduced.css tests/tilt.test.tsx
git commit -m "feat: the case-study picture leans toward the pointer

Six degrees, fine pointers only, transform only; the JS writes two
variables and the stylesheet does the rest. Budget: <X> KB gzip.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Evidence, full verify, pull request

**Files:**

- Modify (possibly): `src/styles/layout/tech-backdrop.css` — the two `.constellation` opacities, if the contrast measurement says so.
- Modify: `docs/superpowers/specs/2026-09-21-wigin-effects-design.md` — status line.

- [ ] **Step 1: Full verify**

Run: `npm run verify`
Expected: every gate OK. Fix anything that is not, in the task it belongs to, and amend that task's commit only if it is the last one; otherwise a new `fix:` commit.

- [ ] **Step 2: Screenshots, both themes**

Serve `out` on `:4321`. With Playwright at 1440×900, `scrollTo({behavior: 'instant'})`, save under `.playwright-mcp/` (gitignored):

- `wigin-port-1-backdrop-light.png`, `-dark.png` — the hero, with the board and the constellation behind it. Toggle theme by setting `document.documentElement.dataset.theme = 'dark'`.
- `wigin-port-2-hub-drawing.png` — Expertise grid with its top edge at ~70% of viewport height (links partly drawn).
- `wigin-port-2-hub-drawn.png` — grid centred, wait 1.5s, a pulse in flight.
- `wigin-port-3-tilt.png` — case-study picture with the pointer hovered at its top-right corner (`page.mouse.move`).
- `wigin-port-4-narrow.png` — 390×844, Expertise: no hub, one column.
- `wigin-port-5-reduced.png` — `emulateMedia({ reducedMotion: 'reduce' })`, Expertise: links drawn, no pulse, and the console shows no `requestAnimationFrame` loop (check `performance.now()` deltas or the `arc` count via a one-frame probe).

- [ ] **Step 3: Contrast**

Run the contrast script from the earlier session, `contrast.py` in this session's scratchpad (`/private/tmp/claude-501/-Users-dungca-project-dungca1512-github-io/7de3e15c-e86e-4562-a187-940f1d1e6b62/scratchpad/contrast.py`, usage `python3 contrast.py <png> x y w h`, prints the WCAG ratio of text over background in that crop; if the scratchpad is gone, re-derive the ratio with Pillow: sample the darkest 5% and lightest 5% of the crop's luminance), on a paragraph of body text over the densest patch of the field, light and dark. If any pair drops a WCAG grade compared to the same crop on `main` (serve a `git worktree` of `main` on `:4322` for the baseline), lower the matching `.constellation` opacity in steps of 0.05 and re-measure. Commit the change with both numbers in the message.

- [ ] **Step 4: Frame budget**

In Chrome DevTools (or Playwright `page.tracing`), record ~4s of scrolling from Hero through Expertise. Expected: no frame over 16.7ms attributed to `constellation.tsx` or to paint on `.hub-links`. Note the longest canvas frame in the PR body.

- [ ] **Step 5: Update the spec status and push the branch**

Change the spec's status line to `**Status:** implemented on branch \`feat/constellation-backdrop\`, 2026-09-21.`Commit as`docs: mark the wigin-effects spec implemented`.

```bash
git push -u origin feat/constellation-backdrop
gh pr create --base main --title "feat: constellation backdrop, Expertise hub, case-study tilt" --body-file <(cat <<'EOF'
Three effects analysed from wigin.ai and rebuilt without its smooth-scroll library, per `docs/superpowers/specs/2026-09-21-wigin-effects-design.md`.

- Fixed particle constellation over the circuit board (replaces the SVG motif layer). 30fps, one static frame under reduced motion, recolours on theme toggle.
- Hub over the Expertise grid: links draw on `animation-timeline: view()`, pulses loop only while on screen. One documented `stroke-dashoffset` exception.
- 6° pointer tilt on the case-study illustration, fine pointers only.

Evidence: budget <before> → <after> KB gzip; contrast <light pair> / <dark pair>; longest canvas frame <n> ms. Screenshots attached.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)
```

Attach the screenshots from Step 2 to the PR (`gh pr comment --body` with the images uploaded, or paste them into the PR description in the browser). Do NOT merge; the owner merges.

- [ ] **Step 6: Report to the owner**

In Vietnamese, in chat: the PR link, the budget delta, the contrast numbers, the longest frame, and the two decisions left open in the spec (phones on/off, pointer reaction on the backdrop), each with the one-line change that would flip it.
