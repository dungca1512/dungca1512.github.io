'use client';

import { useEffect, useRef } from 'react';

/* The three classes motion.css holds hidden under `.js` until this hook
 * marks them. `.drawn-line` is the underline's own root (the `<svg>`), not
 * its `<path>` — motion.css reads `[data-inview='true']` off that same
 * element via a descendant selector, so this hook and that stylesheet have
 * to agree on where the attribute lands. */
const TARGET_SELECTOR = '.reveal, .reveal-clip, .drawn-line';

/* wigin.ai's trigger, measured 2026-09-26: 6% of the element showing, with
 * the root's bottom edge pulled up 8%. For a one-line element that is a
 * line about 90% of the way down the viewport — low enough that the reveal
 * is under way as the eye arrives, high enough that it is never in the
 * margin. Exported so the hub (hub.tsx) draws from the same line. */
export const IN_VIEW_ROOT_MARGIN = '0px 0px -8% 0px';
export const IN_VIEW_THRESHOLD = 0.06;

/** The ONE way a reveal fires, on every browser.
 *
 *  Until 2026-09-26 this hook was the fallback: it returned early wherever
 *  `CSS.supports('animation-timeline: view()')` said yes and left the reveal
 *  to a scroll-driven animation. That animation was scrubbed by the wheel
 *  and never played as a clip; the observer-plus-transition path is the one
 *  that matches the reference (see motion.css), so it is now the only one,
 *  and no feature test stands in front of it.
 *
 *  jsdom (the test DOM) ships no `IntersectionObserver`; tests/setup.ts
 *  stands up a recording stub so a test can drive this hook by hand. */
export function useInView<T extends HTMLElement>(rootMargin = IN_VIEW_ROOT_MARGIN) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute('data-inview', 'true');
          // Reveal is a one-way trip. Leaving it observed would replay the
          // transition every time the visitor scrolled back.
          io.unobserve(entry.target);
        }
      },
      { rootMargin, threshold: IN_VIEW_THRESHOLD },
    );

    // `Element`, not `HTMLElement`: `.drawn-line` matches an `<svg>`
    // (an `SVGSVGElement`), which is not an `HTMLElement`. The code below
    // only ever calls `setAttribute` and hands elements to `observe`, both
    // of which are plain `Element` methods, so there is no reason to claim
    // a narrower type than what actually flows through here.
    const targets: Element[] = el.matches(TARGET_SELECTOR)
      ? [el]
      : Array.from(el.querySelectorAll<Element>(TARGET_SELECTOR));
    targets.forEach((t) => io.observe(t));

    return () => io.disconnect();
  }, [rootMargin]);

  return ref;
}
