/* ─── Theme preference ─────────────────────────────────────────────────────
   Two attributes on <html>, and the difference between them is the whole
   design:

   - `data-theme-pref` is what the visitor CHOSE: dark, light or system.
     The toggle's icon and name follow this.
   - `data-theme` is what the page PAINTS: always dark or light. Every
     colour token in globals.css keys off this one, so the stylesheet never
     has to know that "system" exists.

   Dark is the default: no stored choice, or one this code does not know,
   reads as dark. The pre-paint script (components/site/theme-script.tsx)
   does the same resolution inline before first paint, from the constants
   exported here, and tests/theme.test.tsx runs both against each other. */

export const THEME_KEY = 'portfolio-theme';
export const LIGHT_QUERY = '(prefers-color-scheme: light)';

export type ThemePref = 'dark' | 'light' | 'system';
export type Theme = 'dark' | 'light';

/** The order one press of the toggle walks. */
export const THEME_PREFS: readonly ThemePref[] = ['dark', 'light', 'system'];

export function readPref(value: string | null | undefined): ThemePref {
  return value === 'light' || value === 'system' ? value : 'dark';
}

export function resolveTheme(pref: ThemePref, systemPrefersLight: boolean): Theme {
  if (pref === 'system') return systemPrefersLight ? 'light' : 'dark';
  return pref;
}

export function nextPref(pref: ThemePref): ThemePref {
  return THEME_PREFS[(THEME_PREFS.indexOf(pref) + 1) % THEME_PREFS.length]!;
}

/** Writes both attributes. Called on a press, and again whenever the OS
 *  flips while the visitor is on `system`. */
export function applyTheme(pref: ThemePref) {
  const root = document.documentElement;
  root.dataset.themePref = pref;
  root.dataset.theme = resolveTheme(pref, window.matchMedia(LIGHT_QUERY).matches);
}
