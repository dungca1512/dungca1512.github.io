import Link from 'next/link';
import type { Locale } from '@/content/locales';
import type { Dictionary } from '@/content/dictionaries';
import { localeAnchorHref, localeHref } from '@/lib/paths';
import { SITE } from '@/content/site';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { LocaleSwitch } from './locale-switch';

const ANCHORS = ['expertise', 'projects', 'experience', 'writing', 'contact'] as const;

export function MenuBar({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <header className="menu-bar">
      <nav aria-label={SITE.name} className="menu-bar-pill">
        <Link href={localeHref(locale)} className="font-semibold tracking-tight">
          {SITE.name}
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {ANCHORS.map((anchor) => (
            <li key={anchor}>
              <Link
                href={localeAnchorHref(locale, anchor)}
                className="duration-fast text-muted-foreground hover:bg-surface-muted hover:text-foreground rounded-full px-3 py-1.5 text-sm transition-colors"
              >
                {dict.nav[anchor]}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <LocaleSwitch locale={locale} />
          <ThemeToggle label={dict.nav.toggleTheme} />
        </div>
      </nav>
    </header>
  );
}
