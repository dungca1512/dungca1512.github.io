import { cn } from '@/lib/cn';

type DrawnUnderlineProps = {
  className?: string;
  /** `scroll` (the default) draws when the enclosing RevealScope observes the
   *  <svg> in. `load` is for the hero, which is on screen at load and inside
   *  no scope: the stroke then plays from first paint on the same clock as
   *  `reveal-load`. Same split as SplitLines' `mode`. */
  mode?: 'scroll' | 'load';
};

/** The hand-drawn stroke under a headline. `preserveAspectRatio="none"` lets
 *  it stretch to the headline's width at any screen size without measuring
 *  anything in JS. The path draws itself on via `stroke-dashoffset` — see
 *  the `.drawn-line path` rules in `motion.css` for the measured length. */
export function DrawnUnderline({ className, mode = 'scroll' }: DrawnUnderlineProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 640 24"
      preserveAspectRatio="none"
      fill="none"
      className={cn(
        'drawn-line text-ink-primary h-3 w-full sm:h-4',
        mode === 'load' && 'drawn-line-load',
        className,
      )}
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
