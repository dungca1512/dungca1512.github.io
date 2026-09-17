import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/site/footer';
import { CONTACTS } from '@/content/contacts';

describe('Footer', () => {
  it('gives the CV link a download attribute, so it saves instead of navigating', () => {
    // Falsify by dropping `download: true` from the CV's spread branch: the
    // link would then open the PDF in a new tab/navigate to it like every
    // other contact, and this assertion would fail.
    render(<Footer locale="en" />);
    const cv = CONTACTS.find((c) => c.download)!;
    const link = screen.getByRole('link', { name: cv.label.en });
    expect(link).toHaveAttribute('download');
  });

  it('opens every non-download contact link safely in a new tab', () => {
    // Falsify by dropping `rel="noreferrer"` (or `target="_blank"`) from the
    // non-download branch: an opened tab would then keep a `window.opener`
    // handle back to this page (a reverse-tabnabbing risk), and this would fail.
    render(<Footer locale="en" />);
    for (const contact of CONTACTS.filter((c) => !c.download)) {
      const link = screen.getByRole('link', { name: contact.label.en });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer noopener');
    }
  });

  it('renders every contact from CONTACTS, not a hardcoded subset', () => {
    render(<Footer locale="vi" />);
    for (const contact of CONTACTS) {
      expect(screen.getByRole('link', { name: contact.label.vi })).toBeInTheDocument();
    }
  });
});
