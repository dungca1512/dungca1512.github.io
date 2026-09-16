import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '@/components/site/theme-toggle';

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
    // Storing 'light' explicitly matters: today an absent key is treated as
    // light too, but writing the value keeps the toggle correct if a
    // prefers-color-scheme branch is ever added to the pre-paint script.
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
