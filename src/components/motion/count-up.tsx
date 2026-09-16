'use client';

import { useEffect, useRef } from 'react';

const ROLL_MS = 900;

/** Digits roll individually, like a meter.
 *
 *  The number is NEVER held in React state. The exported HTML has to contain
 *  the FINAL figure, or a search engine, a visitor with JS off and a visitor
 *  with reduced motion all read zero. The effect builds its own DOM inside the
 *  span after the text is already readable, and puts it back on unmount. */
export function CountUp({
  value,
  locale,
  suffix = '',
  duration = ROLL_MS,
}: {
  value: number;
  /** BCP-47, so Intl groups digits the way the language does. */
  locale: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const text = `${new Intl.NumberFormat(locale).format(value)}${suffix}`;

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const chars = [...new Intl.NumberFormat(locale).format(value)];
    const original = host.textContent;

    // A column of 0-9 is noise to a screen reader — it would read all ten.
    // Label the whole thing and hide the machinery.
    host.setAttribute('role', 'img');
    host.setAttribute('aria-label', original ?? '');
    host.textContent = '';

    const strip = document.createElement('span');
    strip.setAttribute('aria-hidden', 'true');
    strip.style.display = 'inline-flex';
    strip.style.alignItems = 'baseline';

    const columns: HTMLElement[] = [];

    for (const char of chars) {
      if (!/\d/.test(char)) {
        const sep = document.createElement('span');
        sep.textContent = char;
        strip.append(sep);
        continue;
      }

      const frame = document.createElement('span');
      frame.style.display = 'inline-block';
      frame.style.overflow = 'hidden';
      frame.style.height = '1em';
      frame.style.lineHeight = '1';

      const column = document.createElement('span');
      column.style.display = 'block';
      column.style.willChange = 'transform';
      for (let d = 0; d <= 9; d += 1) {
        const cell = document.createElement('span');
        cell.style.display = 'block';
        cell.style.height = '1em';
        cell.textContent = String(d);
        column.append(cell);
      }
      column.dataset.target = char;

      frame.append(column);
      strip.append(frame);
      columns.push(column);
    }

    const tail = document.createElement('span');
    tail.textContent = suffix;
    strip.append(tail);
    host.append(strip);

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        io.disconnect();
        columns.forEach((column, index) => {
          // Right-hand digits take longer than left-hand ones. Rolling them in
          // lockstep looks like one sliding block, not like wheels stopping.
          column.style.transition = `transform ${duration + index * 120}ms cubic-bezier(0.2, 0, 0, 1) ${index * 70}ms`;
          column.style.transform = `translateY(-${Number(column.dataset.target)}em)`;
        });
      },
      { rootMargin: '0px 0px -20% 0px' },
    );
    io.observe(host);

    return () => {
      io.disconnect();
      host.removeAttribute('role');
      host.removeAttribute('aria-label');
      host.textContent = original;
    };
    /* KNOWN LIMIT, and deliberately not worked around: this effect destroys the
       text node React rendered, so on a RE-RUN (a changed `value`, `locale` or
       `suffix`) the cleanup writes the PREVIOUS figure back, and React's own
       update lands on a node that is no longer in the tree — the wheels roll to
       the new number while `aria-label` still reads the old one. Nothing can
       reach that today: `METRICS` values are resolved at build time, locale is
       fixed per exported page, and no call site re-renders a mounted CountUp
       with different props. Unmount and React's StrictMode double-invoke are
       both safe, because the cleanup clears children before restoring the text.
       If a figure ever does become dynamic, do not patch the cleanup — keep
       React's text node and hide it, rather than taking it over. */
  }, [value, locale, suffix, duration]);

  return <span ref={ref}>{text}</span>;
}
