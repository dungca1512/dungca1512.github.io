import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Container } from '@/components/site/container';

describe('Container', () => {
  it('caps its width and centers itself, with the side gutter every page relies on', () => {
    // Falsify by blanking the classes on Container's div (e.g. className={cn(className)}
    // with no layout classes): every page assembled on top of Container would then
    // render full-bleed with no gutter, and this assertion would fail.
    const { container } = render(<Container>x</Container>);
    const div = container.querySelector('div');
    expect(div?.className).toMatch(/max-w-content/);
    expect(div?.className).toMatch(/mx-auto/);
    expect(div?.className).toMatch(/px-5/);
  });

  it('merges a caller-supplied className instead of replacing the layout classes', () => {
    const { container } = render(<Container className="py-10">x</Container>);
    const div = container.querySelector('div');
    expect(div?.className).toMatch(/py-10/);
    expect(div?.className).toMatch(/max-w-content/);
  });

  it('renders its children', () => {
    const { getByText } = render(<Container>hello</Container>);
    expect(getByText('hello')).toBeInTheDocument();
  });
});
