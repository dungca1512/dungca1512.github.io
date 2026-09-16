import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Section, SectionHeading } from '@/components/site/section';

describe('Section', () => {
  it('carries its id, so the nav anchors land', () => {
    const { container } = render(<Section id="work">x</Section>);
    expect(container.querySelector('section#work')).not.toBeNull();
  });

  it('marks a dark band with data-theme, not with a colour class', () => {
    // The tokens flip on an attribute selector, so one attribute turns the
    // whole subtree dark — including anything nested that never heard of it.
    const { container } = render(<Section dark>x</Section>);
    expect(container.querySelector('section')?.dataset.theme).toBe('dark');
  });

  it('leaves data-theme off a normal band, so it inherits the page theme', () => {
    const { container } = render(<Section>x</Section>);
    expect(container.querySelector('section')?.dataset.theme).toBeUndefined();
  });
});

describe('SectionHeading', () => {
  it('renders the eyebrow, an h2, and the lead', () => {
    render(<SectionHeading eyebrow="01" title="Dự án" lead="Những thứ đã chạy thật." />);
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Dự án' })).toBeInTheDocument();
    expect(screen.getByText('Những thứ đã chạy thật.')).toBeInTheDocument();
  });

  it('omits the lead paragraph entirely when there is none', () => {
    const { container } = render(<SectionHeading eyebrow="01" title="Dự án" />);
    expect(container.querySelectorAll('p')).toHaveLength(1); // the eyebrow only
  });
});
