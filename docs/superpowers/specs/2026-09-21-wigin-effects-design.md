# Spec — Three effects from wigin.ai, without its scroll hijack

**Status:** implemented on branch `feat/constellation-backdrop`, 2026-09-21.
**Branch:** `feat/constellation-backdrop`. Merged by pull request, never pushed
straight to `main`.

## 1. What the owner asked for

> "phân tích hiệu ứng trang web này và xây dựng theo đó, tối ưu độ mượt mà:
> https://wigin.ai/"

Analyze the effects on wigin.ai, rebuild them in this portfolio, and optimize
for smoothness. The seven constraints from the pinned-work brief still apply
and outrank the effect:

1. `prefers-reduced-motion: reduce` shows the finished state, nothing moves.
2. Every word stays readable with no JS and no animation; find-in-page works.
3. **The page never takes over scrolling.** No smooth-scroll library, no wheel
   interception, no forced scroll speed, no hard snapping.
4. Only `transform` and `opacity` animate on anything large or scroll-linked.
5. `dvh`, never `vh`.
6. Narrow screens drop or shorten the effect gracefully.
7. Anchors and deep links still land where they point.

## 2. wigin.ai, measured

Read from the site's own bundles on 2026-09-21 (`page-bc551b8f9de1396d.js`,
`689-72a8f72a9033f98c.js`, `00750f8f84d526f8.css`), not guessed from the
screen.

| Effect                      | How they do it                                                                                                                                                                                        | Verdict                                                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Smooth scroll               | Lenis `duration: 1.1`, exponential easing, driven from the GSAP ticker. Disabled on `(pointer: coarse)`. Modals and the careers list carry `data-lenis-prevent` to scroll natively.                   | **Not ported.** Violates constraint 3 outright, and would break the `animation-timeline` pin in Work.                                 |
| Fixed particle backdrop     | Full-viewport 2D canvas, `clamp(24, w·h/30000, 60)` particles, links under 168px, gradient blue→cyan, rAF gated to 33ms (~30fps), stops on `visibilitychange`, one static frame under reduced motion. | **Ported** (§3).                                                                                                                      |
| Hero network canvas         | Second canvas, 28–64 particles, DPR capped at 2, follows `pointermove`, paused by IntersectionObserver.                                                                                               | Not ported: one backdrop is enough, and the hero already has its own composition.                                                     |
| Enter reveals               | IntersectionObserver `threshold .06`, `rootMargin -8%`, adds `.in`; `transition opacity/transform .7s cubic-bezier(.22,1,.36,1)` from `translateY(26px)`.                                             | **Ported on 2026-09-26**, replacing the scroll-driven `.reveal`: same observer numbers, `translateY(26px)`, 0.7s, `--ease-out-quint`. |
| Hub SVG                     | GSAP ScrollTrigger draws three bezier links with `stroke-dashoffset` (`power2.out`, 1.1s, staggered 0.12s), then three cyan pulses loop `repeat: -1`, 2.4s, staggered 0.55s.                          | **Ported in CSS** (§4). No GSAP: the two tweens are one scroll-driven and one timed keyframe.                                         |
| 3D tilt on the About photo  | `pointermove` → `rotateY(6·x) rotateX(−6·y)`, `.1s linear` while moving, `.4s` ease on leave; skipped under reduced motion.                                                                           | **Ported** (§5), on the case-study illustration.                                                                                      |
| Decorative micro-animations | Caret blink, time belt, product float, redact shine, chart ping.                                                                                                                                      | Not ported: they mimic wigin's products, which this site does not have.                                                               |
| Reduced motion              | `* { animation: none !important; transition: none !important }` plus per-effect guards.                                                                                                               | Already how `motion-reduced.css` works here.                                                                                          |

Nothing on wigin.ai is sticky or pinned except the header, and nothing uses CSS
scroll-driven animation. Their "smooth" is Lenis. This spec keeps the parts
that survive removing it.

Decisions the owner made, in order: keep constraint 3 and drop Lenis; port the
backdrop, the hub and the tilt; layer the particle canvas over the existing
circuit board and remove the motif glyphs; put the hub in Expertise; build all
of it as one small client island plus CSS, no libraries.

## 3. Constellation backdrop

> **Extended 2026-09-26, the neural field.** The owner brought a picture — glowing
> cyan-and-blue nodes of different sizes and brightnesses, thin links, a sense of depth
> on a navy-black ground — and asked for "the neural bits that move by themselves". The
> field below is still the one canvas and the one loop, with the same link rule and the
> same clock-integrated motion; what changed is what a point IS. Every point now has a
> depth `z` in [0, 1] that sets its radius (0.8–3px), its speed (45–100% of the cap)
> and its brightness together, so big-bright-fast and small-dim-slow read as near and
> far. Every point wears a halo, drawn as two pre-rendered 64px radial sprites (one per
> token colour, blended by x so the field keeps its left-to-right gradient) at one
> `drawImage` each — no per-frame gradient. Every point breathes on its own phase, one
> in six deeper and wider (a "hot" node). A link between two far points is fainter
> than one between two near ones. Density went from one point per 30,000px² to one per
> 24,000 (28–72 points). The mask over the hero now lets 28% through at its centre so
> the field is not cut out behind the headline. Tests in `tests/constellation.test.tsx`
> are unchanged: the halo path is skipped where the context has no
> `createRadialGradient` — which is the test DOM — so every count still holds.

### 3.1 Placement

`src/components/motion/constellation.tsx`, `'use client'`. Renders one
`<canvas class="constellation">` as the only child of `div.tech-backdrop` in
`src/app/[lang]/layout.tsx`, where `<BackdropMotifs />` stands today. It
inherits `position: fixed`, `inset: 0`, `z-index: -1`, `pointer-events: none`
and `aria-hidden` from that parent; the canvas itself is `display: block;
width: 100%; height: 100%`.

Removed: `src/components/site/backdrop-motifs.tsx`, the `.tech-motifs` block in
`src/styles/layout/tech-backdrop.css`, and `tests/backdrop-motifs.test.tsx`.
The `NeuralNet` glyph is lifted out of that file first, because §4 reuses it.
The circuit-board gradients stay exactly as they are.

### 3.2 Simulation

- Particle count `clamp(24, round(w·h / 30000), 60)`. 1440×900 → 43; a
  390×844 phone → 24.
- Each particle: position, velocity in `[-0.07, 0.07]` px per frame on each
  axis, radius `1 + 1.5·random()`. Velocity flips at the edges.
- Links between any two particles closer than 168px, alpha
  `(1 − d/168) · 0.48`, `lineWidth 1`. Particles drawn as filled circles at
  alpha 0.8.
- No pointer interaction. wigin's backdrop has none either; the pointer
  crosses the backdrop constantly, and reacting to it would read as noise.

### 3.3 Frame loop

- `requestAnimationFrame` gated to one draw per 33ms (≈30fps), as on wigin.
- Stops on `document.hidden`, restarts on visible.
- Under `(prefers-reduced-motion: reduce)`: draws exactly one frame and never
  schedules another. The backdrop is there; nothing moves.
- Runs on phones, at 24 particles. This is the owner's call to reverse; the
  hook to reverse it is a single `matchMedia('(pointer: coarse)')` check.

### 3.4 Colour and theme

No colour literal in the JS. On mount the component reads `--base-info` and
`--base-accent` off `document.documentElement` with `getComputedStyle`, and
re-reads them when `data-theme` on `<html>` changes, through a
`MutationObserver` on that attribute. Particle and link colour interpolate
between the two along the x axis, like wigin's blue→cyan.

Overall strength is CSS, on `.constellation`: `opacity: 0.55` under
`[data-theme='dark']`, `0.35` in light. Both numbers are starting points;
they are fixed by measuring contrast of body text over the backdrop with
`contrast.py` on the built page, and adjusted until every text/background
pair keeps its current WCAG grade.

### 3.5 Resize

`resize` listener debounced 120ms. Sets `canvas.width/height` to CSS size ×
`min(devicePixelRatio, 2)`, scales existing particle positions by the new/old
ratio instead of regenerating, so rotating a phone does not reshuffle the
field. Particle count is recomputed and the array grown or trimmed.

### 3.6 Without JavaScript

The `<canvas>` is transparent; the circuit board shows. There is no broken
state and no placeholder.

### 3.7 Budget

Estimated 1.8–2.2 KB gzip. Measured by `check:budget` after build; the number
goes in the commit message. Current headroom is 24.2 KB.

## 4. Hub in Expertise

### 4.1 Layout

The 2×2 grid of `EXPERTISE` cards in `src/components/sections/expertise.tsx`
gains a core at the intersection of its gutters and four short curves from
the core to the inner corner of each card.

```
┌────────────┐     ┌────────────┐
│ 01         │╲   ╱│ 02         │
│            │ ╲ ╱ │            │
└────────────┘  ◆  └────────────┘
┌────────────┐ ╱ ╲ ┌────────────┐
│ 03         │╱   ╲│ 04         │
│            │     │            │
└────────────┘     └────────────┘
```

- At `min-width: 48rem` the grid gap goes from `1.5rem` to `5rem`, so the
  core and the curves have a channel. Below that the grid is one column and
  the whole hub is `display: none`; the cards are untouched.
- The `<ul>` becomes `position: relative`. The hub is a sibling of the cards
  inside a wrapper `div.hub`, not a fifth `<li>`, so the list still has
  exactly four items for assistive tech and for `check:content`.
- Core: `div.hub-core`, 3.5rem square, `border-radius: var(--base-radius-md)`,
  `bg-surface`, `border-border`, `box-shadow: var(--base-shadow-raised)`,
  centred with `position: absolute; inset: 50% auto auto 50%;
translate: -50% -50%`. Contains the `NeuralNet` glyph from §3.1, in
  `currentColor` at `--site-ink-primary`. `aria-hidden="true"`.
- Links: one `svg.hub-links` with `position: absolute; inset: 0`,
  `viewBox="0 0 100 100"`, `preserveAspectRatio="none"`, four `<path
class="hub-link">` from `(50,50)` to the four points where the gutters meet
  the cards, `(50 ± gx/2, 50 ± gy/2)` with `gx`/`gy` the gutter as a share of
  the box on each axis (about 11 on x at the wide layout; y measured in the
  browser and fixed as a constant). Quadratic curves, control point pulled
  toward the core so each link leaves it tangentially. Each path is
  duplicated as `<path class="hub-pulse">`. `vector-effect:
non-scaling-stroke` on all eight so stretching the box does not fatten the
  strokes. `aria-hidden="true"`, `focusable="false"`.

### 4.2 Motion

Two animations, in `src/styles/sections/expertise.css` (new file, imported
from `globals.css` beside the other section sheets).

**Draw**, scroll-driven. `.hub-link` has `stroke-dasharray: 1 1` with
`pathLength="1"` on each path, and `@keyframes site-hub-draw { from {
stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }` on
`animation-timeline: view()` of the grid (`view-timeline-name: --hub` on the
`<ul>`, `animation-range: entry 30% entry 90%`). Staggered by `--i` on each
path through a per-path `animation-range` shift, as Work does. Inside
`@supports (animation-timeline: view())` wrapping `@media (min-width: 48rem)
and (prefers-reduced-motion: no-preference)`, the same nesting and the same
inversion as `work.css`: outside the guard the paths are simply drawn.

> **Superseded 2026-09-26.** The draw is now what wigin's is: fired once on
> entry. `hub.tsx`'s observer sets `data-drawn` the first time the grid
> intersects (bottom margin −8%, as the reveals) and never clears it;
> `.js .hub-link` parks `stroke-dashoffset: 1` with a
> `stroke-dashoffset var(--duration-hero) var(--ease-out-quint)` transition
> delayed `var(--i) * 0.12s`, and `.js .hub[data-drawn='true'] .hub-link`
> releases it to 0. No keyframe, no scroll timeline, no `@supports` fork;
> the media guard and the drawn-by-default picture outside it are unchanged.

**Pulse**, timed. `.hub-pulse` has `stroke-dasharray: 0.12 1`,
`@keyframes site-hub-pulse { from { stroke-dashoffset: 1.12 } to {
stroke-dashoffset: -1 } }`, `2.4s linear infinite`, `animation-delay:
calc(0.8s + var(--i) * 0.55s)`. It runs only while the grid is on screen:
`animation-play-state: paused` by default, `running` under
`.hub[data-inview='true']`.

That attribute is set by a tiny client component `HubGate`
(`src/components/motion/hub-gate.tsx`) with its own IntersectionObserver at
`threshold: 0`. It does NOT reuse `use-in-view.ts`: that hook is a fallback
that attaches nothing on browsers with scroll-timeline support, and the
pulse gate must work on every browser. Without JS the attribute is never
set and the pulses hold still at their first frame, which is invisible
(offset past the path end).

`stroke-dashoffset` is a paint property, not a compositor one. It is used
here deliberately, for a 4-path SVG that covers one grid and nothing else,
where a repaint is a few hundred pixels of strokes; this is the one
documented exception to constraint 4, and it is written into the CSS
comment above the keyframe.

### 4.3 Reduced motion and reset

`motion-reduced.css` gains second-line resets for `.hub-link` and
`.hub-pulse`: `animation: none !important; stroke-dashoffset: 0 !important`
on the link, `opacity: 0 !important` on the pulse.

### 4.4 Content invariants

Four `<h3>` in the grid, unchanged text, unchanged order. `check:content`
passes without edits. The core and the SVG are `aria-hidden`.

## 5. Tilt on the case-study illustration

`src/components/motion/tilt.tsx`, `'use client'`. Wraps the `<Illustration
name="work" parallax …>` in `work.tsx`.

- On `pointermove` over the wrapper: writes `--tilt-x` and `--tilt-y` in
  `[-0.5, 0.5]` as inline custom properties. On `pointerleave`: writes `0 0`.
- Attaches nothing when `matchMedia('(pointer: coarse)')` or
  `matchMedia('(prefers-reduced-motion: reduce)')` matches.
- CSS, in `work.css`: `.tilt { transform: perspective(900px)
rotateY(calc(var(--tilt-x, 0) * 6deg)) rotateX(calc(var(--tilt-y, 0) *
-6deg)); transition: transform 0.4s var(--ease-out-soft);
transform-style: preserve-3d }` and `.tilt[data-tilting='true'] {
transition-duration: 0.1s }`. The attribute is set on the first `pointermove`
  and cleared on leave, so the follow is tight and the return is soft.
- The existing parallax `transform` lives on the inner `<img>`; the tilt is
  on the wrapper. They compose, they do not fight.
- Without JS the wrapper has no variables set; `var(--tilt-x, 0)` resolves
  to zero and the image is flat.

## 6. Testing and evidence

Tests, in `tests/`:

- `expertise-hub.test.ts` (PostCSS): the two hub keyframes touch only
  `stroke-dashoffset`; the draw sits inside the `@supports`/`min-width`/
  `no-preference` guard; `.hub` is hidden below 48rem; `motion-reduced.css`
  carries the resets.
- `constellation.test.tsx`: under a mocked `matchMedia` that reports reduced
  motion, `requestAnimationFrame` is called at most once; changing
  `data-theme` on `<html>` triggers a re-read of `getComputedStyle`; unmount
  cancels the frame and disconnects the observers.
- `tilt.test.tsx`: no listeners under coarse pointer or reduced motion; a
  `pointermove` at the wrapper's centre writes `--tilt-x: 0` and
  `--tilt-y: 0`; `pointerleave` resets.
- `sections.test.tsx`: Expertise still renders four `<h3>`, and the hub core
  is `aria-hidden`.
- `backdrop-motifs.test.tsx` is deleted with its component.

Evidence handed to the owner before the PR:

- Screenshots at 1440×900 in both themes: backdrop with the board and the
  particles; the hub half-drawn and fully drawn with a pulse in flight; the
  tilt at rest and at one corner.
- `check:budget` before and after, with the delta.
- `contrast.py` on body text over the busiest patch of backdrop, both themes.
- A short Performance trace while scrolling through Expertise: no frame over
  16.7ms attributable to the canvas or the hub.

## 7. Out of scope

Lenis or any smooth-scroll (revisited on 2026-09-26: the owner asked for wheel
inertia; a dependency-free easing of the wheel, and only the wheel, shipped —
see the motion-system spec §3.3); changes to `.reveal` timing (revisited on
2026-09-26 — see the table row and §4.2's note); the hero canvas; any of
wigin's product micro-animations; dark-theme-only styling (both themes are
kept); changes to the pinned Work trio (moot since 2026-09-26: the trio was un-pinned at
the owner's request and the featured projects are plain cards again — motion-system spec
§3.3, last note).

## 8. Added 2026-09-26: the code window and the dark palette

The same request as the neural field brought two more things from wigin.ai's hero.

**The code window.** `src/components/motion/code-window.tsx` (`'use client'`), placed
on a second row of the hero grid, under the portrait illustration and never over it:
the owner asked for the portrait to stay exactly as it was. A dark terminal card — three dots with a breathing
"live" light, a row of tab pills, a monospace body — that types an API request one
character at a time (24ms per character, jittered, a beat at every line end), waits
the request's stated latency, streams the response in three-character chunks every
28ms, holds for 3.2s, fades the body for 280ms, and moves to the next tab. Four
snippets in `src/content/snippets.ts` (ASR, pronunciation scoring, embeddings, agentic
RAG), illustrative, bilingual tab labels, JSON in one language. The server renders
snippet 0 in full with no cursor; the client's first render is identical (`shown`
starts at Infinity) so hydration reconciles nothing, and the reset to zero happens under
the hero's own `reveal-load` fade. The loop pauses on `visibilitychange` and when an
IntersectionObserver reports the card off screen, and resumes from the same character.
Under reduced motion the effect returns before scheduling anything, so the full snippet
is the last frame; `motion-reduced.css` stops the live dot and the cursor. The card is
`aria-hidden`: the lead paragraph beside it already says what the services are.

The card's colours are `--site-code-*` tokens on `:root` that do not flip with the
theme, on purpose: it is dark in both themes, and on the light page it is the one place
wigin's ground shows through. Frame in `src/styles/site/code-window.css`, placement
in `sections/hero.css`: from `wide` up the card takes the right column of the second
row (the portrait's width, which the snippets are measured to), below it the card
follows the portrait capped at 30rem; it reveals 320ms behind the headline.

**The dark palette.** wigin's measured tokens are `#000` ground, `#0160fb` blue,
`#02e7c9` cyan, `#f3f5f7` grey at 10%/18% for borders and 62% for muted text, and a
radial glow `60% 60% at 50% 0%` of blue at 30% to cyan at 14%. The dark theme now uses
their blue and cyan as `--base-info` and `--base-accent` (the light theme keeps its teal
and mid blue), their grey for borders, and a navy rather than their black — three steps,
`#060c17` / `#0d1726` / `#122034`, as background, surface and surface-muted — because a
field of glowing points reads as depth on blue-black and as a screensaver on true
black. Foreground `#eef2f7` (17.4:1), muted `#9aa7b8` (8.0:1). The glow hangs from the
top of `<body>` in dark only, sized to one viewport. `tests/contrast.test.ts` now reads
the dark pair out of the dark block and measures the inks there: accent 13.24:1, info
6.18:1. The constellation's dark opacity went from 0.6 to 0.8 with the softer, depth-faded
drawing.
