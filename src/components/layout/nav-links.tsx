'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';
import { useActiveSection } from './use-active-section';

export type NavLink = {
  /** The section id this entry points at, without the `#`. */
  id: string;
  href: string;
  label: string;
};

/** The nav's section links, with the one the visitor is reading marked.
 *
 *  `aria-current="location"` is the machine-readable half and the colour is
 *  the visible half; neither stands alone. The active and inactive classes
 *  deliberately share a font weight — swapping to `font-medium` on the
 *  current item would re-measure the pill's contents on every section
 *  boundary, so the whole nav would twitch sideways as the page scrolled. */
export function NavLinks({ items }: { items: NavLink[] }) {
  const active = useActiveSection(items.map((item) => item.id));

  return (
    <ul className="hidden items-center gap-1 md:flex">
      {items.map((item) => {
        const current = item.id === active;
        return (
          <li key={item.id}>
            <Link
              href={item.href}
              aria-current={current ? 'location' : undefined}
              className={cn(
                'duration-fast rounded-full px-3 py-1.5 text-sm transition-colors',
                current
                  ? 'bg-primary-subtle text-ink-primary'
                  : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
