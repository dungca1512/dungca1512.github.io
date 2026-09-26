import { Section, SectionHeading } from '@/components/site/section';
import { Illustration } from '@/components/site/illustration';
import { Disclosure } from '@/components/site/disclosure';
import { Hub } from '@/components/site/hub';
import { ScrollMarquee } from '@/components/motion/scroll-marquee';
import { CodeWindow } from '@/components/motion/code-window';
import { EXPERTISE, FOCUS } from '@/content/expertise';
import { SKILL_GROUPS, PLAYBOOK } from '@/content/capabilities';
import { getDictionary, getLocale } from '@/content/dictionaries';

/* The strip above the tool cards. Three per group rather than all 53 items: the
   full set makes one track about 8000px wide, which at the marquee's own
   duration reads as a blur rather than as a list, and every item is already
   legible in the cards below — the strip is there to give the band motion, not
   to be the place anyone reads the stack from. Taking the head of each group
   keeps all six areas represented instead of over-showing whichever one is
   longest. */
const MARQUEE_ITEMS = SKILL_GROUPS.flatMap((group) => group.items.slice(0, 3));

/** One band answering "what can he do", where there used to be two.
 *
 *  `Capabilities` was its own section four bands further down, and a reader who
 *  got there had already been told once, in `Expertise`, what this person works
 *  on. Two bands, 715 words between them, the same question. They are one band
 *  now, ordered from claim to evidence to method: four areas of depth, the
 *  toolbox those areas are built with, and — folded away until asked for — the
 *  five principles that decide how the toolbox gets used.
 *
 *  Which parts are visible by default is a reading-cost decision, not a
 *  hierarchy one. The playbook is 150 words of prose, and prose is what a
 *  scanning reader pays for; the 53 tool chips are barely more characters and
 *  cost almost nothing to skim, besides being the thing someone scanning for
 *  "Kubernetes" or "Terraform" actually came for. So the chips stay out and the
 *  prose folds. */
export async function Expertise() {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <Section id="expertise" blueprint>
      <SectionHeading
        titleId="expertise"
        eyebrow={dict.sections.expertise.eyebrow}
        title={dict.sections.expertise.title}
        lead={dict.sections.expertise.lead}
      />

      {/* `wide:items-start` is load-bearing for the hub: site/hub.tsx sizes
          `.hub-core`/`.hub-links` off `.hub`'s own box, which in turn sizes
          to the <ul> inside it. Drop the utility and the grid default,
          `stretch`, pulls this item to the row's height (set by the taller
          illustration column next to it), decoupling that box from the
          cards' actual height and the core from the gutters' crossing.
          `center` or `end` would keep the box tight and merely move it. */}
      <div className="wide:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] wide:items-start mt-16 grid gap-12">
        {/* The hub draws a core at the crossing of this grid's gutters and a
            link to each card — see site/hub.tsx. The <ul> is unchanged as a
            list: four items, four <h3>s, and the core is aria-hidden. `gap`
            moved to expertise.css so the hub's wider gutter has one place to
            override it. */}
        <Hub>
          <ul className="stagger hub-grid grid sm:grid-cols-2">
            {EXPERTISE.map((area, i) => (
              <li
                key={area.key}
                className="reveal border-border bg-surface rounded-lg border p-6"
                style={{ '--i': i } as React.CSSProperties}
              >
                {/* `key` is a two-digit ordinal in the source data, designed to be
                    shown. It carries the visual weight a tag list would have, and
                    unlike a tag list it is not invented. */}
                <p className="text-ink-primary text-sm font-semibold tracking-[0.14em] tabular-nums">
                  {area.key}
                </p>
                <h3 className="mt-3 text-xl font-semibold tracking-tight">{area.title[locale]}</h3>
                <p className="text-muted-foreground mt-2 text-pretty">{area.summary[locale]}</p>
              </li>
            ))}
          </ul>
        </Hub>

        <div className="reveal">
          <Illustration
            name="expertise"
            parallax
            alt=""
            width={560}
            height={560}
            className="block overflow-hidden rounded-lg"
          />
          <ul className="mt-8 space-y-3">
            {FOCUS.map((line, i) => (
              <li key={i} className="text-muted-foreground flex gap-3">
                <span
                  aria-hidden="true"
                  className="bg-primary mt-2.5 size-1.5 shrink-0 rounded-full"
                />
                {line[locale]}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* The toolbox. The illustration that used to head the capabilities band
          comes with it — the band is gone, the picture is not, and this half of
          the section is the one it was drawn for. */}
      <div className="wide:grid-cols-[minmax(0,1fr)_minmax(15rem,21rem)] wide:items-center mt-24 grid gap-10">
        {/* `min-w-0` is load-bearing below `wide`. A grid item's automatic
            minimum is its min-content, and this item's min-content is the
            marquee's `w-max` track — measured at 8857px. On the single auto
            column of a phone that became the column's width, the picture
            beside it filled the same column, and <body>'s old `overflow-x:
            clip` only hid the scrollbar: iPhone visitors saw a 9389px-wide
            illustration cut to the screen. `minmax(0,1fr)` above does the
            same job from `wide` up; this does it everywhere else. */}
        <div className="min-w-0">
          <h3 className="reveal text-2xl font-semibold tracking-tight sm:text-3xl">
            {dict.sections.expertise.toolbox}
          </h3>
          {/* `aria-hidden` on the second copy lives inside ScrollMarquee, so a
              screen reader reads this list once — and the cards below carry the
              same names as real content anyway. */}
          <ScrollMarquee items={MARQUEE_ITEMS} className="border-border mt-6 rounded-lg border" />
          {/* The toolbox at work: a request typing itself into one of the
              services these tools run, and its answer streaming back — see
              motion/code-window.tsx. `split` because this column is wide
              enough for request and response side by side; the card folds
              them one over the other on its own when it is not. It also
              fills what was an empty stretch of this column beside the
              taller illustration. */}
          <CodeWindow locale={locale} layout="split" className="reveal mt-8" />
        </div>
        <div className="reveal wide:order-none order-first">
          <Illustration
            name="capabilities"
            parallax
            alt=""
            width={560}
            height={560}
            className="block overflow-hidden rounded-lg"
          />
        </div>
      </div>

      <ul className="stagger wide:grid-cols-3 mt-12 grid gap-6 sm:grid-cols-2">
        {SKILL_GROUPS.map((group, i) => (
          <li
            key={group.key}
            className="reveal border-border bg-surface rounded-lg border p-6"
            style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
          >
            <h3 className="text-lg font-semibold tracking-tight">{group.title[locale]}</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="pop-on-hover bg-surface-muted text-muted-foreground rounded-full px-3 py-1 text-sm"
                >
                  {item}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <Disclosure label={dict.sections.capabilities.title} className="mt-16">
        <ol className="stagger wide:grid-cols-5 mt-10 grid gap-8 sm:grid-cols-2">
          {PLAYBOOK.map((step, i) => (
            <li key={step.step} className="reveal" style={{ '--i': i } as React.CSSProperties}>
              <p className="text-ink-primary text-sm font-semibold tracking-[0.14em] uppercase">
                {step.step}
              </p>
              <h3 className="mt-2 font-semibold tracking-tight">{step.title[locale]}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{step.body[locale]}</p>
            </li>
          ))}
        </ol>
      </Disclosure>
    </Section>
  );
}
