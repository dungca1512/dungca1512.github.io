import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Illustration } from '@/components/site/illustration';

describe('Illustration', () => {
  it('serves avif first, then webp, then the jpg', () => {
    const { container } = render(<Illustration name="hero" alt="" width={800} height={800} />);
    const types = [...container.querySelectorAll('source')].map((s) => s.type);
    expect(types).toEqual(['image/avif', 'image/webp']);
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      '/images/illustrations/hero.jpg',
    );
  });

  it('always carries width and height, so nothing jumps while it loads', () => {
    const { container } = render(<Illustration name="hero" alt="" width={800} height={640} />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('width', '800');
    expect(img).toHaveAttribute('height', '640');
  });

  it('is aria-hidden when the alt is empty, so it is not announced as an image', () => {
    const { container } = render(<Illustration name="hero" alt="" width={1} height={1} />);
    expect(container.querySelector('img')).toHaveAttribute('aria-hidden', 'true');
  });

  it('lazy-loads by default and eagerly only when asked', () => {
    const { container, rerender } = render(
      <Illustration name="hero" alt="" width={1} height={1} />,
    );
    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy');
    rerender(<Illustration name="hero" alt="" width={1} height={1} priority />);
    expect(container.querySelector('img')).toHaveAttribute('loading', 'eager');
  });

  it('puts className on the <picture>, not the <img>, so a consumer styles the element the component returns', () => {
    const { container } = render(
      <Illustration name="hero" alt="" width={1} height={1} className="hero-portrait" />,
    );
    expect(container.querySelector('picture')).toHaveClass('hero-portrait');
    expect(container.querySelector('img')).not.toHaveClass('hero-portrait');
  });
});
