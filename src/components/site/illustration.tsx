import { cn } from '@/lib/cn';

type IllustrationProps = {
  /** Base filename under /images/illustrations/, no extension. */
  name: string;
  /** Empty when the picture restates adjacent text — see below. */
  alt: string;
  width: number;
  height: number;
  className?: string;
  /** Only for art visible without scrolling. Everything else stays lazy. */
  priority?: boolean;
};

/* next/image is off (images.unoptimized), so this is a plain <picture>. It is
   doing three jobs that a bare <img> would not:

   - format negotiation, avif then webp then jpg, so a modern browser gets the
     small file and an old one still gets a picture;
   - width and height on every image, so the page does not reflow as art loads;
   - aria-hidden when alt is empty, so a decorative picture is not announced.

   An empty alt is the normal case here. Every illustration on this site sits
   beside text that already says the same thing, and an alt string would make a
   screen reader read the fact twice. */
export function Illustration({ name, alt, width, height, className, priority }: IllustrationProps) {
  const base = `/images/illustrations/${name}`;

  return (
    <picture>
      <source srcSet={`${base}.avif`} type="image/avif" />
      <source srcSet={`${base}.webp`} type="image/webp" />
      <img
        src={`${base}.jpg`}
        alt={alt}
        aria-hidden={alt === '' ? 'true' : undefined}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : undefined}
        className={cn('block h-auto w-full', className)}
      />
    </picture>
  );
}
