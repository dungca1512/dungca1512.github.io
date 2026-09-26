'use client';

import type { ReactNode } from 'react';
import { useInView } from './use-in-view';

/** Wraps a region containing many `.reveal` children. One observer per section
 *  rather than one per element, on every browser (see use-in-view.ts). */
export function RevealScope({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
