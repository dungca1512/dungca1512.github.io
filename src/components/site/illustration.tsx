type IllustrationProps = {
  /** Base filename under /images/illustrations/, no extension. */
  name: string;
  /** Empty when the picture restates adjacent text — see below. */
  alt: string;
  width: number;
  height: number;
  /** Lands on the `<picture>` element, not the `<img>` — a consumer styling
   *  this component (a rounded corner, a wrapper-shaped class like Hero's
   *  `.hero-portrait`) is styling the element the component actually
   *  returns, not reaching through it via a descendant selector. The `<img>`
   *  keeps its own fixed, internal layout classes regardless of what is
   *  passed here. */
  className?: string;
  /** Only for art visible without scrolling. Everything else stays lazy. */
  priority?: boolean;
  /** Adds a `<name>@2x.<ext>` companion to every format's srcSet with a `2x`
   *  density descriptor, so a HiDPI screen renders the sharper file instead
   *  of upscaling the 1x one (Task 8 review, V4: an 880px source rendered at
   *  ~600-670 CSS px is ~1200-1340 device px on a 2x display — visibly soft).
   *  Opt-in and off by default: every current call site's `@2x` file does not
   *  exist yet (Task 13 generates these assets), and turning this on before
   *  then would only add a second silent 404 for no benefit. Flip it on a
   *  call site once its `<name>@2x.{avif,webp,jpg}` files land. */
  retina?: boolean;
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
export function Illustration({
  name,
  alt,
  width,
  height,
  className,
  priority,
  retina,
}: IllustrationProps) {
  const base = `/images/illustrations/${name}`;
  const srcSetFor = (ext: string) =>
    retina ? `${base}.${ext} 1x, ${base}@2x.${ext} 2x` : `${base}.${ext}`;

  return (
    <picture className={className}>
      <source srcSet={srcSetFor('avif')} type="image/avif" />
      <source srcSet={srcSetFor('webp')} type="image/webp" />
      <img
        src={`${base}.jpg`}
        srcSet={retina ? srcSetFor('jpg') : undefined}
        alt={alt}
        aria-hidden={alt === '' ? 'true' : undefined}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : undefined}
        className="block h-auto w-full"
      />
    </picture>
  );
}
