'use client';

import { useEffect, useSyncExternalStore } from 'react';
import {
  LIGHT_QUERY,
  THEME_KEY,
  applyTheme,
  nextPref,
  readPref,
  type ThemePref,
} from '@/lib/theme';

export type ThemeLabels = { label: string } & Record<ThemePref, string>;

/* The preference lives on <html> (data-theme-pref), where the pre-paint
   script put it. React reads it through useSyncExternalStore rather than
   holding a copy: the server snapshot is the default, so the first client
   render matches the server's HTML, and the real value arrives right after
   hydration without a warning. Only the name and the tooltip come from it.
   The icons are picked by CSS off the same attribute (the theme-pref-*
   utilities in globals.css), so the right one shows from first paint. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme-pref'],
  });
  return () => observer.disconnect();
}

const getPref = () => readPref(document.documentElement.dataset.themePref);
const getServerPref = (): ThemePref => 'dark';

export function ThemeToggle({ labels }: { labels: ThemeLabels }) {
  const pref = useSyncExternalStore(subscribe, getPref, getServerPref);

  // On `system`, follow the OS as it changes - a laptop switching to dark
  // at sunset repaints the page without a reload.
  useEffect(() => {
    const query = window.matchMedia(LIGHT_QUERY);
    const onChange = () => {
      if (getPref() === 'system') applyTheme('system');
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const cycle = () => {
    const next = nextPref(getPref());
    applyTheme(next);
    try {
      // Stored explicitly, 'dark' included: it keeps the choice readable in
      // storage, and it survives a later change of the default.
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private mode, or storage disabled. The theme still switches for this
      // page view; only the memory is lost.
    }
  };

  // The name says the current state, as a switch's should; the tooltip
  // spells it out for a sighted reader who does not know the monitor icon.
  const name = `${labels.label}: ${labels[pref]}`;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={name}
      title={name}
      className="duration-fast ease-out-soft border-border bg-surface text-foreground hover:bg-surface-muted grid size-10 place-items-center rounded-full border transition-colors"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="theme-pref-dark-only size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" strokeLinejoin="round" />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="theme-pref-light-only size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="12" cy="12" r="4" />
        <path
          d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
          strokeLinecap="round"
        />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="theme-pref-system-only size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="3" y="4" width="18" height="12.5" rx="2" />
        <path d="M8.5 20.5h7M12 16.5v4" strokeLinecap="round" />
      </svg>
    </button>
  );
}
