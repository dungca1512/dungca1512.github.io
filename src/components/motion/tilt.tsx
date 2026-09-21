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

    const move = (e: PointerEvent) => {
      const box = el.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const x = (e.clientX - box.left) / box.width - 0.5;
      const y = (e.clientY - box.top) / box.height - 0.5;
      el.style.setProperty('--tilt-x', x.toFixed(3));
      el.style.setProperty('--tilt-y', y.toFixed(3));
      el.dataset.tilting = 'true';
    };
    const leave = () => {
      el.style.setProperty('--tilt-x', '0');
      el.style.setProperty('--tilt-y', '0');
      delete el.dataset.tilting;
    };

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <div ref={ref} className={cn('tilt', className)}>
      {children}
    </div>
  );
}
