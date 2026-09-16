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

/** One band of the page. `dark` sets data-theme rather than a background
 *  class: the tokens flip on that attribute, so everything nested inside goes
 *  dark too, including components that know nothing about being in a dark
 *  band. RevealScope wraps the contents so the section owns its one observer
 *  on browsers that need one. */
export function Section({ children, id, className, blueprint, dark }: SectionProps) {
  return (
    <section
      id={id}
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
  lead?: string;
  className?: string;
  stacked?: boolean;
};

/** Eyebrow, an oversized headline, and a lead paragraph bottom-aligned in the
 *  right column from 900px up. The lead is what stops a section head reading
 *  as a bare title on a lot of empty space — supply one. */
export function SectionHeading({ eyebrow, title, lead, className, stacked }: SectionHeadingProps) {
  return (
    <div className={className}>
      <p className="reveal text-ink-primary text-sm font-semibold tracking-[0.14em] uppercase">
        {eyebrow}
      </p>
      <div
        className={cn(
          'gap-5',
          stacked
            ? 'block'
            : 'wide:grid-cols-[minmax(0,1.25fr)_minmax(16rem,0.75fr)] wide:items-end block sm:grid',
        )}
      >
        <h2
          className={cn(
            'reveal-clip text-[clamp(2.25rem,4.8vw,4.5rem)] leading-[0.98] font-semibold tracking-tighter text-balance',
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
