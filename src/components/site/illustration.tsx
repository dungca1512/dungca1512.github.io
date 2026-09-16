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
  /** True for art generated on the dark ground — today only `contact`, which
   *  sits on the dark band. It tells the dark-theme rule in
   *  src/styles/site/illustration.css to leave this one alone; see there for
   *  why inverting is how the other six survive dark mode. */
  darkGround?: boolean;
};

/* There is deliberately NO `2x` density candidate here, and adding one would
   break the art rather than sharpen it. The pipeline generates ONE file per
   format and no `@2x` companion. A `srcSet` advertising `<name>@2x.<ext> 2x`
   would therefore point at a file that does not exist, and a HiDPI browser
   PREFERS the 2x candidate, so the 404 would land on exactly the devices the
   candidate was meant to serve.

   The `width`/`height` props below are a layout hint for aspect-ratio
   reservation, not the file's pixel width. The encoded widths are chosen per
   name in scripts/compress-illustrations.sh against measured display sizes —
   832px for the section art, which is displayed at 320-352 CSS px, and 1280px
   for hero, which doubles as the full-bleed intro curtain. Both clear a 2x
   display at the size they are actually rendered.

   next/image is off (images.unoptimized), so this is a plain <picture>. It is
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
  darkGround,
}: IllustrationProps) {
  const base = `/images/illustrations/${name}`;

  return (
    <picture className={className} data-art-dark={darkGround ? 'true' : 'false'}>
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
        className="block h-auto w-full"
      />
    </picture>
  );
}
