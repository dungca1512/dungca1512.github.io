# Motion System & Quality Gates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give this static portfolio a documented, enforced motion system — scroll-driven in CSS, with the browser doing the work — while deleting more JavaScript than it adds.

**Architecture:** Every effect is a function of scroll position or page load, so CSS owns all of them via `animation-timeline: view()` / `scroll(root block)`. The existing `IntersectionObserver` code is demoted to a `@supports not (animation-timeline: view())` fallback and the scroll event listener is deleted outright. A five-token duration scale replaces loose millisecond values, and three `node --test` gates (zero dependencies) keep the system from rotting.

**Tech Stack:** Plain HTML/CSS/JS — no framework, no build step, no runtime dependencies. `node --test` (built into Node 22+) for gates. GitHub Actions for CI.

**Spec:** [docs/superpowers/specs/2026-09-15-motion-system.md](docs/superpowers/specs/2026-09-15-motion-system.md)

## Global Constraints

- **No runtime dependencies, no build step.** The site must stay deployable by copying the repo to any static host. `devDependencies` stays empty.
- **Node ≥ 22** (`node --test` and `node:test` are built in; nothing is installed).
- **One stylesheet.** All new CSS goes in `style.css`. Do not split it into `@import` partials — that creates a render-blocking request chain on a no-build site.
- **Aesthetic invariants** (stated at the top of `style.css`, do not violate): no shadows, no gradients as decoration, no `border-radius` above 2px, structure expressed with 1px rules.
- **Animate only** `transform`, `opacity`, `clip-path`, `filter`. Colour properties (`color`, `background-color`, `border-color`) are allowed — they are paint-only. `width`, `height`, `top`, `left` are **not**.
- **Durations come from tokens.** No literal `250ms` / `0.4s` in any new `animation` or `transition` rule.
- **`prefers-reduced-motion` changes the treatment, it does not remove it**: no positional movement, no loops, opacity transitions ≤ 150ms, every element at its final state.
- **All copy lives in `data.js`** in both `en` and `vi`. Never inline a user-visible string in `main.js`.
- **The no-JS page must stay readable.** Nothing may be left at `opacity: 0` in a state only JS can clear.
- **Budget:** HTML + CSS + JS ≤ 40 KB gzip combined; no single image over 40 KB.
- Existing indentation is **4 spaces** in `style.css` and `main.js`. Match it.

---

## File Structure

| File | Status | Responsibility |
| --- | --- | --- |
| `package.json` | create | npm scripts for tests and gates. No dependencies. |
| `tests/helpers.mjs` | create | Reads source files from the repo root for the gates to assert against. |
| `tests/motion-tokens.test.mjs` | create | The duration/easing scale exists on `:root`. |
| `tests/reduced-motion.test.mjs` | create | Reduced motion is a changed treatment, not a blanket kill. |
| `tests/scroll-driven.test.mjs` | create | `@supports` branches and JS guards are present. |
| `tests/hero.test.mjs` | create | Headline is split into lines from `data.js`, both locales. |
| `tests/defects.test.mjs` | create | `scroll-padding-top`, favicon link, avatar size. |
| `scripts/check-tokens.mjs` | create | Fails on colour literals or literal durations outside `:root`. |
| `scripts/check-budget.mjs` | create | Fails on gzip/image budget overrun. |
| `.github/workflows/verify.yml` | create | Runs `npm run verify` on push and PR. |
| `favicon.svg` | create | Fixes the 404; wordmark bar + initial. |
| `profile.webp` | create | 160×160 replacement for the 203 KB / 886px JPEG. |
| `style.css` | modify | Tokens, the `MOTION SYSTEM` block, defect fixes. |
| `main.js` | modify | **Net shrink.** Delete the scroll listener, trim `initReveal`, add the headline splitter. |
| `data.js` | modify | Add `hero.titleLines` for `en` and `vi`. |
| `index.html` | modify | `<h1 id="heroTitle">`, the drawn rule, the favicon link. |

---

### Task 1: Test harness and the motion token scale

Nothing can be asserted until `npm test` runs, and no later task may write a literal duration, so the scale has to exist first. This task delivers both.

**Files:**
- Create: `package.json`
- Create: `tests/helpers.mjs`
- Create: `tests/motion-tokens.test.mjs`
- Modify: `style.css` — the `:root` block at lines 7-27, and delete the duplicate `:root` at lines 1273-1275
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: `tests/helpers.mjs` exporting `css()`, `js()`, `html()`, `data()` — each returns that source file's full text as a `string` — and `rootBlock()` returning the body of the **first** `:root { ... }` block in `style.css` as a `string`. Every later test file imports from here. CSS custom properties `--dur-instant`, `--dur-fast`, `--dur-base`, `--dur-slow`, `--dur-hero`, `--ease-out-soft`, `--ease-spring`, used by every later task.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "portfolio-dungca",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "Static portfolio. No build step - npm is used only for tests and quality gates.",
  "scripts": {
    "test": "node --test tests/",
    "check:tokens": "node scripts/check-tokens.mjs",
    "check:budget": "node scripts/check-budget.mjs",
    "verify": "npm test && npm run check:tokens && npm run check:budget",
    "serve": "python3 -m http.server 8011"
  },
  "engines": {
    "node": ">=22"
  }
}
```

- [ ] **Step 2: Create `tests/helpers.mjs`**

```js
/* The gates assert against the source files themselves. That is a deliberate
   limit: they prove the motion system is PRESENT, not that it looks right.
   Visual confirmation is the manual checklist in the spec, section 5. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const readSource = (name) => readFileSync(join(ROOT, name), 'utf8');

export const css = () => readSource('style.css');
export const js = () => readSource('main.js');
export const html = () => readSource('index.html');
export const data = () => readSource('data.js');

/* The FIRST :root block is the token block. A second one further down the
   sheet would be a bug in its own right - see Task 1, step 6. */
export function rootBlock() {
    const match = css().match(/:root\s*\{([\s\S]*?)\}/);
    if (!match) {
        throw new Error('style.css has no :root block');
    }
    return match[1];
}
```

- [ ] **Step 3: Write the failing test**

Create `tests/motion-tokens.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, rootBlock } from './helpers.mjs';

test('the five duration tokens are declared on :root', () => {
    const block = rootBlock();
    for (const name of ['--dur-instant', '--dur-fast', '--dur-base', '--dur-slow', '--dur-hero']) {
        assert.match(block, new RegExp(`${name}\\s*:\\s*\\d+ms`), `${name} is missing from :root`);
    }
});

test('both easing tokens are declared on :root', () => {
    const block = rootBlock();
    assert.match(block, /--ease-out-soft\s*:\s*cubic-bezier\(/, '--ease-out-soft is missing');
    assert.match(block, /--ease-spring\s*:\s*cubic-bezier\(/, '--ease-spring is missing');
});

test('the original --ease token survives, because existing rules use it', () => {
    assert.match(rootBlock(), /--ease\s*:\s*cubic-bezier\(/, '--ease is missing');
});

test('there is exactly one :root block, so tokens have one home', () => {
    const count = css().match(/:root\s*\{/g) || [];
    assert.equal(count.length, 1, `found ${count.length} :root blocks, expected 1`);
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `--dur-instant is missing from :root`, and `found 2 :root blocks, expected 1`.

- [ ] **Step 5: Add the tokens to the `:root` block in `style.css`**

In the `:root` block near the top of `style.css`, immediately after the `--step: 8px;` line, insert:

```css

    /* ---- Motion scale ----
       One scale for the whole page. A rule that needs a duration picks a token
       from here; it does not invent a number. Enforced by scripts/check-tokens.mjs. */
    --dur-instant: 100ms;   /* colour swap on a button or tag */
    --dur-fast: 150ms;      /* icon, tooltip, reduced-motion ceiling */
    --dur-base: 250ms;      /* row, card, hover state */
    --dur-slow: 400ms;      /* section reveal */
    --dur-hero: 700ms;      /* the headline only */

    /* Decelerates hard at the end: the document settles into place rather than
       coasting to a stop. */
    --ease-out-soft: cubic-bezier(0.2, 0, 0, 1);
    /* Overshoots the target and returns. This, not a longer duration, is what
       makes something feel picked up rather than slid. Use sparingly. */
    --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
    /* Kept as-is: rules throughout this sheet already reference it. */
    --ease: cubic-bezier(0.2, 0.7, 0.2, 1);
```

- [ ] **Step 6: Delete the duplicate `:root` block**

Around line 1273 of `style.css` there is a second `:root` declaring `--ease`. The comment above it explains the easing choice and is worth keeping; the declaration is now a duplicate. Replace:

```css
:root {
    --ease: cubic-bezier(0.2, 0.7, 0.2, 1);
}
```

with:

```css
/* `--ease` and the rest of the motion scale are declared once, in the token
   block at the top of this file. */
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 4 tests passing.

- [ ] **Step 8: Add `node_modules` to `.gitignore`**

Append to `.gitignore`:

```
node_modules/
```

- [ ] **Step 9: Commit**

```bash
git add package.json tests/helpers.mjs tests/motion-tokens.test.mjs style.css .gitignore
git commit -m "feat: add motion token scale and zero-dependency test harness"
```

---

### Task 2: Reduced motion becomes a changed treatment, not a blanket kill

`style.css` currently ends its reduced-motion block with `* { transition: none !important; animation: none !important; }`. That removes hover feedback and state changes along with the decoration, which is worse for the people the rule exists to protect — they lose information, not just movement.

**Files:**
- Create: `tests/reduced-motion.test.mjs`
- Modify: `style.css` — the `@media (prefers-reduced-motion: reduce)` block at lines 1291-1295
- Modify: `main.js` — `initReveal()` at lines 671-680, `initMotion()` at lines 748-760

**Interfaces:**
- Consumes: `--dur-fast` from Task 1. `tests/helpers.mjs` exports `css()` and `js()` from Task 1.
- Produces: a reduced-motion contract every later task relies on — any element that animates itself into place must land at `opacity: 1; transform: none; clip-path: none` under reduced motion. Later tasks add their selectors to the list in step 5.

- [ ] **Step 1: Write the failing test**

Create `tests/reduced-motion.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, js } from './helpers.mjs';

const reducedBlock = () => {
    const match = css().match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(match, 'style.css has no prefers-reduced-motion block');
    return match[1];
};

test('reduced motion does not blanket-kill every animation', () => {
    assert.doesNotMatch(
        reducedBlock(),
        /animation:\s*none\s*!important/,
        'blanket `animation: none !important` removes feedback along with decoration'
    );
});

test('reduced motion does not blanket-kill every transition', () => {
    assert.doesNotMatch(
        reducedBlock(),
        /transition:\s*none\s*!important/,
        'blanket `transition: none !important` removes hover feedback'
    );
});

test('reduced motion keeps colour and opacity feedback, capped at --dur-fast', () => {
    const block = reducedBlock();
    assert.match(block, /transition-property:\s*opacity[^;]*!important/);
    assert.match(block, /transition-duration:\s*var\(--dur-fast\)\s*!important/);
});

test('revealed content lands at its final state under reduced motion', () => {
    const block = reducedBlock();
    assert.match(block, /\.reveal\b/, '.reveal must be reset to its final state');
    assert.match(block, /opacity:\s*1/);
    assert.match(block, /transform:\s*none/);
});

test('reduced motion is handled in CSS, not branched on in the reveal JS', () => {
    const initReveal = js().match(/function initReveal\(\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(initReveal, 'main.js has no initReveal function');
    assert.doesNotMatch(
        initReveal[1],
        /prefers-reduced-motion/,
        'initReveal must not duplicate the CSS reduced-motion rule'
    );
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `blanket \`transition: none !important\` removes hover feedback`.

- [ ] **Step 3: Replace the reduced-motion block in `style.css`**

Find and replace this block (around line 1291):

```css
@media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    .reveal { opacity: 1 !important; transform: none !important; }
    * { transition: none !important; animation: none !important; }
}
```

with:

```css
/* ---------- Reduced motion ----------
   This is a DIFFERENT treatment, not an absent one. Movement through space is
   what causes trouble, so that goes; a short opacity or colour change carries
   the same "this responded to you" signal at no vestibular cost, so it stays.
   Every element that animates itself into place is reset to its final state
   here - if you add such a class, add it to the list below too. */
@media (prefers-reduced-motion: reduce) {
    html {
        scroll-behavior: auto;
    }

    .reveal,
    .reveal-load {
        opacity: 1;
        transform: none;
        clip-path: none;
    }

    /* No positional movement and no loops anywhere. `transition-property` is
       narrowed to the paint-only properties rather than switched off, which is
       why hover states still respond. */
    *,
    *::before,
    *::after {
        animation-duration: 1ms !important;
        animation-iteration-count: 1 !important;
        animation-delay: 0ms !important;
        transition-property: opacity, color, background-color, border-color !important;
        transition-duration: var(--dur-fast) !important;
        transition-delay: 0ms !important;
    }
}
```

- [ ] **Step 4: Remove the reduced-motion branch from `initReveal()` in `main.js`**

CSS now owns this. In `initReveal()`, delete these five lines:

```js
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.classList.remove('js-animate');
        document.querySelectorAll('.reveal').forEach((node) => node.classList.add('is-visible'));
        return;
    }
```

- [ ] **Step 5: Keep the reduced-motion branch in `initMotion()` and say why**

`initMotion()` drives counters and bar widths — data, not decoration — and those must render at their final value rather than at zero. Leave the branch, but replace its comment so the difference from `initReveal` is on the record. Above the `if (prefersReducedMotion() ...)` line in `initMotion()`, insert:

```js
    // Unlike initReveal, this branch stays: these elements carry VALUES, not
    // decoration. With motion reduced they must render at their final number
    // and final width, which CSS alone cannot do for a counted-up figure.
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 9 tests passing.

- [ ] **Step 7: Verify in the browser**

Run `npm run serve`, open `http://localhost:8011/`, enable Reduce Motion in System Settings → Accessibility → Display, and reload. Expected: every section visible immediately, nothing slides, hovering a nav link still changes its colour.

- [ ] **Step 8: Commit**

```bash
git add tests/reduced-motion.test.mjs style.css main.js
git commit -m "fix: treat reduced motion as a changed treatment, not an absent one"
```

---

### Task 3: Scroll-driven reveal replaces the observer

The reveal is a function of an element's position in the viewport, which is exactly what `animation-timeline: view()` computes. Where the browser has it, the observer and its `rootMargin` tuning are dead weight.

**Files:**
- Create: `tests/scroll-driven.test.mjs`
- Modify: `style.css` — the `.js-animate .reveal` rules at lines 1277-1289
- Modify: `main.js` — `initReveal()` at lines 671-717
- Modify: `main.js` — `renderMetrics()` at line 366 and `renderProjects()` at line 500 (the `--reveal-delay` inline styles)

**Interfaces:**
- Consumes: `--dur-slow`, `--ease-out-soft` (Task 1); the reduced-motion contract (Task 2).
- Produces: CSS classes `.reveal` (scroll-driven, for anything below the fold) and `.reveal-load` (time-based, for anything on screen at load — the hero in Task 5 uses it). Both read two custom properties from an element's inline style: `--reveal-i` (integer, 0-7, the stagger index used by the scroll path) and `--reveal-delay` (a `<time>`, used by the fallback and by `.reveal-load`).

- [ ] **Step 1: Write the failing test**

Create `tests/scroll-driven.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, js } from './helpers.mjs';

test('the reveal is driven by a view() timeline where supported', () => {
    const sheet = css();
    assert.match(sheet, /@supports\s*\(animation-timeline:\s*view\(\)\)/);
    assert.match(sheet, /animation-timeline:\s*view\(\)/);
});

test('a fallback branch exists for browsers without scroll-driven animation', () => {
    assert.match(css(), /@supports\s+not\s*\(animation-timeline:\s*view\(\)\)/);
});

test('the fallback stays gated on .js-animate so a no-JS page is not left blank', () => {
    const fallback = css().match(
        /@supports\s+not\s*\(animation-timeline:\s*view\(\)\)\s*\{([\s\S]*?)\n\}/
    );
    assert.ok(fallback, 'no `@supports not (animation-timeline: view())` block found');
    assert.match(fallback[1], /\.js-animate\s+\.reveal/);
    assert.doesNotMatch(
        fallback[1],
        /\n\s*\.reveal\s*\{/,
        'an ungated `.reveal { opacity: 0 }` hides content when JS is unavailable'
    );
});

test('initReveal returns early when the browser drives the reveal itself', () => {
    const initReveal = js().match(/function initReveal\(\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(initReveal, 'main.js has no initReveal function');
    assert.match(initReveal[1], /CSS\.supports\(\s*'animation-timeline:\s*view\(\)'\s*\)/);
});

test('staggered elements carry both an index and a delay, one per reveal path', () => {
    const source = js();
    assert.match(source, /--reveal-i:\$\{/, 'the scroll path staggers by --reveal-i');
    assert.match(source, /--reveal-delay:\$\{/, 'the fallback path staggers by --reveal-delay');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — the first assertion, no `@supports (animation-timeline: view())` in `style.css`.

- [ ] **Step 3: Replace the reveal rules in `style.css`**

Find this block (around line 1277) and replace all of it:

```css
.js-animate .reveal {
    opacity: 0;
    transform: translateY(16px);
    transition:
        opacity 0.6s var(--ease),
        transform 0.6s var(--ease);
    transition-delay: var(--reveal-delay, 0ms);
}

.js-animate .reveal.is-visible {
    opacity: 1;
    transform: none;
}
```

with:

```css
/* ---------- Reveal ----------
   The browser drives this from the element's own position in the viewport. No
   observer, no scroll handler, nothing to keep in sync with the layout.

   `view()` measures progress by POSITION, so anything already on screen when
   the page loads is already at 100% and will never animate. That is why the
   hero uses the time-based `.reveal-load` below instead - it is not a
   workaround, it is how the timeline is defined. */

@keyframes reveal-up {
    from {
        opacity: 0;
        transform: translateY(16px);
    }
}

@supports (animation-timeline: view()) {
    .reveal {
        animation: reveal-up var(--dur-slow) var(--ease-out-soft) both;
        animation-timeline: view();
        /* A scroll timeline ignores `animation-delay` - progress is a position,
           not a clock - so a stagger has to move the RANGE instead. Each step
           is 4% of the element's entry, and `--reveal-i` is capped at 7 by the
           caller: past eight steps the last item arrives after you have already
           scrolled by it. */
        animation-range: entry calc(8% + (var(--reveal-i, 0) * 4%)) cover 26%;
    }
}

/* On screen at load, so it needs a clock rather than a position. */
.reveal-load {
    animation: reveal-up var(--dur-slow) var(--ease-out-soft) both;
    animation-delay: var(--reveal-delay, 0ms);
}

/* Browsers without scroll-driven animation fall back to the observer in
   main.js. Gated on `.js-animate`, which only JS can set: an ungated
   `opacity: 0` here would blank the page whenever JS fails to run. */
@supports not (animation-timeline: view()) {
    .js-animate .reveal {
        opacity: 0;
        transform: translateY(16px);
        transition:
            opacity var(--dur-slow) var(--ease-out-soft),
            transform var(--dur-slow) var(--ease-out-soft);
        transition-delay: var(--reveal-delay, 0ms);
    }

    .js-animate .reveal.is-visible {
        opacity: 1;
        transform: none;
    }
}
```

- [ ] **Step 4: Replace `initReveal()` in `main.js`**

Replace the whole function (lines 671-717 before this task's edits, now shorter after Task 2) with:

```js
function initReveal() {
    if (state.revealObserver) {
        state.revealObserver.disconnect();
        state.revealObserver = null;
    }

    // Path 1: the browser runs the reveal from scroll position on its own -
    // see the `@supports (animation-timeline: view())` block in style.css.
    // There is nothing for JS to do, and `.js-animate` stays off so the
    // fallback rules never apply.
    if (CSS.supports('animation-timeline: view()')) {
        return;
    }

    // Path 2: older browser. `.js-animate` arms the transition-based fallback,
    // and it is only ever set from here - so it cannot be left armed on a page
    // where JS died before it could disarm it.
    document.documentElement.classList.add('js-animate');

    const revealNodes = Array.from(document.querySelectorAll('.reveal'));

    if (!('IntersectionObserver' in window)) {
        revealNodes.forEach((node) => node.classList.add('is-visible'));
        return;
    }

    state.revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -12% 0px' });

    revealNodes.forEach((node) => {
        // Already on screen at load: show it now rather than waiting for a
        // scroll that may never come.
        if (node.getBoundingClientRect().top < window.innerHeight * 0.92) {
            node.classList.add('is-visible');
            return;
        }

        node.classList.remove('is-visible');
        state.revealObserver.observe(node);
    });
}
```

- [ ] **Step 5: Emit both stagger variables in `renderMetrics()`**

In `renderMetrics()`, replace this line:

```js
            <article class="metric-card reveal" style="--reveal-delay:${index * 80}ms">
```

with:

```js
            <article class="metric-card reveal" style="--reveal-i:${Math.min(index, 7)}; --reveal-delay:${Math.min(index, 7) * 80}ms">
```

- [ ] **Step 6: Emit both stagger variables in `renderProjects()`**

In `renderProjects()`, replace this line:

```js
                <article class="project-row reveal" style="--reveal-delay:${index * 60}ms">
```

with:

```js
                <article class="project-row reveal" style="--reveal-i:${Math.min(index, 7)}; --reveal-delay:${Math.min(index, 7) * 60}ms">
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 14 tests passing.

- [ ] **Step 8: Verify in the browser**

Run `npm run serve` and open `http://localhost:8011/` in Chrome. Scroll slowly: each section should rise into place once. Then open DevTools → Console and run `document.documentElement.classList.contains('js-animate')` — expected `false` in Chrome, confirming the observer path is not running at all.

- [ ] **Step 9: Commit**

```bash
git add tests/scroll-driven.test.mjs style.css main.js
git commit -m "perf: drive section reveals from a view() timeline instead of an observer"
```

---

### Task 4: Header and scroll progress move to CSS, deleting the scroll listener

Both are pure functions of `window.scrollY`, recomputed on every scroll event by hand. `scroll(root block)` is the same function, computed by the compositor.

**Files:**
- Create: `tests/header-scroll.test.mjs`
- Modify: `style.css` — `.site-header` at lines 118-125, `.scroll-progress` at lines 1711-1721, and the `:root` token block
- Modify: `main.js` — `initHeader()` at lines 600-616

**Interfaces:**
- Consumes: `--dur-base` (Task 1); `--line` (existing token).
- Produces: token `--bg-header` on `:root`, replacing the hardcoded `rgba(10, 11, 12, 0.85)`. The colour gate in Task 9 depends on this literal being gone.

- [ ] **Step 1: Write the failing test**

Create `tests/header-scroll.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, js, rootBlock } from './helpers.mjs';

test('the header background is a token, not a literal', () => {
    assert.match(rootBlock(), /--bg-header\s*:/);
    assert.doesNotMatch(css(), /rgba\(10,\s*11,\s*12,\s*0\.85\)(?![^{]*\})/);
});

test('the header settles in on a root scroll timeline', () => {
    assert.match(css(), /animation-timeline:\s*scroll\(root block\)/);
});

test('the scroll progress bar is driven by CSS, not by a transform written from JS', () => {
    assert.doesNotMatch(js(), /progress\.style\.transform/);
});

test('initHeader returns early where CSS drives both effects', () => {
    const initHeader = js().match(/function initHeader\(\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(initHeader, 'main.js has no initHeader function');
    assert.match(initHeader[1], /CSS\.supports\(\s*'animation-timeline:\s*scroll\(root block\)'\s*\)/);
});

test('no scroll event listener survives in main.js', () => {
    assert.doesNotMatch(
        js(),
        /addEventListener\(\s*'scroll'/,
        'a scroll listener runs on every frame of every scroll - CSS does this for free'
    );
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `--bg-header` is not in `:root`.

- [ ] **Step 3: Add the `--bg-header` token**

In the `:root` block of `style.css`, after the `--ok: #6f9c6a;` line, add:

```css
    /* Header over content: opaque enough to read against, sheer enough that the
       page is visibly still there behind it. */
    --bg-header: rgba(10, 11, 12, 0.85);
```

- [ ] **Step 4: Rewrite `.site-header` in `style.css`**

Replace:

```css
.site-header {
    position: sticky;
    top: 0;
    z-index: 80;
    border-bottom: 1px solid var(--line);
    background: rgba(10, 11, 12, 0.85);
    backdrop-filter: blur(8px);
}
```

with:

```css
.site-header {
    position: sticky;
    top: 0;
    z-index: 80;
    border-bottom: 1px solid var(--line);
    background: var(--bg-header);
    backdrop-filter: blur(8px);
}

/* ---------- Header on scroll ----------
   Over the hero the header is transparent and the page runs under it; by 8rem
   of scroll it has settled into its own surface. Colour only - animating
   `padding` or `height` here would relayout the page on every frame. */

@keyframes header-settle {
    from {
        background-color: transparent;
        border-bottom-color: transparent;
    }
    to {
        background-color: var(--bg-header);
        border-bottom-color: var(--line);
    }
}

@keyframes progress-grow {
    from {
        transform: scaleX(0);
    }
    to {
        transform: scaleX(1);
    }
}

@supports (animation-timeline: scroll(root block)) {
    .site-header {
        animation: header-settle var(--dur-base) linear both;
        animation-timeline: scroll(root block);
        animation-range: 0 8rem;
    }

    /* No range: the default covers the whole document, which is exactly what a
       progress bar means. */
    .scroll-progress {
        animation: progress-grow var(--dur-base) linear both;
        animation-timeline: scroll(root block);
    }
}
```

- [ ] **Step 5: Replace `initHeader()` in `main.js`**

Replace the whole function with:

```js
function initHeader() {
    // Both the settling background and the progress bar are functions of scroll
    // position, so CSS computes them where scroll-driven animation exists - see
    // "Header on scroll" in style.css. A scroll listener is the fallback, not
    // the design.
    if (CSS.supports('animation-timeline: scroll(root block)')) {
        return;
    }

    const header = byId('siteHeader');
    const progress = byId('scrollProgress');

    const onScroll = () => {
        header.classList.toggle('scrolled', window.scrollY > 8);

        if (progress) {
            const scrollable = document.documentElement.scrollHeight - window.innerHeight;
            const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
            progress.style.transform = `scaleX(${Math.min(Math.max(ratio, 0), 1)})`;
        }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}
```

- [ ] **Step 6: Run the test to verify it fails on the two listener assertions**

Run: `npm test`
Expected: FAIL — `a scroll listener runs on every frame of every scroll` and `progress.style.transform`. The fallback body still contains both, which is the point of the next step: the assertions demand the fallback live somewhere the gate does not read as the primary path.

- [ ] **Step 7: Move the fallback into its own named function**

Replace the `initHeader()` written in step 5 with:

```js
function initHeader() {
    // Both the settling background and the progress bar are functions of scroll
    // position, so CSS computes them where scroll-driven animation exists - see
    // "Header on scroll" in style.css.
    if (CSS.supports('animation-timeline: scroll(root block)')) {
        return;
    }

    initHeaderScrollFallback();
}

/* Only reached on browsers without scroll-driven animation. Everything here is
   a hand-rolled copy of what the CSS above does for free, so it is kept in one
   clearly-named place rather than inlined as if it were the real design. */
function initHeaderScrollFallback() {
    const header = byId('siteHeader');
    const progress = byId('scrollProgress');

    const onScroll = () => {
        header.classList.toggle('scrolled', window.scrollY > 8);

        if (progress) {
            const scrollable = document.documentElement.scrollHeight - window.innerHeight;
            const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
            progress.style.transform = `scaleX(${Math.min(Math.max(ratio, 0), 1)})`;
        }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}
```

Then narrow the two assertions in `tests/header-scroll.test.mjs` so they check the primary path rather than the whole file. Replace those two tests with:

```js
test('the scroll progress bar is driven by CSS, not by a transform written from the main path', () => {
    const initHeader = js().match(/function initHeader\(\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(initHeader, 'main.js has no initHeader function');
    assert.doesNotMatch(initHeader[1], /progress\.style\.transform/);
});

test('the scroll listener lives only in the clearly-named fallback', () => {
    const source = js();
    const listeners = source.match(/addEventListener\(\s*'scroll'/g) || [];
    assert.equal(listeners.length, 1, 'expected exactly one scroll listener, in the fallback');

    const fallback = source.match(/function initHeaderScrollFallback\(\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(fallback, 'the scroll listener must live in initHeaderScrollFallback');
    assert.match(fallback[1], /addEventListener\(\s*'scroll'/);
});
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 19 tests passing.

- [ ] **Step 9: Verify in the browser**

Run `npm run serve`, open `http://localhost:8011/` in Chrome. At the top, the header should be transparent over the hero; scrolling past 8rem it gains its background. The 1px amber bar at the header's bottom edge should track scroll position and reach full width at the bottom of the page. In DevTools → Performance, record a scroll: there should be no scripting entries from `main.js`.

- [ ] **Step 10: Commit**

```bash
git add tests/header-scroll.test.mjs style.css main.js
git commit -m "perf: drive header and scroll progress from a scroll timeline"
```

---

### Task 5: The hero headline rises line by line

The headline is the page's one chance to be memorable and it currently renders at `clamp(2rem, 4vw, 3.4rem)` with no entrance at all. Lines, not words: a word-by-word reveal gives the eye nine things to track at once and reads worse.

**Files:**
- Create: `tests/hero.test.mjs`
- Modify: `data.js` — the `i18n.hero` block at lines 42-54
- Modify: `main.js` — add `escapeHtml()` and `renderHeroTitle()`, call it from `renderHero()` at line 327
- Modify: `index.html` — the `<h1>` at line 59
- Modify: `style.css` — `.hero-copy h1` at lines 271-281

**Interfaces:**
- Consumes: `.reveal-load`, `--reveal-delay` (Task 3); `--dur-hero`, `--ease-out-soft` (Task 1); the reduced-motion contract (Task 2); existing `t(value)` and `byId(id)` helpers in `main.js`.
- Produces: `PORTFOLIO_DATA.i18n.hero.titleLines` — an object `{ en: string[], vi: string[] }`. `renderHeroTitle(): void` reads it and writes the `#heroTitle` element. `escapeHtml(value: unknown): string`. CSS classes `.hero-line` (the clipping block) and `.rule-draw` (the self-drawing 1px rule).

- [ ] **Step 1: Write the failing test**

Create `tests/hero.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, js, html, data } from './helpers.mjs';

test('the headline has authored line breaks in both locales', () => {
    const source = data();
    assert.match(source, /titleLines:\s*\{/, 'data.js has no hero.titleLines');

    const block = source.match(/titleLines:\s*\{([\s\S]*?)\n\s{12}\}/);
    assert.ok(block, 'hero.titleLines is not shaped as expected');
    assert.match(block[1], /en:\s*\[/, 'titleLines.en is missing');
    assert.match(block[1], /vi:\s*\[/, 'titleLines.vi is missing');
});

test('the single-string title survives as the no-JS and meta fallback', () => {
    assert.match(data(), /title:\s*\{[\s\S]{0,200}?en:\s*'/, 'hero.title must stay');
});

test('renderHeroTitle splits the headline into clipping blocks', () => {
    const source = js();
    assert.match(source, /function renderHeroTitle\(\)/);
    assert.match(source, /class="hero-line"/);
});

test('renderHeroTitle escapes the copy it interpolates', () => {
    const source = js();
    assert.match(source, /function escapeHtml\(/);

    const fn = source.match(/function renderHeroTitle\(\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(fn, 'main.js has no renderHeroTitle function');
    assert.match(fn[1], /escapeHtml\(/);
});

test('renderHeroTitle falls back to the plain title when lines are absent', () => {
    const fn = js().match(/function renderHeroTitle\(\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(fn);
    assert.match(fn[1], /Array\.isArray\(/);
});

test('renderHero calls renderHeroTitle, so the headline follows the language switch', () => {
    const fn = js().match(/function renderHero\(\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(fn, 'main.js has no renderHero function');
    assert.match(fn[1], /renderHeroTitle\(\)/);
});

test('the h1 is addressable by id and keeps its no-JS text', () => {
    const source = html();
    assert.match(source, /<h1 id="heroTitle"[^>]*>[^<]+<\/h1>/);
    assert.doesNotMatch(
        source,
        /<h1[^>]*data-i18n="hero\.title"/,
        'the generic i18n pass would overwrite the split lines with one string'
    );
});

test('the headline is scaled up to carry the page', () => {
    const rule = css().match(/\.hero-copy h1\s*\{([\s\S]*?)\n\}/);
    assert.ok(rule, 'style.css has no .hero-copy h1 rule');

    const max = rule[1].match(/font-size:\s*clamp\([^,]+,[^,]+,\s*([\d.]+)rem\s*\)/);
    assert.ok(max, '.hero-copy h1 must set a clamp() font-size');
    assert.ok(Number(max[1]) >= 4, `headline maxes out at ${max[1]}rem, expected at least 4rem`);
});

test('each line clips to its own baseline', () => {
    const rule = css().match(/\.hero-line\s*\{([\s\S]*?)\n\}/);
    assert.ok(rule, 'style.css has no .hero-line rule');
    assert.match(rule[1], /overflow:\s*hidden/);
});

test('the accent rule draws itself from the left', () => {
    const sheet = css();
    const rule = sheet.match(/\.rule-draw\s*\{([\s\S]*?)\n\}/);
    assert.ok(rule, 'style.css has no .rule-draw rule');
    assert.match(rule[1], /transform-origin:\s*left/);
    assert.match(sheet, /@keyframes rule-draw\b/);
    assert.match(html(), /class="rule-draw"/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `data.js has no hero.titleLines`.

- [ ] **Step 3: Add `titleLines` to `data.js`**

In the `hero:` block, immediately after the closing brace of `title: { ... },`, insert:

```js
            /* The headline is set line by line so each line can rise out of its
               own baseline. Break where the sense breaks, not where the box
               happens to end - and keep both locales to the same line count so
               the stagger reads the same in either language. */
            titleLines: {
                en: [
                    'AI/MLOps engineer,',
                    '3+ years shipping',
                    'production AI',
                    'end-to-end.'
                ],
                vi: [
                    'Kỹ sư AI/MLOps,',
                    '3+ năm đưa AI',
                    'vào production',
                    'trọn vòng.'
                ]
            },
```

- [ ] **Step 4: Add `escapeHtml()` to `main.js`**

Immediately after the `t(value)` function (around line 33), insert:

```js
/* Copy comes from data.js, not from a user - but it is interpolated into
   innerHTML, and "the input is trusted" is exactly the assumption that stops
   being true later. */
function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}
```

- [ ] **Step 5: Add `renderHeroTitle()` to `main.js`**

Immediately before `function renderHero()`, insert:

```js
/* Lines, not words. A word-by-word reveal puts nine moving things in front of
   the eye at once; it reads worse and takes longer to become readable. */
function renderHeroTitle() {
    const el = byId('heroTitle');
    if (!el) {
        return;
    }

    const lines = t(PORTFOLIO_DATA.i18n.hero.titleLines);

    // No authored line breaks for this locale: render the single string. The
    // headline still reveals, just as one block.
    if (!Array.isArray(lines) || lines.length === 0) {
        el.textContent = t(PORTFOLIO_DATA.i18n.hero.title);
        return;
    }

    el.innerHTML = lines
        .map((line, index) => {
            // 120ms lets the page paint before anything moves; 70ms apart is
            // close enough to read as one gesture rather than four events.
            const delay = 120 + index * 70;
            return `<span class="hero-line"><span class="reveal-load" style="--reveal-delay:${delay}ms">${escapeHtml(line)}</span></span>`;
        })
        .join('');
}
```

- [ ] **Step 6: Call it from `renderHero()` in `main.js`**

As the first statement inside `renderHero()`, before the `byId('profileLocation')` line, insert:

```js
    renderHeroTitle();
```

- [ ] **Step 7: Update the `<h1>` and add the drawn rule in `index.html`**

Replace:

```html
                    <h1 data-i18n="hero.title">AI/MLOps engineer, 3+ years shipping production AI end-to-end.</h1>
```

with:

```html
                    <!-- Text stays in the markup as the no-JS headline; renderHeroTitle()
                         replaces it with one clipping block per line. No data-i18n here:
                         the generic pass would flatten it back to a single string. -->
                    <h1 id="heroTitle">AI/MLOps engineer, 3+ years shipping production AI end-to-end.</h1>
                    <span class="rule-draw" aria-hidden="true"></span>
```

- [ ] **Step 8: Replace the headline CSS in `style.css`**

Replace the `.hero-copy h1` rule:

```css
.hero-copy h1 {
    /* Bigger and tighter — the headline should carry the page, not sit
       at the same weight as the paragraph under it. */
    font-size: clamp(2rem, 4vw, 3.4rem);
    letter-spacing: -0.025em;
    line-height: 1.14;
    margin: 20px 0 22px;
    max-width: 17ch;
    /* Even out the ragged edge and stop "end-to-end" splitting at its hyphen. */
    text-wrap: balance;
    hyphens: none;
}
```

with:

```css
.hero-copy h1 {
    /* The headline carries the page. At 3.4rem it sat at conversational weight
       with the paragraph under it; at 4.6rem it is the first thing read. */
    font-size: clamp(2.4rem, 5.2vw, 4.6rem);
    letter-spacing: -0.03em;
    line-height: 1.04;
    margin: 20px 0 18px;
    /* No `text-wrap: balance` and no `max-width` in ch: the line breaks are
       authored in data.js, so letting the browser rebalance them would fight
       the copy. `hyphens: none` still matters - it stops "end-to-end" breaking
       at its own hyphen when a line does wrap on a narrow screen. */
    hyphens: none;
}

/* ---------- Hero headline ----------
   Each line sits in its own clipping block, so the text rises out of its own
   baseline rather than sliding up through empty space below it. Remove the
   `overflow: hidden` and the effect becomes a generic slide-up. */

@keyframes hero-line-in {
    from {
        opacity: 0;
        transform: translateY(100%);
    }
}

.hero-line {
    display: block;
    overflow: hidden;
    /* Descenders in "g" and "ạ" sit below the baseline and would be shaved off
       by the clip without this. */
    padding-bottom: 0.08em;
}

.hero-line > span {
    display: block;
    animation: hero-line-in var(--dur-hero) var(--ease-out-soft) both;
    animation-delay: var(--reveal-delay, 0ms);
}

/* A 1px rule that draws itself left to right - the technical-document
   equivalent of a signature. Measured, not sketched: no squiggle, no radius. */
@keyframes rule-draw {
    from {
        transform: scaleX(0);
    }
}

.rule-draw {
    display: block;
    width: min(100%, 22rem);
    height: 1px;
    margin-bottom: 22px;
    background: var(--accent);
    transform-origin: left;
    animation: rule-draw var(--dur-hero) var(--ease-out-soft) both;
    /* Starts as the last headline line lands, so the page signs itself off. */
    animation-delay: 430ms;
}
```

- [ ] **Step 9: Add the new classes to the reduced-motion reset**

In the `@media (prefers-reduced-motion: reduce)` block, extend the final-state selector list from:

```css
    .reveal,
    .reveal-load {
```

to:

```css
    .reveal,
    .reveal-load,
    .hero-line > span,
    .rule-draw {
```

- [ ] **Step 10: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 29 tests passing.

- [ ] **Step 11: Verify in the browser**

Run `npm run serve`, open `http://localhost:8011/`. Expected: four headline lines rise in sequence out of their own baselines, then the amber rule draws left to right. Click `vi` — the Vietnamese headline renders as four lines and re-animates. Resize to 390px wide: the headline still fits and the page does not scroll sideways. Turn on Reduce Motion and reload: all four lines and the rule are simply there.

- [ ] **Step 12: Commit**

```bash
git add tests/hero.test.mjs data.js main.js index.html style.css
git commit -m "feat: reveal the hero headline line by line and scale it to carry the page"
```

---

### Task 6: Hovering a project row dims its siblings

`:has()` lets the container react to a child's hover state, so focus is expressed with no class toggling and no JS at all.

**Files:**
- Create: `tests/has-dim.test.mjs`
- Modify: `style.css` — add to the projects section

**Interfaces:**
- Consumes: `--dur-base`, `--ease-out-soft` (Task 1). Existing `#projectsGrid` container and `.project-row` articles emitted by `renderProjects()`.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Write the failing test**

Create `tests/has-dim.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css } from './helpers.mjs';

test('hovering one project row dims the others, using :has()', () => {
    assert.match(css(), /#projectsGrid:has\(\.project-row:hover\)\s+\.project-row:not\(:hover\)/);
});

test('the dim is gated to real pointers, so it never sticks on touch', () => {
    const sheet = css();
    const index = sheet.indexOf('#projectsGrid:has(');
    assert.ok(index > -1, 'the :has() dim rule is missing');

    const guard = sheet.lastIndexOf('@media (hover: hover) and (pointer: fine)', index);
    assert.ok(guard > -1, 'the :has() dim rule must sit inside a hover/fine-pointer query');
});

test('the dim animates opacity only', () => {
    const rule = css().match(/#projectsGrid:has\(\.project-row:hover\)\s+\.project-row:not\(:hover\)\s*\{([\s\S]*?)\n\s*\}/);
    assert.ok(rule, 'the :has() dim rule is missing');
    assert.match(rule[1], /opacity:\s*0?\.\d+/);
    assert.doesNotMatch(rule[1], /transform:/, 'moving the siblings would shift the row you are reading');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `the :has() dim rule is missing`.

- [ ] **Step 3: Add the rule to `style.css`**

Immediately after the `.project-row:hover::before, .project-row:focus-within::before` rule (around line 1802), add:

```css
/* ---------- Focus by subtraction ----------
   The container reacts to a child's hover state, so nothing has to be toggled
   and nothing has to be observed. Opacity only: nudging the siblings would
   shift the row being read.

   A touch device fires `:hover` on tap and then keeps it until you tap
   elsewhere, which would leave five rows dimmed with no way to tell why - hence
   the pointer query. */
@media (hover: hover) and (pointer: fine) {
    .project-row {
        transition: opacity var(--dur-base) var(--ease-out-soft);
    }

    #projectsGrid:has(.project-row:hover) .project-row:not(:hover) {
        opacity: 0.45;
    }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 32 tests passing.

- [ ] **Step 5: Verify in the browser**

Run `npm run serve`, open `http://localhost:8011/#projects` with a mouse. Hovering one row should dim the rest; no row should move. Then open DevTools → Device Toolbar (touch emulation) and tap a row: nothing should dim.

- [ ] **Step 6: Commit**

```bash
git add tests/has-dim.test.mjs style.css
git commit -m "feat: dim sibling project rows on hover with :has()"
```

---

### Task 7: The background grid drifts behind the content

The page already has a 1px technical grid, painted flat on `body`. Moving it slower than the content gives the page depth without adding a single decorative element — and it is the one parallax that suits a document.

**Files:**
- Create: `tests/grid-drift.test.mjs`
- Modify: `style.css` — the `body` rule at lines 41-53, and the `:root` token block

**Interfaces:**
- Consumes: `scroll(root block)` timeline pattern (Task 4).
- Produces: token `--grid-line` on `:root`, replacing the two hardcoded `rgba(255, 255, 255, 0.028)` values. The colour gate in Task 9 depends on those literals being gone.

- [ ] **Step 1: Write the failing test**

Create `tests/grid-drift.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, rootBlock } from './helpers.mjs';

test('the grid line colour is a token', () => {
    assert.match(rootBlock(), /--grid-line\s*:/);
    assert.doesNotMatch(css(), /rgba\(255,\s*255,\s*255,\s*0\.028\)/);
});

test('the grid moved off body onto its own fixed layer', () => {
    const bodyRule = css().match(/\nbody\s*\{([\s\S]*?)\n\}/);
    assert.ok(bodyRule, 'style.css has no body rule');
    assert.doesNotMatch(bodyRule[1], /background-image:/, 'the grid belongs on body::before now');

    const layer = css().match(/body::before\s*\{([\s\S]*?)\n\}/);
    assert.ok(layer, 'style.css has no body::before grid layer');
    assert.match(layer[1], /position:\s*fixed/);
    assert.match(layer[1], /z-index:\s*-1/);
    assert.match(layer[1], /pointer-events:\s*none/);
});

test('the grid drifts on a scroll timeline', () => {
    const sheet = css();
    assert.match(sheet, /@keyframes grid-drift\b/);
    assert.match(sheet, /@supports\s*\(animation-timeline:\s*scroll\(root\)\)/);
});

test('the drift moves only transform', () => {
    const frames = css().match(/@keyframes grid-drift\s*\{([\s\S]*?)\n\}/);
    assert.ok(frames, 'no grid-drift keyframes');
    assert.match(frames[1], /transform:\s*translateY\(/);
    assert.doesNotMatch(frames[1], /background-position:/, 'background-position repaints the whole layer');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `--grid-line` is not in `:root`.

- [ ] **Step 3: Add the `--grid-line` token**

In the `:root` block of `style.css`, after the `--bg-header` line added in Task 4, add:

```css
    /* The technical grid. At 2.8% it should register as paper texture, not as
       a visible table. */
    --grid-line: rgba(255, 255, 255, 0.028);
```

- [ ] **Step 4: Move the grid off `body` in `style.css`**

In the `body` rule, delete these five lines:

```css
    /* Faint technical grid — 1px lines at 4% opacity, not a decorative gradient. */
    background-image:
        linear-gradient(to right, rgba(255, 255, 255, 0.028) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.028) 1px, transparent 1px);
    background-size: 64px 64px;
```

Then, immediately after the closing brace of the `body` rule, add:

```css
/* ---------- The page's ground ----------
   A faint 1px technical grid - the page's paper, not a decorative gradient.

   It lives on its own fixed layer rather than on `body` for one reason: a
   layer can be transformed, and a background-image cannot be moved without
   repainting it. The grid drifts up about 6% of the viewport over the whole
   document, so it reads as ground the content passes over rather than as
   wallpaper stuck to it.

   `inset: -8vh 0` gives the drift somewhere to travel without exposing an
   uncovered strip at either edge. */

@keyframes grid-drift {
    to {
        transform: translateY(-6vh);
    }
}

body::before {
    content: '';
    position: fixed;
    inset: -8vh 0;
    z-index: -1;
    pointer-events: none;
    background-image:
        linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
        linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px);
    background-size: 64px 64px;
}

@supports (animation-timeline: scroll(root)) {
    body::before {
        animation: grid-drift linear both;
        animation-timeline: scroll(root block);
    }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 36 tests passing.

- [ ] **Step 6: Verify in the browser**

Run `npm run serve`, open `http://localhost:8011/`. The grid must still be visible behind the content and behind nothing else — check that no section background now covers it and that no text has lost its background. Scroll to the bottom: the grid should have drifted slightly upward relative to the content, and no uncovered strip should appear at the top or bottom edge.

- [ ] **Step 7: Commit**

```bash
git add tests/grid-drift.test.mjs style.css
git commit -m "feat: drift the background grid on a scroll timeline"
```

---

### Task 8: Fix the three measured defects

All three were found by measuring the running site, not by reading the code. None are cosmetic: one is a console error on every load, one breaks every in-page link, and one is a 203 KB image rendered at 76 px.

**Files:**
- Create: `tests/defects.test.mjs`
- Create: `favicon.svg`
- Create: `profile.webp`
- Modify: `index.html` — `<head>`, and the avatar `<img>`
- Modify: `style.css` — the `html` rule at lines 34-37
- Modify: `data.js` — `profile.avatarUrl`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing later tasks depend on, except that `check:budget` in Task 9 will fail unless `profile.webp` replaces `profile.jpeg` as the referenced avatar.

- [ ] **Step 1: Write the failing test**

Create `tests/defects.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { css, html, data, ROOT } from './helpers.mjs';

test('anchors clear the sticky header', () => {
    const rule = css().match(/\nhtml\s*\{([\s\S]*?)\n\}/);
    assert.ok(rule, 'style.css has no html rule');

    const padding = rule[1].match(/scroll-padding-top:\s*([\d.]+)rem/);
    assert.ok(padding, 'html needs scroll-padding-top or every anchor lands under the header');
    assert.ok(
        Number(padding[1]) >= 4.5,
        `scroll-padding-top is ${padding[1]}rem; the header is ~4.1rem tall, so it needs at least 4.5rem`
    );
});

test('a favicon is declared and present, so the page stops 404ing on load', () => {
    assert.match(html(), /<link[^>]+rel="icon"[^>]+href="favicon\.svg"/);
    assert.ok(existsSync(join(ROOT, 'favicon.svg')), 'favicon.svg does not exist');
});

test('the avatar is sized for how it renders, not for how it was exported', () => {
    const file = join(ROOT, 'profile.webp');
    assert.ok(existsSync(file), 'profile.webp does not exist');
    assert.ok(
        statSync(file).size < 20 * 1024,
        `profile.webp is ${Math.round(statSync(file).size / 1024)}KB; it renders at 76px and must stay under 20KB`
    );
});

test('nothing still points at the 203KB original', () => {
    assert.doesNotMatch(data(), /profile\.jpeg/);
    assert.doesNotMatch(html(), /profile\.jpeg/);
});

test('the avatar reserves its space, so it cannot shift the layout', () => {
    const img = html().match(/<img[^>]+id="heroAvatar"[^>]*>/);
    assert.ok(img, 'index.html has no #heroAvatar image');
    assert.match(img[0], /width="\d+"/);
    assert.match(img[0], /height="\d+"/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `html needs scroll-padding-top or every anchor lands under the header`.

- [ ] **Step 3: Add `scroll-padding-top` in `style.css`**

In the `html` rule, add the third declaration:

```css
html {
    scroll-behavior: smooth;
    -webkit-text-size-adjust: 100%;
    /* The header is sticky and ~4.1rem tall. Without this every in-page link
       lands with its own heading hidden underneath it. */
    scroll-padding-top: 5rem;
}
```

- [ ] **Step 4: Create `favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="cong anh dung">
  <rect width="32" height="32" fill="#0a0b0c"/>
  <rect x="5" y="6" width="3" height="20" fill="#c8944b"/>
  <text x="12" y="24" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="18" font-weight="600" fill="#e7e5e1">d</text>
</svg>
```

- [ ] **Step 5: Link the favicon in `index.html`**

Immediately after the `<meta name="theme-color" ...>` line, add:

```html
    <link rel="icon" href="favicon.svg" type="image/svg+xml">
```

- [ ] **Step 6: Generate `profile.webp`**

The source is 886×886 and renders at 76 CSS px, so 160px covers a 2× display with room to spare.

```bash
cwebp -q 82 -resize 160 160 profile.jpeg -o profile.webp && ls -l profile.webp
```

Expected: a file well under 20 KB — down from 203 KB. If `cwebp` is not installed: `brew install webp`.

- [ ] **Step 7: Point `data.js` at the new file**

In `data.js`, in the `profile` block, change:

```js
        avatarUrl: 'profile.jpeg',
```

to:

```js
        avatarUrl: 'profile.webp',
```

If the current value differs, search `data.js` for `profile.jpeg` and replace that occurrence.

- [ ] **Step 8: Reserve the avatar's space in `index.html`**

Find the `<img ... id="heroAvatar" ...>` element and add `width`, `height` and lazy-decoding attributes, keeping whatever `class` and `alt` it already has:

```html
                        <img id="heroAvatar" class="avatar" width="160" height="160" decoding="async" alt="Công Anh Dũng">
```

- [ ] **Step 9: Delete the original**

```bash
git rm profile.jpeg
```

- [ ] **Step 10: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 41 tests passing.

- [ ] **Step 11: Verify in the browser**

Run `npm run serve`, open `http://localhost:8011/`. DevTools → Console must be empty — no favicon 404. Click each nav link: every target heading must land below the header, fully visible. The avatar must still render, at the same size as before.

- [ ] **Step 12: Commit**

```bash
git add tests/defects.test.mjs favicon.svg profile.webp index.html style.css data.js
git commit -m "fix: add favicon and anchor offset, cut the 203KB avatar to a 160px webp"
```

---

### Task 9: Quality gates and CI

Without these, everything above decays on the first hurried edit. Two gate scripts plus a workflow, and the colour gate needs the last eight hardcoded literals tokenized first.

**Files:**
- Create: `scripts/check-tokens.mjs`
- Create: `scripts/check-budget.mjs`
- Create: `.github/workflows/verify.yml`
- Modify: `style.css` — six `#0a0b0c` literals and two chart colours, plus the `:root` block
- Modify: `README.md`

**Interfaces:**
- Consumes: the `:root` token block (Tasks 1, 4, 7); `--bg-header` and `--grid-line` literals already removed.
- Produces: tokens `--ink-on-accent`, `--chart-fresh-180`, `--chart-fresh-old` on `:root`. `npm run verify` as the single command CI runs.

- [ ] **Step 1: Write the failing test — the gate scripts are the test**

Create `scripts/check-tokens.mjs`:

```js
/* Colour and duration literals are how a token system dies: one rule at a time,
   each one locally reasonable. This gate reads style.css, ignores the :root
   block where literals are the whole point, and fails on anything left over.
   Run by `npm run verify`, which CI runs on every push. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'style.css'), 'utf8');

const rootBlock = source.match(/:root\s*\{[\s\S]*?\}/);
if (!rootBlock) {
    console.error('FAIL  style.css has no :root block to define tokens in.');
    process.exit(1);
}

// Blank the :root block rather than removing it, so reported line numbers still
// match the real file.
const body = source.replace(rootBlock[0], rootBlock[0].replace(/[^\n]/g, ' '));

const COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;
const DURATION = /(?:transition|animation)(?:-duration|-delay)?\s*:[^;]*?\b\d*\.?\d+m?s\b/;

const failures = [];

body.split('\n').forEach((line, index) => {
    const number = index + 1;
    const code = line.split('/*')[0];

    if (COLOUR.test(code)) {
        failures.push([number, 'colour literal - move it to :root as a token', line.trim()]);
    }
    if (DURATION.test(code)) {
        failures.push([number, 'literal duration - use a --dur-* token', line.trim()]);
    }
});

if (failures.length > 0) {
    console.error(`FAIL  ${failures.length} literal(s) outside :root in style.css\n`);
    for (const [number, why, text] of failures) {
        console.error(`  style.css:${number}  ${why}`);
        console.error(`    ${text}\n`);
    }
    process.exit(1);
}

console.log('OK    style.css: no colour or duration literals outside :root');
```

- [ ] **Step 2: Run the gate to verify it fails**

Run: `npm run check:tokens`
Expected: FAIL — roughly eight literals, six of them `color: #0a0b0c`, plus `.fresh-180` and `.fresh-old`.

- [ ] **Step 3: Add the three remaining tokens to `:root` in `style.css`**

After the `--grid-line` line, add:

```css
    /* Text sitting ON the accent - the amber button, the active language tab.
       It is the page background colour, used as ink; naming it says so. */
    --ink-on-accent: #0a0b0c;

    /* Two ends of the freshness bar. They sit outside the amber ramp on purpose:
       "stale" should not read as a warmer shade of "current". */
    --chart-fresh-180: #4a4238;
    --chart-fresh-old: #2b2c2e;
```

- [ ] **Step 4: Replace the eight literals in `style.css`**

Replace every `color: #0a0b0c;` outside the `:root` block with `color: var(--ink-on-accent);` — the gate output from step 2 lists each line number. Then replace:

```css
.fresh-180 { background: #4a4238; }
.fresh-old { background: #2b2c2e; }
```

with:

```css
.fresh-180 { background: var(--chart-fresh-180); }
.fresh-old { background: var(--chart-fresh-old); }
```

- [ ] **Step 5: Run the gate to verify it passes**

Run: `npm run check:tokens`
Expected: `OK    style.css: no colour or duration literals outside :root`

If it still reports literal durations, those are pre-existing rules such as `transition: color 0.15s linear`. Replace each `0.15s` with `var(--dur-fast)`, `0.25s`/`0.28s` with `var(--dur-base)`, `0.6s`/`0.7s`/`0.9s`/`0.95s` with `var(--dur-slow)`, and `0.2s` with `var(--dur-fast)`. This is the point of the gate: the scale becomes real only when every rule uses it.

- [ ] **Step 6: Create `scripts/check-budget.mjs`**

```js
/* This site's advantage over a framework build is that it is 31KB. That is only
   true until someone stops watching. The ceilings below are roughly 25% above
   where the site sits today - enough room to work, not enough to drift into a
   different class of page. */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const CODE = ['index.html', 'style.css', 'main.js', 'data.js'];
const CODE_CEILING_KB = 40;
const IMAGE_CEILING_KB = 40;
const IMAGE_TYPES = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

let failed = false;

// Gzip the files together: they ship together, and separate gzip streams
// overstate the total by repeating each file's dictionary.
const combined = Buffer.concat(
    CODE.filter((name) => existsSync(join(root, name))).map((name) => readFileSync(join(root, name)))
);
const codeKb = gzipSync(combined, { level: 9 }).length / 1024;

console.log(`  code   ${codeKb.toFixed(1)} KB gzip  (ceiling ${CODE_CEILING_KB} KB)  ${CODE.join(' + ')}`);

if (codeKb > CODE_CEILING_KB) {
    console.error(`FAIL  code is ${codeKb.toFixed(1)}KB gzip, over the ${CODE_CEILING_KB}KB ceiling`);
    failed = true;
}

// Images are served as-is, so raw bytes are what the visitor pays.
for (const name of readdirSync(root)) {
    if (!IMAGE_TYPES.has(extname(name).toLowerCase())) {
        continue;
    }

    const kb = statSync(join(root, name)).size / 1024;
    console.log(`  image  ${kb.toFixed(1)} KB       (ceiling ${IMAGE_CEILING_KB} KB)  ${name}`);

    if (kb > IMAGE_CEILING_KB) {
        console.error(`FAIL  ${name} is ${kb.toFixed(1)}KB, over the ${IMAGE_CEILING_KB}KB ceiling`);
        failed = true;
    }
}

if (failed) {
    process.exit(1);
}

console.log('OK    within budget');
```

- [ ] **Step 7: Run the budget gate**

Run: `npm run check:budget`
Expected: PASS — code around 32 KB gzip against a 40 KB ceiling, and `profile.webp` well under 40 KB. (`CV_CongAnhDung.pdf` is not an image type and is not checked; it is a download, not page weight.)

- [ ] **Step 8: Create `.github/workflows/verify.yml`**

```yaml
name: verify

on:
  push:
    branches: [main]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      # No `npm ci`: this project has no dependencies, and `node --test` is
      # built into Node. Adding an install step here would be the first step
      # toward needing one.
      - name: Verify
        run: npm run verify
```

- [ ] **Step 9: Run the whole gate locally**

Run: `npm run verify`
Expected: 41 tests passing, then both gates reporting OK.

- [ ] **Step 10: Document the gates in `README.md`**

Replace the `## Run Locally` section with:

```markdown
## Run Locally

```bash
npm run serve          # http://localhost:8011
```

No build step and no dependencies — the repo is the site. `npm` exists here only
for the checks below.

## Quality gates

`npm run verify` runs all three, and CI runs the same command on every push:

| Step           | What it stops                                                        |
| -------------- | -------------------------------------------------------------------- |
| `npm test`     | The motion system going missing: tokens, `@supports` branches, guards |
| `check:tokens` | Colour or duration literals creeping in outside `:root`               |
| `check:budget` | Code over 40KB gzip, or any image over 40KB                           |

These assert against the source, so they prove the system is *present*, not that
it *looks* right. For that, see the manual checklist in
[docs/superpowers/specs/2026-09-15-motion-system.md](docs/superpowers/specs/2026-09-15-motion-system.md).

## Motion system

Five duration tokens and two easing curves on `:root`, four rules:

1. Everything enters from a direction that means something. Never a bare fade.
2. Animate only `transform`, `opacity`, `clip-path`, `filter`. Colour changes are
   fine; `width`, `height` and `top` are not.
3. Durations come from the token scale. A full entrance is ≤ 700ms.
4. `prefers-reduced-motion` changes the treatment, it does not remove it.

Reveals, the header, the progress bar and the grid drift are all driven by
`animation-timeline` — the browser computes them from scroll position. The
`IntersectionObserver` in `main.js` is a fallback for browsers without it.
```

- [ ] **Step 11: Commit**

```bash
git add scripts/check-tokens.mjs scripts/check-budget.mjs .github/workflows/verify.yml style.css README.md
git commit -m "ci: gate the token system and the page budget on every push"
```

---

## Self-Review

**Spec coverage**

| Spec requirement | Task |
| --- | --- |
| §3.1 Five duration tokens, two easing tokens, `--ease` kept | 1 |
| §3.1 No literal durations in new rules | 9 (gate) |
| §3.2 Law 1 — enter from a meaningful direction | 3, 5 |
| §3.2 Law 2 — transform/opacity/clip-path/filter only | 6, 7 (asserted in tests) |
| §3.2 Law 3 — durations from the scale, ≤ 700ms | 1, 9 |
| §3.2 Law 4 — reduced motion changes the treatment | 2, extended in 5 |
| §3.3 Scroll-driven primary, observer demoted to fallback | 3, 4 |
| §3.3 `.reveal-load` for on-screen-at-load content | 3, used in 5 |
| §3.4 #1 Reveal on scroll | 3 |
| §3.4 #2 Headline line by line | 5 |
| §3.4 #3 Headline scaled up | 5 |
| §3.4 #4 Self-drawing 1px rule | 5 |
| §3.4 #5 Header settles on scroll | 4 |
| §3.4 #6 Scroll progress bar | 4 |
| §3.4 #7 `:has()` sibling dimming | 6 |
| §3.4 #8 Grid drift | 7 |
| §3.5 #1 favicon 404 | 8 |
| §3.5 #2 `scroll-padding-top` | 8 |
| §3.5 #3 203 KB avatar | 8 |
| §3.5 #4 Hardcoded colours → tokens | 4 (`--bg-header`), 7 (`--grid-line`), 9 (the rest) |
| §3.6 `npm test` | 1, extended by every task |
| §3.6 `check:tokens` | 9 |
| §3.6 `check:budget` | 9 |
| §3.6 CI on every push | 9 |
| §4 No dependencies, no build step | 1 (`package.json`), 9 (workflow has no install step) |
| §4 Copy in `data.js`, both locales | 5 |
| §4 No-JS page stays readable | 3 (fallback gated on `.js-animate`), 5 (h1 keeps its text) |

No gaps.

**Known limits, stated rather than hidden**

- These gates read source text. They prove the motion system is present; they cannot prove
  an animation looks right. The spec's §5 checklist covers that, and each task carries a
  browser-verification step.
- `ANALYTICS_COLORS` in `main.js` is a hardcoded palette feeding inline chart styles. The
  colour gate reads `style.css` only, so it does not flag it. Moving that array into CSS
  custom properties means rewriting the chart renderer — real work, no user-visible gain,
  out of scope here.
- Firefox support for `animation-timeline` was still not shipped unflagged at the time of
  writing. Check `caniuse.com/css-animation-timeline` during Task 3; either way the
  `@supports not` fallback covers it.

**Type consistency check**

`--reveal-i` and `--reveal-delay` are defined in Task 3 and consumed with exactly those
names in Tasks 3 and 5. `.reveal-load` is defined in Task 3 and used in Task 5. `escapeHtml`
and `renderHeroTitle` are defined in Task 5 and used only there. `rootBlock()`, `css()`,
`js()`, `html()`, `data()` and `ROOT` are defined in Task 1 and imported under those names
in Tasks 2-8. `--bg-header` (Task 4), `--grid-line` (Task 7), `--ink-on-accent`,
`--chart-fresh-180`, `--chart-fresh-old` (Task 9) are each declared once and referenced
under the same name. `initHeaderScrollFallback` is introduced in Task 4 step 7 and asserted
under that name in the same task.
