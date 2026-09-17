import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Container } from './container';
import { RevealScope } from '@/components/motion/reveal-scope';

type SectionProps = {
  children: ReactNode;
  id?: string;
  className?: string;
  blueprint?: boolean;
  dark?: boolean;
};

/** One band of the page. A `<section>` is only exposed as a landmark when it
 *  has an accessible name, so an `id` here also names the band after its own
 *  heading: pass the same `id` to `SectionHeading`'s `titleId` and the two
 *  meet at `<id>-title`. Without that the nav's `#expertise` link drops a
 *  screen-reader user into an unnamed generic container, and the landmark
 *  rotor lists only banner/main/contentinfo for an eight-band page.
 *  `scripts/check-export.mjs` fails on a reference with no matching id, so
 *  forgetting one half is caught rather than shipped.
 *
 *  `dark` sets data-theme rather than a background
 *  class: the tokens flip on that attribute, so everything nested inside goes
 *  dark too, including components that know nothing about being in a dark
 *  band. RevealScope wraps the contents so the section owns its one observer
 *  on browsers that need one. */
export function Section({ children, id, className, blueprint, dark }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      data-theme={dark ? 'dark' : undefined}
      className={cn(
        'py-20 sm:py-28',
        blueprint && 'blueprint',
        dark && 'bg-background text-foreground',
        className,
      )}
    >
      <RevealScope>
        <Container>{children}</Container>
      </RevealScope>
    </section>
  );
}

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  /** The owning Section's `id`. The <h2> takes `<titleId>-title`, which is
   *  what that section's `aria-labelledby` points at. */
  titleId?: string;
  lead?: string;
  className?: string;
  stacked?: boolean;
};

/** The section's name, a headline, and a lead paragraph bottom-aligned in the
 *  right column from 900px up. The lead is what stops a section head reading
 *  as a bare title on a lot of empty space — supply one.
 *
 *  The two top lines used to be sized the other way round: the eyebrow at 14px
 *  and the headline at up to 72px. That looked striking and read badly, because
 *  of WHICH string is in which slot. The eyebrow is the section's name — the
 *  word the menu uses, "Kinh nghiệm", "Ghi chép" — and the headline is a
 *  sentence about the section that never names it. So the biggest thing on a
 *  landing was prose, and the only word that told a reader where they had just
 *  arrived was the smallest text on the screen. Someone clicking "Kinh nghiệm"
 *  landed on a wall reading "Ba năm xây dựng và vận hành hệ thống AI…" with no
 *  large confirmation that they were in the right place.
 *
 *  So the name now carries the weight: accent-coloured, with a rule in front of
 *  it, at a size that competes with the headline instead of hiding under it —
 *  and the headline comes down to roughly twice the name rather than five times
 *  it. It is still the largest type in the band; it is no longer the only type
 *  in the band. Lower-case, too: these strings are Vietnamese, and uppercasing
 *  words with stacked diacritics costs legibility for styling. */
export function SectionHeading({
  eyebrow,
  title,
  titleId,
  lead,
  className,
  stacked,
}: SectionHeadingProps) {
  return (
    <div className={className}>
      {/* One <p>, with the rule as a child rather than a sibling: the rule is
          punctuation for the name, not a line of its own, and keeping them in
          one element is what lets `items-center` align the two by their middles
          at every size the name wraps to. */}
      <p className="reveal text-ink-primary flex items-center gap-4 text-xl font-semibold tracking-tight sm:text-2xl">
        <span
          aria-hidden="true"
          className="bg-primary h-[3px] w-10 shrink-0 rounded-full sm:w-14"
        />
        {eyebrow}
      </p>
      <div
        className={cn(
          'mt-4 gap-5 sm:mt-5',
          stacked
            ? 'block'
            : 'wide:grid-cols-[minmax(0,1.25fr)_minmax(16rem,0.75fr)] wide:items-end block sm:grid',
        )}
      >
        <h2
          id={titleId ? `${titleId}-title` : undefined}
          className={cn(
            'reveal-clip text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.05] font-semibold tracking-tight text-balance',
            stacked ? 'max-w-96' : 'max-w-2xl',
          )}
        >
          {title}
        </h2>
        {lead ? (
          <p
            className={cn(
              'reveal text-muted-foreground self-end text-lg text-pretty',
              stacked ? 'mt-5 max-w-104' : 'mt-4 max-w-120 sm:mt-0',
            )}
          >
            {lead}
          </p>
        ) : null}
      </div>
    </div>
  );
}
