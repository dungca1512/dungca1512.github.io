import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound from '@/app/not-found';
import vi from '@/content/dictionaries/vi';
import en from '@/content/dictionaries/en';

describe('NotFound', () => {
  it('renders both locales, since there is no locale segment to pick one from', () => {
    // Falsify by rendering only the `lang="vi"` section twice (i.e. making the
    // page monolingual): the English section's title would then be absent,
    // and this assertion would fail.
    render(<NotFound />);
    expect(screen.getByRole('heading', { name: vi.notFound.title })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: en.notFound.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: vi.notFound.back })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: en.notFound.back })).toBeInTheDocument();
  });

  it('tags each language section with the matching lang attribute', () => {
    const { container } = render(<NotFound />);
    const sections = container.querySelectorAll('section');
    const langs = Array.from(sections).map((s) => s.getAttribute('lang'));
    expect(langs).toEqual(['vi', 'en']);
  });
});
