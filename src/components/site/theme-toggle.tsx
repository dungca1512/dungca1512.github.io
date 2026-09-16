'use client';

export function ThemeToggle({ label }: { label: string }) {
  /* No React state. The source of truth is the `data-theme` attribute, which
     the pre-paint script already set — mirroring it into state would make the
     first render disagree with the DOM and hydration would warn. */
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      // Store 'light' rather than removing the key. Today an absent key is
      // treated as light too, so this is a no-op either way — but writing it
      // is what keeps the toggle correct if a prefers-color-scheme branch is
      // ever added to the pre-paint script, and it costs nothing now.
      localStorage.setItem('portfolio-theme', next);
    } catch {
      // Private mode, or storage disabled. The theme still switches for this
      // page view; only the memory is lost.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className="duration-fast ease-out-soft border-border bg-surface text-foreground hover:bg-surface-muted grid size-10 place-items-center rounded-full border transition-colors"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="theme-light-only size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="12" cy="12" r="4" />
        <path
          d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
          strokeLinecap="round"
        />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="theme-dark-only size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
