'use client';

import { useEffect, useState } from 'react';
import { Illustration } from '@/components/site/illustration';

/** How long the curtain may stay mounted if its animation never reports back.
 *  `animationend` is the real signal — it cannot drift out of step with the
 *  duration in CSS the way a hardcoded timer does — but there are two cases
 *  where it never fires: `prefers-reduced-motion`, which parks the curtain off
 *  screen with `animation: none`, and any browser that runs the JS but not the
 *  keyframes. Both leave a full-screen layer mounted forever without this. It
 *  is a backstop, not the schedule, so it sits well clear of the 2s animation
 *  rather than trying to match it. */
const FALLBACK_UNMOUNT_MS = 4000;

/** The page opens behind a full-bleed panel that holds for a beat and then
 *  slides off to the left, uncovering the hero. Ported from the reference
 *  portfolio's `HeroIntroCurtain`; the timing curve and the 28% hold are its
 *  numbers, kept because that hold is what makes it read as a curtain being
 *  drawn rather than a loading screen dismissing itself.
 *
 *  It renders on the server too, so the panel is in the static HTML and covers
 *  the page from the first paint — mounting it on the client instead would
 *  show the hero, then cover it, then reveal it again.
 *
 *  The art is `hero`, the same file the hero portrait already loads with
 *  `priority`. The curtain therefore costs no bytes a visitor was not fetching
 *  anyway, and it hands off to the same picture sitting in its circle.
 *
 *  It is `aria-hidden` with no focusable children and `pointer-events-none`
 *  throughout, so nothing here is between a visitor and the page: a click
 *  during the animation lands on whatever is underneath. */
export function IntroCurtain() {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(false), FALLBACK_UNMOUNT_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className="intro-curtain bg-background pointer-events-none fixed inset-0 overflow-hidden"
      onAnimationEnd={() => setMounted(false)}
    >
      <Illustration name="hero" alt="" width={1600} height={1600} priority className="intro-art" />
    </div>
  );
}
