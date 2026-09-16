import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkipLink } from '@/components/site/skip-link';

describe('SkipLink', () => {
  it('points at #main', () => {
    render(<SkipLink label="Tới nội dung chính" />);
    expect(screen.getByRole('link', { name: 'Tới nội dung chính' })).toHaveAttribute(
      'href',
      '#main',
    );
  });

  it('is reachable but off-screen until focused, not display:none', () => {
    // display:none removes it from the tab order, which defeats the entire
    // purpose of a skip link.
    const { container } = render(<SkipLink label="skip" />);
    const link = container.querySelector('a');
    expect(link?.className).toMatch(/sr-only/);
    expect(link?.className).toMatch(/focus:not-sr-only/);
  });
});
