'use client';

import { useEffect, useState } from 'react';

/** How far down the viewport the "you are reading here" line sits, as a
 *  fraction of viewport height. A section becomes current when its top edge
 *  crosses this line.
 *
 *  0.3 is chosen against `scroll-padding-top: 5rem` in globals.css: clicking
 *  a nav link parks the target's top edge 80px below the viewport top, which
 *  has to land ABOVE the line or the link a visitor just clicked would fail
 *  to light up. 80px is 30% of a 267px-tall viewport, so every viewport
 *  taller than that — which is all of them — satisfies it with room to
 *  spare. A line at the very top would instead flicker between neighbours on
 *  every small scroll. */
const READING_LINE = 0.3;

/** Which of `ids` the visitor is currently reading, or null above the first
 *  one. Drives the nav's `aria-current`.
 *
 *  This does not use IntersectionObserver, and the reason is not preference.
 *  An observer answers "is this element inside a band", and any band narrow
 *  enough to identify ONE section leaves gaps: scroll so that a band falls
 *  between two sections — easy, since the page has padding between them —
 *  and nothing is current, so the nav blanks out mid-scroll. Asking each
 *  section where its top edge is instead makes the answer total: the current
 *  section is the last one whose top has passed the line, which is defined
 *  at every scroll position and never blanks.
 *
 *  The work is a handful of `getBoundingClientRect()` reads coalesced into
 *  one animation frame, off a passive listener. */
export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  // The effect must not re-subscribe on every render just because the caller
  // built a new array literal, so it depends on the contents, not on the
  // array's identity, and reads the ids back out of that same string.
  const key = ids.join(',');

  useEffect(() => {
    const sectionIds = key ? key.split(',') : [];
    if (sectionIds.length === 0) return;

    let frame = 0;

    const pick = () => {
      frame = 0;
      const line = window.innerHeight * READING_LINE;

      let current: string | null = null;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }

      // The last band is shorter than the distance from the reading line to
      // the foot of the page, so scrolling all the way to the bottom never
      // lifts its top edge above the line and "Contact" would stay dark at
      // the exact moment the visitor is looking straight at it.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        const last = sectionIds[sectionIds.length - 1];
        if (document.getElementById(last)) current = last;
      }

      // Same value means no state change and no re-render, so this is safe to
      // call on every frame that scrolls.
      setActive(current);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(pick);
    };

    pick();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [key]);

  return active;
}
