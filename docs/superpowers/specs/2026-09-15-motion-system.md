# Spec — Motion system & quality gates for the portfolio

**Status:** agreed, ready to implement
**Date:** 2026-09-15
**Source of the idea:** analysis of `portfolio_team_hands` (Levi-IT team site, Next 16 +
Tailwind 4 + private design system, running locally at `:3000`).

---

## 1. Why

The team site is well made, and the reason it looks alive is not a library. It is a written
motion system: five duration tokens, two easing curves, four rules, and 22 of its 24
effects implemented in plain CSS with **0KB of motion library**. That system is portable.
The Next.js stack around it is not, and does not need to be.

Measured comparison (2026-09-15, both built locally):

|                         | This site                          | Team site                                |
| ----------------------- | ---------------------------------- | ---------------------------------------- |
| HTML + CSS + JS, gzip   | **31 KB**                          | 330 KB JS alone                          |
| Build step              | none                               | Next static export                       |
| Runtime dependencies    | none                               | React 19 + private design system         |
| Heaviest image          | `profile.jpeg` 203 KB              | `hero-teamwork.jpg` 5.9 MB               |
| Motion system           | ad hoc, one `--ease` token         | 5 duration + 2 easing tokens, documented |
| Reduced motion          | `* { animation: none !important }` | change the treatment, keep feedback      |
| Scroll-driven CSS       | none                               | `animation-timeline` throughout          |
| Automated quality gates | none                               | 6-step `npm run verify`                  |

So this site already wins on weight by 10×, and loses on motion discipline and on having
anything that stops a regression. **This spec closes the second gap without giving up the
first.**

## 2. What we are NOT copying

The team site's visual language — organic blobs, aurora gradients, soft shadows,
hand-drawn squiggles, illustrated characters — is the language of a creative agency. This
site opens with a stated rule at the top of `style.css`:

> Rules: no shadows, no gradients, no border-radius above 2px.
> Structure is expressed with 1px rules, not floating cards.

That rule is correct for an infrastructure/MLOps portfolio and it stays. Motion here has to
read as **a technical document assembling itself**, not as an illustration coming to life.
Every effect below is the technical-document translation of a team-site idea, not a copy of
it.

Explicitly rejected, with reasons:

| Team-site effect                  | Verdict                                            |
| --------------------------------- | -------------------------------------------------- |
| Magnetic cursor on buttons        | **No.** Playful; wrong register for this page.     |
| Organic blob morph on portrait    | **No.** Breaks the "no radius above 2px" rule.     |
| Aurora gradient behind hero       | **No.** Breaks the "no gradients" rule.            |
| Hand-drawn SVG squiggle underline | **Adapted.** Becomes a 1px rule that draws itself. |
| Intro curtain wipe over hero      | **No.** It is a preloader with better manners.     |
| Lottie illustrations              | **No.** Nothing here needs a character animation.  |

## 3. Requirements

### 3.1 Motion tokens

- Five duration tokens on `:root`: `--dur-instant` 100ms, `--dur-fast` 150ms,
  `--dur-base` 250ms, `--dur-slow` 400ms, `--dur-hero` 700ms.
- Two new easing tokens: `--ease-out-soft: cubic-bezier(0.2, 0, 0, 1)` and
  `--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)`.
- The existing `--ease: cubic-bezier(0.2, 0.7, 0.2, 1)` stays; rules across the sheet
  already reference it and rewriting them is out of scope.
- No new rule may write a literal duration. A gate enforces this.

### 3.2 Four motion laws

1. Everything enters from a direction that means something. Content rises 16px. Never a
   bare fade.
2. Animate only `transform`, `opacity`, `clip-path`, `filter`. Colour changes
   (`background-color`, `border-color`, `color`) are allowed because they are paint-only;
   `width`, `height`, `top` are not.
3. Durations come from the token scale. A full entrance sequence is ≤ 700ms.
4. `prefers-reduced-motion` **changes the treatment, it does not remove it**: no positional
   movement, no loops, opacity transitions capped at 150ms, every element at its final
   state.

### 3.3 Scroll-driven animation is the primary path

Reveal-on-scroll, the header settling, the scroll progress bar, and the background grid
drift are all functions of scroll position. They must be driven by
`animation-timeline: view()` / `scroll(root block)` where the browser supports it, with the
existing `IntersectionObserver` code demoted to a `@supports not` fallback.

Support at time of writing: Chrome/Edge 115+ and Safari 26+ ship it; Firefox does not yet
have it unflagged — **check `caniuse.com/css-animation-timeline` when implementing**. Either
way the fallback covers it, and every one of these effects is decorative: without them the
page reads exactly the same, it is just static.

`view()` measures progress by an element's position, so an element already on screen at
load is already at 100% and never animates. The hero therefore needs a separate
time-based `.reveal-load` variant. This is not a workaround, it is how the API works.

**Reversed for the reveals and the drawings on 2026-09-26.** `.reveal`, `.reveal-clip`,
the drawn underline and the Expertise hub links now fire once on entry
(`IntersectionObserver`, `threshold .06`, `rootMargin -8%` on the bottom edge) and play a
700ms transition on `--ease-out-quint`, which is wigin.ai's model measured token for
token — see `2026-09-21-wigin-effects-design.md` §2. The one exception is the headline
wipe (`.reveal-clip`), which plays its keyframes on `data-inview` instead of transitioning:
Chromium's IntersectionObserver clips the target by its own `clip-path`, so a heading parked
behind an empty mask never intersects. The hidden state is opacity and transform only. The
hero underline gets a `-load` variant (`DrawnUnderline mode="load"`) for the same reason the
hero text does. The scroll-scrubbed version could be
parked half-done between two flicks of the wheel and replayed backwards on every
scroll-up, so a reveal never _arrived_; that is what was asked to change. The observer is
the only path now (no `@supports` fork), `reveal-load` keeps the hero on the same clock,
and the scroll timeline remains where scroll position IS the effect: the header, the
background drift, the art parallax and shutter. (The pinned Work trio was on that list
until later the same day; see the last note below.)

> **Added 2026-09-26, the wheel's inertia.** A mouse wheel scrolls in steps and stops dead;
> the owner asked for momentum that decays ("quán tính khi lướt để nó chạy chậm dần"). The
> spec of 2026-09-21 ruled out Lenis and any smooth-scroll; what ships instead is
> `components/motion/smooth-scroll.tsx`, ~100 lines and no dependency: each wheel notch is
> added to a target, and every frame the real scroll position closes 10% of the remaining
> distance (normalised to the frame's length, so 120Hz covers the same ground per
> millisecond). The page is scrolled for real with `scrollTo({behavior: 'instant'})`, so
> the observer, the view timelines, the sticky header and the scrollbar see an ordinary
> scroll. It stands down for a coarse pointer, for reduced motion, for sideways and
> ctrl-wheel, for a nested scroller with room, and the moment anything else moves the
> page. Verified in Chromium with a real synthetic notch (27 → 100 over 0.75s).
>
> **Same day, inertia on every device.** The first version also stood down for a trackpad,
> guessing the device from whole-number deltas and the 120-unit `wheelDeltaY` grid. On
> macOS that guess fails: trackpads, Magic Mice and smooth-wheel mice all send accelerated,
> off-grid deltas, so on the owner's machine the inertia came and went. A throwaway lab page
> (the built page plus a panel, never committed) offered three modes side by side: the
> shipped heuristic, no smoothing, and inertia on every device. The owner chose the last.
> The heuristic, its half-second trackpad hold and their tests are gone; every vertical
> wheel event now feeds the same target at the same 0.1 per 60Hz frame.
>
> **Same day, the signal.** The drawn art's wires (chip legs, pipeline, stream feeds in
> `site/tech-art.tsx`) carry a packet stream INTO the chip: a dashed overlay path per
> wire, `4 14`, `stroke-dashoffset` running to −18 on a 1.2s linear loop, each wire at
> its own negative delay. Drawn from the outside in, because the dash pattern moves
> towards a path's end; tests/art-signal.test.tsx checks that geometry. The one paint
> property animation on the page, kept small on purpose; gone (not frozen) under reduced
> motion.

> **Same day, the Work trio un-pinned.** Since 2026-09-20 the first three projects were held
> `position: sticky` for 200dvh each while their picture, info panel and name were scrubbed
> in by scroll position (`sections/work.css`, tests/work-pin.test.ts). The owner asked for it
> to go — "đừng cho nó hiển thị dạng chạy dần chữ với hình hiện ra nữa, xấu quá": the text
> sliding in and the picture fading up read as a page still loading. The section is back to
> the layout it had before the pin: five ordinary cards in the grid (the lead two columns
> wide, its measured outcome folded inside), the other four behind "Xem thêm 4 dự án", all
> of them on the same 700ms observer reveal and 80ms stagger as every other list. The pin's
> CSS, its reduced-motion reset, the `allProjects` dictionary line and its test file are
> deleted rather than switched off; tests/work.test.tsx renders the section and asserts the
> cards, the fold and the absence of any `pin-` class.

### 3.4 Effects to build

| #   | Where        | What                                                | Technique                                | JS                       |
| --- | ------------ | --------------------------------------------------- | ---------------------------------------- | ------------------------ |
| 1   | All sections | Reveal on scroll, 16px rise                         | `animation-timeline: view()`             | 0 (fallback only)        |
| 2   | Hero `h1`    | Headline rises **line by line**, 70ms apart         | `overflow:hidden` + `translateY(100%)`   | ~18 lines to split lines |
| 3   | Hero         | Headline scaled up to carry the page                | `clamp(2.4rem, 5.2vw, 4.6rem)`           | 0                        |
| 4   | Hero         | A 1px accent rule draws itself left→right           | `scaleX` + `transform-origin: left`      | 0                        |
| 5   | Header       | Background settles in over the first 8rem of scroll | `animation-timeline: scroll(root block)` | **−17 lines**            |
| 6   | Header       | Scroll progress bar                                 | `animation-timeline: scroll(root block)` | **−8 lines**             |
| 7   | Projects     | Hovering one row dims its siblings to 0.45          | `:has()`                                 | 0                        |
| 8   | Page ground  | Background grid drifts slower than content          | `animation-timeline: scroll(root block)` | 0                        |

Net JS change is expected to be **negative** — the scroll listener and part of the reveal
observer are deleted, and only the headline splitter is added.

### 3.5 Defects found while measuring — fix in the same pass

1. **`favicon.ico` 404s** on every page load (console error).
2. **No `scroll-padding-top`.** The header is `position: sticky` and 65px tall, so every
   in-page anchor lands with its heading hidden underneath it.
3. **`profile.jpeg` is 203 KB at 886×886 and renders at 76×76 CSS px.** It is heavier than
   all the HTML, CSS and JS on the page combined, for an avatar.
4. **Hardcoded colours outside `:root`**: `rgba(10, 11, 12, 0.85)` on `.site-header` and
   `rgba(255, 255, 255, 0.028)` on the body grid. Both must become tokens, otherwise the
   colour gate in §3.6 cannot be turned on.

### 3.6 Quality gates

`npm run verify` must run in CI on every push and fail the build on:

- **`npm test`** — `node --test`, no dependencies, asserting the motion system is actually
  present in the source (tokens declared, `@supports` branches present, reduced-motion rule
  not a blanket kill, JS guards in place).
- **`check:tokens`** — no colour literal (`#hex`, `rgb(`, `rgba(`, `hsl(`) and no literal
  duration in `animation`/`transition` outside the `:root` block of `style.css`.
- **`check:budget`** — HTML + CSS + JS ≤ 40 KB gzip combined; no single image over 40 KB.

These are static-source assertions, not behavioural browser tests. They catch regressions
in the system's _presence_; they cannot tell you an animation looks right. Visual
confirmation stays manual, and §5 lists exactly what to look at.

## 4. Constraints

- **No runtime dependencies and no build step.** The site must stay deployable by copying
  the repo to any static host. npm is introduced for tests and gates only; `node --test` is
  built into Node 22+, so `devDependencies` stays empty and `node_modules` is not needed to
  run `npm test`.
- **One stylesheet.** `style.css` is 1,884 lines, which is large, but splitting it into
  `@import` partials on a no-build static site creates a render-blocking request chain.
  New work goes into a delimited `MOTION SYSTEM` block with the existing comment style.
- **`data.js` stays the single source of copy.** New strings (the headline's line breaks)
  go there in both `en` and `vi`, never inline in `main.js`.
- **The no-JS page must stay readable.** Nothing may be left at `opacity: 0` in a state that
  only JS can clear.
- Node ≥ 22.

## 5. Manual acceptance checklist

Run `npm run serve`, then in a browser:

1. Load `/` — the four headline lines rise in sequence, then the accent rule draws.
2. Scroll down — sections rise into place once each; nothing re-animates on scroll-up.
3. Scroll past the hero — the header background settles in, the 1px progress bar tracks
   scroll position to the bottom of the page.
4. Hover a project row — the other rows dim; the hovered one does not move.
5. Click a nav link — the target heading lands **below** the header, not under it.
6. Enable Reduce Motion in System Settings, reload — every section is visible immediately,
   nothing slides, nothing loops, hover feedback still changes colour.
7. Resize to 390px — the headline still fits, nothing scrolls horizontally.
8. DevTools console — no errors, including no favicon 404.

## 6. Non-goals

- Rebuilding on Next.js, or adopting `@levi-it/design-system` (a private Levi-IT repo; using
  a company design system for a personal portfolio is a licence question, and it is what
  costs the team site 330 KB).
- Changing hosting. The site is static; GitHub Pages with the existing CNAME is fine. Moving
  to Cloudflare Pages would only matter if `_redirects`/`_headers` were needed.
- A light theme.
- Rewriting existing section layouts or copy.
