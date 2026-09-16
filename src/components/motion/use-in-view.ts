'use client';

import { useEffect, useRef } from 'react';

/* The three classes that carry a scroll-driven `animation-timeline: view()`
 * declaration in motion.css. `.drawn-line` is the underline's own root
 * (the `<svg>`), not its `<path>` — the CSS fallback in motion.css reads
 * `[data-inview='true']` off that same element via a descendant selector,
 * so this hook and that stylesheet have to agree on where the attribute
 * lands. */
const TARGET_SELECTOR = '.reveal, .reveal-clip, .drawn-line';

/** The ONLY fallback for scroll-driven animation. On a browser that has
 *  `animation-timeline`, this hook attaches nothing at all — the CSS
 *  `@supports not` branch is the only thing that reads data-inview.
 *
 *  `CSS` itself does not exist in every environment this code runs in —
 *  jsdom (the test DOM) ships neither `CSS` nor `IntersectionObserver` —
 *  and, in production, any real browser too old to have `CSS.supports` is
 *  also too old to have `animation-timeline: view()`. Both cases are
 *  treated as "not supported": a runtime that cannot even answer the
 *  feature-detection question is never assumed to have the feature, so the
 *  guard below falls through to the observer rather than skipping it. The
 *  alternative — treating a missing `CSS` as "supported" — would make this
 *  hook silently a no-op under jsdom, which is exactly the gap Task 7's
 *  tests need it NOT to have: `Section` wraps every band in `RevealScope`,
 *  and a test that renders one has to be able to drive this fallback. */
export function useInView<T extends HTMLElement>(rootMargin = '0px 0px -12% 0px') {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const supportsScrollTimeline =
      typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      CSS.supports('animation-timeline: view()');
    if (supportsScrollTimeline) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute('data-inview', 'true');
          // Reveal is a one-way trip. Leaving it observed would replay the
          // animation every time the visitor scrolled back.
          io.unobserve(entry.target);
        }
      },
      { rootMargin },
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
