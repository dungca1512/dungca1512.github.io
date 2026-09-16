import Link from 'next/link';
import type { Locale } from '@/content/locales';
import type { Dictionary } from '@/content/dictionaries';
import { localeAnchorHref, localeHref } from '@/lib/paths';
import { SITE } from '@/content/site';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { LocaleSwitch } from './locale-switch';
import { NavLinks } from './nav-links';

const ANCHORS = ['expertise', 'projects', 'experience', 'writing', 'contact'] as const;

export function MenuBar({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <header className="menu-bar">
      <nav aria-label={SITE.name} className="menu-bar-pill">
        <Link href={localeHref(locale)} className="font-semibold tracking-tight">
          {SITE.name}
        </Link>

        {/* The list itself is a client component: which entry is current
            depends on scroll position, which only exists in the browser. The
            hrefs and the labels are still resolved here, on the server, so
            the dictionary and the locale never cross into client code. */}
        <NavLinks
          items={ANCHORS.map((anchor) => ({
            id: anchor,
            href: localeAnchorHref(locale, anchor),
            label: dict.nav[anchor],
          }))}
        />

        <div className="flex items-center gap-2">
          <LocaleSwitch locale={locale} />
          <ThemeToggle label={dict.nav.toggleTheme} />
        </div>
      </nav>
    </header>
  );
}
