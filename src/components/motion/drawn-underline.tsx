import { cn } from '@/lib/cn';

/** The hand-drawn stroke under a headline. `preserveAspectRatio="none"` lets
 *  it stretch to the headline's width at any screen size without measuring
 *  anything in JS. The path draws itself on via `stroke-dashoffset` — see
 *  the `.drawn-line path` rule in `motion.css` for the measured length. */
export function DrawnUnderline({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 640 24"
      preserveAspectRatio="none"
      fill="none"
      className={cn('drawn-line text-ink-primary h-3 w-full sm:h-4', className)}
    >
      <path
        d="M4 16C88 6 176 4 264 8c88 4 176 12 264 8 36-3 72-8 108-14"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
