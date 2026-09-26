import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { ThemeScript } from '@/components/site/theme-script';

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('ThemeToggle', () => {
  it('is a labelled button, so a screen reader can announce it', () => {
    render(<ThemeToggle label="Đổi giao diện sáng/tối" />);
    expect(screen.getByRole('button', { name: 'Đổi giao diện sáng/tối' })).toBeInTheDocument();
  });

  it('switches the document to dark and remembers it', async () => {
    render(<ThemeToggle label="toggle" />);
    await userEvent.click(screen.getByRole('button'));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('portfolio-theme')).toBe('dark');
  });

  it('switches back to light, and stores it rather than clearing it', async () => {
    // Storing 'light' explicitly matters: an absent key means dark, the
    // default, so clearing it would undo the visitor's choice on reload.
    document.documentElement.dataset.theme = 'dark';
    render(<ThemeToggle label="toggle" />);
    await userEvent.click(screen.getByRole('button'));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('portfolio-theme')).toBe('light');
  });

  it('renders both icons, since CSS picks between them', () => {
    const { container } = render(<ThemeToggle label="toggle" />);
    expect(container.querySelector('.theme-light-only')).not.toBeNull();
    expect(container.querySelector('.theme-dark-only')).not.toBeNull();
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
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('keeps a visitor who chose light on light', () => {
    localStorage.setItem('portfolio-theme', 'light');
    runThemeScript();
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('treats a value it does not know as the default', () => {
    localStorage.setItem('portfolio-theme', 'sepia');
    runThemeScript();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
