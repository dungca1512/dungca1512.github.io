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

    // One layout read per hover, not per move: `getBoundingClientRect`
    // forces a reflow, and `pointermove` can fire tens of times a second.
    // The box only changes on enter (the page may have scrolled or
    // reflowed since the wrapper was last hovered) and on a window resize —
    // never while the pointer is merely moving inside it.
    let box = el.getBoundingClientRect();
    const measure = () => {
      box = el.getBoundingClientRect();
    };

    const move = (e: PointerEvent) => {
      if (!box.width || !box.height) return;
      const x = (e.clientX - box.left) / box.width - 0.5;
      const y = (e.clientY - box.top) / box.height - 0.5;
      el.style.setProperty('--tilt-x', x.toFixed(3));
      el.style.setProperty('--tilt-y', y.toFixed(3));
      // Skip the write once it already reads 'true': a style-attribute
      // mutation on every one of those same tens-of-times-a-second moves
      // costs a recalc for a value that isn't changing.
      if (el.dataset.tilting !== 'true') el.dataset.tilting = 'true';
    };
    const leave = () => {
      el.style.setProperty('--tilt-x', '0');
      el.style.setProperty('--tilt-y', '0');
      delete el.dataset.tilting;
    };

    el.addEventListener('pointerenter', measure);
    // passive: the handler never calls preventDefault, so the browser is
    // free to treat this listener as non-blocking for scroll/touch work.
    el.addEventListener('pointermove', move, { passive: true });
    el.addEventListener('pointerleave', leave);
    window.addEventListener('resize', measure);
    return () => {
      el.removeEventListener('pointerenter', measure);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <div ref={ref} className={cn('tilt', className)}>
      {children}
    </div>
  );
}
