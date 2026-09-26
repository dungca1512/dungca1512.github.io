import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle, type ThemeLabels } from '@/components/site/theme-toggle';
import { ThemeScript } from '@/components/site/theme-script';
import { nextPref, readPref, resolveTheme } from '@/lib/theme';

const LABELS: ThemeLabels = { label: 'Theme', dark: 'Dark', light: 'Light', system: 'System' };

/** Stands in for the OS. `matches` answers the light query; `flip` changes
 *  it and fires the listeners, the way a real `change` event would. */
function mockSystem(prefersLight: boolean) {
  const listeners = new Set<() => void>();
  const mql = {
    get matches() {
      return prefersLight;
    },
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  };
  vi.spyOn(window, 'matchMedia').mockImplementation(() => mql as unknown as MediaQueryList);
  return {
    flip(light: boolean) {
      prefersLight = light;
      listeners.forEach((fn) => fn());
    },
  };
}

const root = document.documentElement;

beforeEach(() => {
  localStorage.clear();
  delete root.dataset.theme;
  delete root.dataset.themePref;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('theme resolution', () => {
  it('defaults to dark for anything it does not know', () => {
    expect(readPref(null)).toBe('dark');
    expect(readPref('sepia')).toBe('dark');
    expect(readPref('light')).toBe('light');
    expect(readPref('system')).toBe('system');
  });

  it('paints system as whatever the OS prefers', () => {
    expect(resolveTheme('system', true)).toBe('light');
    expect(resolveTheme('system', false)).toBe('dark');
    expect(resolveTheme('light', false)).toBe('light');
  });

  it('cycles dark, light, system, and back', () => {
    expect(nextPref('dark')).toBe('light');
    expect(nextPref('light')).toBe('system');
    expect(nextPref('system')).toBe('dark');
  });
});

describe('ThemeToggle', () => {
  it('names the current choice, so a screen reader can announce it', () => {
    root.dataset.themePref = 'dark';
    render(<ThemeToggle labels={LABELS} />);
    expect(screen.getByRole('button', { name: 'Theme: Dark' })).toBeInTheDocument();
  });

  it('walks dark, light, system on successive presses, and remembers each', async () => {
    mockSystem(false);
    root.dataset.themePref = 'dark';
    root.dataset.theme = 'dark';
    render(<ThemeToggle labels={LABELS} />);
    const button = screen.getByRole('button');

    await userEvent.click(button);
    expect(root.dataset.themePref).toBe('light');
    expect(root.dataset.theme).toBe('light');
    expect(localStorage.getItem('portfolio-theme')).toBe('light');
    expect(button).toHaveAccessibleName('Theme: Light');

    await userEvent.click(button);
    expect(root.dataset.themePref).toBe('system');
    expect(root.dataset.theme).toBe('dark');
    expect(localStorage.getItem('portfolio-theme')).toBe('system');
    expect(button).toHaveAccessibleName('Theme: System');

    await userEvent.click(button);
    expect(root.dataset.themePref).toBe('dark');
    expect(localStorage.getItem('portfolio-theme')).toBe('dark');
  });

  it('on system, follows the OS when it changes', () => {
    const os = mockSystem(false);
    root.dataset.themePref = 'system';
    root.dataset.theme = 'dark';
    render(<ThemeToggle labels={LABELS} />);
    act(() => os.flip(true));
    expect(root.dataset.theme).toBe('light');
    act(() => os.flip(false));
    expect(root.dataset.theme).toBe('dark');
  });

  it('ignores the OS when the visitor picked a theme', () => {
    const os = mockSystem(false);
    root.dataset.themePref = 'dark';
    root.dataset.theme = 'dark';
    render(<ThemeToggle labels={LABELS} />);
    act(() => os.flip(true));
    expect(root.dataset.theme).toBe('dark');
  });

  it('renders all three icons, since CSS picks between them', () => {
    const { container } = render(<ThemeToggle labels={LABELS} />);
    for (const pref of ['dark', 'light', 'system']) {
      expect(container.querySelector(`.theme-pref-${pref}-only`)).not.toBeNull();
    }
  });
});

/** Runs the pre-paint script the way the browser does: its text, as is. */
function runThemeScript() {
  const { container } = render(<ThemeScript />);
  new Function(container.querySelector('script')!.innerHTML)();
}

describe('ThemeScript', () => {
  it('starts a first visit on dark', () => {
    runThemeScript();
    expect(root.dataset.theme).toBe('dark');
    expect(root.dataset.themePref).toBe('dark');
  });

  it('keeps a visitor who chose light on light', () => {
    localStorage.setItem('portfolio-theme', 'light');
    runThemeScript();
    expect(root.dataset.theme).toBe('light');
  });

  it('treats a value it does not know as the default', () => {
    localStorage.setItem('portfolio-theme', 'sepia');
    runThemeScript();
    expect(root.dataset.theme).toBe('dark');
    expect(root.dataset.themePref).toBe('dark');
  });

  it.each([
    [true, 'light'],
    [false, 'dark'],
  ])('on system, paints what the OS prefers (light: %s)', (prefersLight, theme) => {
    mockSystem(prefersLight);
    localStorage.setItem('portfolio-theme', 'system');
    runThemeScript();
    expect(root.dataset.themePref).toBe('system');
    expect(root.dataset.theme).toBe(theme);
  });
});
