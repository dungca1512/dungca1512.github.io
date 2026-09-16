/** `sr-only` and not `hidden`: a hidden link is out of the tab order, and a
 *  skip link that cannot be tabbed to is decoration. */
export function SkipLink({ label }: { label: string }) {
  return (
    <a
      href="#main"
      className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2"
    >
      {label}
    </a>
  );
}
