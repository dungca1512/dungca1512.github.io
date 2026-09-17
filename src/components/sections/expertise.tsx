import { Section, SectionHeading } from '@/components/site/section';
import { Illustration } from '@/components/site/illustration';
import { EXPERTISE, FOCUS } from '@/content/expertise';
import { getDictionary, getLocale } from '@/content/dictionaries';

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

      <div className="wide:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] wide:items-start mt-16 grid gap-12">
        <ul className="stagger grid gap-6 sm:grid-cols-2">
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
    </Section>
  );
}
