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
