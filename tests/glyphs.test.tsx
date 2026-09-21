import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NeuralNet } from '@/components/site/glyphs';

describe('NeuralNet glyph', () => {
  it('draws every edge of a 3-4-2 net and every node', () => {
    const { container } = render(
      <svg>
        <NeuralNet />
      </svg>,
    );
    // 3×4 + 4×2 edges, 3+4+2 nodes.
    expect(container.querySelectorAll('path')).toHaveLength(20);
    expect(container.querySelectorAll('circle')).toHaveLength(9);
  });

  it('stays inside an 80-unit radius of its origin, so a caller can size the box', () => {
    const { container } = render(
      <svg>
        <NeuralNet />
      </svg>,
    );
    for (const c of container.querySelectorAll('circle')) {
      expect(Math.abs(Number(c.getAttribute('cx')))).toBeLessThanOrEqual(80);
      expect(Math.abs(Number(c.getAttribute('cy')))).toBeLessThanOrEqual(80);
    }
  });
});
