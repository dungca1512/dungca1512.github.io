'use client';

import { useEffect, useRef } from 'react';
import { IN_VIEW_ROOT_MARGIN } from '@/components/motion/use-in-view';
import { NeuralNet } from './glyphs';

/* ─── The hub ──────────────────────────────────────────────────────────────
   A core at the meeting point of the Expertise grid's gutters, and a curve
   from it to each of the four cards. The curves draw themselves as the grid
   scrolls into view; then a short bright dash travels each one on a loop.

   Borrowed from wigin.ai's solutions hub, measured on 2026-09-21, minus the
   two libraries they build it with. Their draw is a GSAP ScrollTrigger tween
   fired once on entry — here it is a `stroke-dashoffset` transition that the
   observer below releases once, by setting `data-drawn`, the same model as
   every reveal on this page since 2026-09-26 (it was scroll-scrubbed on
   `animation-timeline: view()` before that). Their pulse is a GSAP
   `repeat: -1` — here a CSS keyframe that the same observer pauses off
   screen through `data-inview`, so a looping animation is never running for
   a section nobody is looking at.

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

  /* Not use-in-view.ts: that hook is one-way, and the pulse's gate has to
     toggle both ways. One observer serves both attributes. Its bottom margin
     is the reveals' own, so the links start drawing on the line the cards
     arrive on; threshold 0 rather than the reveals' 6%, because the grid is
     tall and any pixel on screen is enough for a decoration to be worth
     animating. */
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const inview = entries[0]?.isIntersecting ?? false;
        el.dataset.inview = inview ? 'true' : 'false';
        // The draw is a one-way trip, like every reveal: set once, kept.
        if (inview) el.dataset.drawn = 'true';
      },
      { threshold: 0, rootMargin: IN_VIEW_ROOT_MARGIN },
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
