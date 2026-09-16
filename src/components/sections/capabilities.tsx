import { Section, SectionHeading } from '@/components/site/section';
import { ScrollMarquee } from '@/components/motion/scroll-marquee';
import { Illustration } from '@/components/site/illustration';
import { SKILL_GROUPS, PLAYBOOK } from '@/content/capabilities';
import { getDictionary, getLocale } from '@/content/dictionaries';

/* The strip above the cards. Three per group rather than all 53 items: the full
   set makes one track about 8000px wide, which at the marquee's own duration
   reads as a blur rather than as a list, and every item is already legible in
   the cards below — the strip is there to give the band motion, not to be the
   place anyone reads the stack from. Taking the head of each group keeps all
   six areas represented instead of over-showing whichever one is longest. */
const MARQUEE_ITEMS = SKILL_GROUPS.flatMap((group) => group.items.slice(0, 3));

export async function Capabilities() {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <Section id="capabilities" blueprint>
      {/* `stacked` is what makes the heading survive a narrow column: it
          drops the title/lead side-by-side grid, which at 15rem would set the
          lead two words to a line. */}
      <div className="wide:grid-cols-[minmax(0,1fr)_minmax(15rem,21rem)] wide:items-center grid gap-10">
        <SectionHeading
          stacked
          titleId="capabilities"
          eyebrow={dict.sections.capabilities.eyebrow}
          title={dict.sections.capabilities.title}
          lead={dict.sections.capabilities.lead}
        />
        <div className="reveal wide:order-none order-first">
          <Illustration
            name="capabilities"
            alt=""
            width={560}
            height={560}
            className="block overflow-hidden rounded-lg"
          />
        </div>
      </div>

      {/* `aria-hidden` on the second copy lives inside ScrollMarquee, so a
          screen reader reads this list once — and the cards below carry the
          same names as real content anyway. */}
      <ScrollMarquee items={MARQUEE_ITEMS} className="border-border mt-12 rounded-lg border" />

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

      <ol className="stagger wide:grid-cols-5 mt-16 grid gap-8 sm:grid-cols-2">
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
    </Section>
  );
}
