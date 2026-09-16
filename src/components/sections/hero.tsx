import Link from 'next/link';
import { Container } from '@/components/site/container';
import { DrawnUnderline } from '@/components/motion/drawn-underline';
import { Illustration } from '@/components/site/illustration';
import { getDictionary, getLocale } from '@/content/dictionaries';
import { localeAnchorHref } from '@/lib/paths';
import { HERO_TRUST, SITE } from '@/content/site';

/** The hero is already on screen at load, so its animations are the `-load`
 *  variants. A scroll-driven animation here would never play: the element
 *  never enters the viewport, it starts inside it. */
export async function Hero() {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <section className="relative flex min-h-[min(48rem,88svh)] items-center pt-28 pb-16 sm:pt-32">
      <Container>
        <div className="wide:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] grid items-center gap-12">
          <div>
            <p className="reveal-load text-ink-primary text-sm font-semibold tracking-[0.14em] uppercase">
              {SITE.status[locale]}
            </p>

            <h1 className="mt-5 text-[clamp(2.75rem,7vw,6rem)] leading-[0.95] font-semibold tracking-tighter">
              <span className="reveal-clip-load block">{SITE.name}</span>
            </h1>

            <DrawnUnderline className="mt-2 max-w-xl" />

            <p className="reveal-load text-muted-foreground mt-6 max-w-prose text-lg">
              {dict.sections.hero.lead}
            </p>

            <div className="reveal-load mt-9 flex flex-wrap items-center gap-3">
              <Link
                href={localeAnchorHref(locale, 'contact')}
                className="duration-fast ease-out-soft bg-primary text-primary-foreground rounded-full px-6 py-3 font-medium transition-transform hover:-translate-y-0.5"
              >
                {dict.common.hireMe}
              </Link>
              <a
                href={SITE.cv}
                className="duration-fast border-border hover:bg-surface-muted rounded-full border px-6 py-3 font-medium transition-colors"
              >
                {dict.common.downloadCv}
              </a>
            </div>

            {/* The trust strip: six bilingual capability badges, ported
                verbatim from the reference site's `.trust-list` (a pill row
                under the hero's stack line). Quiet by design — small type,
                a soft fill, wrapping freely — so it reads as a footnote under
                the headline and CTAs, not as a second headline.

                `aria-label` stops this from being announced as a bare
                "list, 6 items". It has its own dictionary string rather than
                borrowing the Expertise section's eyebrow: sharing that string
                would put two identically-named regions on one page, and would
                silently rename this list whenever that section edits its own
                copy. */}
            <ul
              aria-label={dict.sections.hero.trustList}
              className="reveal-load mt-8 flex list-none flex-wrap gap-2"
            >
              {HERO_TRUST.map((item) => (
                <li
                  key={item.en}
                  className="text-muted-foreground bg-surface-muted rounded-full px-3 py-1.5 text-xs"
                >
                  {item[locale]}
                </li>
              ))}
            </ul>

            {/* The index row: a section number, the role, and the language
                pair — the same line the reference runs under its hero. */}
            <p className="reveal-load text-muted-foreground mt-8 flex flex-wrap items-center gap-3 text-sm tracking-[0.12em] uppercase">
              <span>01</span>
              <span aria-hidden="true">·</span>
              <span>{SITE.location[locale]}</span>
              <span aria-hidden="true">·</span>
              <span>VI / EN</span>
            </p>
          </div>

          <Illustration
            name="hero"
            alt=""
            width={880}
            height={880}
            priority
            className="hero-portrait reveal-load"
          />
        </div>
      </Container>
    </section>
  );
}
