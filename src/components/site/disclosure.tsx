import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** A band of detail the page does not show until someone asks for it.
 *
 *  The page's problem was never that it said too much — every figure on it is
 *  measured and every claim is evidenced. The problem was that it said all of
 *  it at one level, so a reader with sixty seconds and a reader with ten
 *  minutes were handed the same 2,760 words and left to find their own way
 *  through. This is the second level: the summary line is the promise, and
 *  what it hides is the evidence for anyone who wants it.
 *
 *  Native `<details>`, not a React toggle, and that choice is doing real work
 *  in a statically exported site. The markup is interactive with JavaScript
 *  disabled or still downloading; the keyboard and screen-reader behaviour is
 *  the browser's, not a re-implementation of it; and — the reason a hand-built
 *  version would have been a bug — the hidden text stays in the DOM, so
 *  find-in-page opens the right panel, and `scripts/check-content.mjs` still
 *  counts every word, heading and project name it is there to guard. A version
 *  that unmounted its children would have quietly moved a third of the page
 *  out from under that gate.
 *
 *  `.reveal` goes on the summary, which is what the reader scrolls past. The
 *  contents carry whatever the caller gives them; the panels here reuse the
 *  same `.reveal`/`.stagger` markup they had before being folded, and opening
 *  one in Chrome was measured animating its in-view children normally (the two
 *  visible project cards at opacity 0.70-0.73 mid-spring) while children still
 *  below the fold waited at 0 for their own scroll — which is what a
 *  scroll-driven reveal is supposed to do. */
export function Disclosure({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details className={cn('group', className)}>
      <summary
        className={cn(
          'reveal border-border bg-surface hover:border-primary focus-visible:outline-primary',
          'flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg border',
          'px-5 py-4 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
          // Safari still draws the old disclosure triangle through `list-none`.
          '[&::-webkit-details-marker]:hidden',
        )}
      >
        {label}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="text-ink-primary size-5 shrink-0 transition-transform duration-200 group-open:rotate-180"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      {children}
    </details>
  );
}
