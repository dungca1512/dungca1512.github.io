import Link from 'next/link';
import { Container } from '@/components/site/container';
import { DrawnUnderline } from '@/components/motion/drawn-underline';
import { SplitLines } from '@/components/motion/split-lines';
import { CodeWindow } from '@/components/motion/code-window';
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
        <div className="wide:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)] grid items-center gap-12">
          {/* `@container` is load-bearing, not decoration: the <h1> below sizes
              itself in `cqi` — a percentage of THIS column — and that only
              resolves if something here declares a container. */}
          <div className="@container">
            <p className="reveal-load text-ink-primary text-sm font-semibold tracking-[0.14em] uppercase">
              {SITE.status[locale]}
            </p>

            {/* The headline is a claim, not a name. `SITE.name` was here and is
                now three lines down, in the index row — a name set in 6rem
                answers "who" on a page whose first job is to answer "what",
                and the name is already the first thing in the menu bar and the
                last thing in the footer, so nothing was lost by moving it.

                SplitLines takes the line break from the dictionary rather than
                letting it fall wherever the viewport puts it, and animates the
                two lines a beat apart. `mode="load"` because the hero is
                already on screen: a scroll-driven variant would never fire.

                The size is `cqi`, not `vw`, and that is the whole reason the
                authored break survives. Measured in the browser: the longest
                line ("into real production.") is 8.67x its own font size, and
                this column stops growing at the Container's max width while
                the viewport keeps going — so a `vw`-scaled headline outgrew
                its column and wrapped mid-phrase ("Dua mo / hinh AI"). 11cqi
                is that 8.67 with margin, so every locale's line fits on one
                visual line at every width down to the 2.25rem floor. Changing
                the headline copy means re-measuring this number. */}
            <h1 className="mt-5 text-[clamp(2.25rem,11cqi,4.5rem)] leading-[0.95] font-semibold tracking-tighter text-pretty">
              <SplitLines lines={dict.sections.hero.title} mode="load" step={80} />
            </h1>

            <DrawnUnderline mode="load" className="mt-2 max-w-xl" />

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

            {/* The index row: a section number, the owner's name, where he
                works from, and the language pair — the same line the reference
                runs under its hero. The name reads as a byline here, which is
                what a name on a portfolio is; the <h1> above it is free to
                make a claim instead. */}
            <p className="reveal-load text-muted-foreground mt-8 flex flex-wrap items-center gap-3 text-sm tracking-[0.12em] uppercase">
              <span>01</span>
              <span aria-hidden="true">·</span>
              <span>{SITE.name}</span>
              <span aria-hidden="true">·</span>
              <span>{SITE.location[locale]}</span>
              <span aria-hidden="true">·</span>
              <span>VI / EN</span>
            </p>
          </div>

          {/* The right column carries two things, stacked with an overlap:
              the owner's portrait illustration in its circle, and the code
              window floating over the circle's lower edge. The portrait is
              who; the terminal — a request typing itself and its answer
              streaming back, on a clock, for ever — is what he runs. The
              card covers only the bottom of the circle, where the drawing
              has nothing but legs, his and the desk's. Placement is in
              sections/hero.css. Both are `reveal-load`, a beat apart. */}
          <div className="hero-visual">
            <Illustration
              name="hero"
              parallax
              alt=""
              width={880}
              height={880}
              priority
              className="hero-portrait reveal-load"
            />
            <CodeWindow locale={locale} className="hero-terminal reveal-load" />
          </div>
        </div>
      </Container>
    </section>
  );
}
