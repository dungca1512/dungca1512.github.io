/* The handful of marks the contact band and the footer need. Drawn inline for
   the same reason `highlight-icon` is: a package would cost a dependency and a
   slice of the page budget for six shapes at 16–20px. All `currentColor`, so
   they follow the ink of the link they sit in and flip with the theme.

   Every one is `aria-hidden` — the link's own text or `aria-label` says what
   it is, and a glyph announced before it would be noise. */

type IconProps = { className?: string };

function Stroke({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

export function ArrowUpRight({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M7 17 17 7M8 7h9v9" />
    </Stroke>
  );
}

export function ArrowRight({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Stroke>
  );
}

export function ArrowUp({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </Stroke>
  );
}

export function Download({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </Stroke>
  );
}

export function Copy({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h8" />
    </Stroke>
  );
}

export function Check({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="m5 12 5 5 9-10" />
    </Stroke>
  );
}

/* The two brand marks are filled, not stroked: they are logos, and a logo
   redrawn as an outline stops being the logo. */
export function GitHubMark({ className }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.2.8.8 1.2 1.9 1.2 3.1 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.1.9 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
    </svg>
  );
}

export function LinkedInMark({ className }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.4V9h3.4v1.6c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2ZM5.3 7.4a2.1 2.1 0 1 1 0-4.1 2.1 2.1 0 0 1 0 4.1ZM7.1 20.5H3.6V9h3.5v11.5ZM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0Z" />
    </svg>
  );
}
