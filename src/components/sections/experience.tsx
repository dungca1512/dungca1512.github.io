import { Section, SectionHeading } from '@/components/site/section';
import { Illustration } from '@/components/site/illustration';
import { EXPERIENCE, EDUCATION, CERTIFICATION } from '@/content/experience';
import { getDictionary, getLocale } from '@/content/dictionaries';

export async function Experience() {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <Section id="experience" className="band-muted">
      <SectionHeading
        titleId="experience"
        eyebrow={dict.sections.experience.eyebrow}
        title={dict.sections.experience.title}
        lead={dict.sections.experience.lead}
      />

      {/* The timeline and a side rail. The art is `sticky` because the list is
          the tallest thing on the page — pinned, it stays company to the whole
          scroll instead of leaving the right column empty after the first
          role. `top` clears the menu bar. */}
      <div className="wide:grid-cols-[minmax(0,1fr)_minmax(14rem,19rem)] wide:items-start mt-16 grid gap-12">
        {/* The rail is the list's own left border and the dots are positioned
          against it, so adding a role never means touching the rail. */}
        <ol className="stagger border-border space-y-10 border-l pl-8">
          {EXPERIENCE.map((role, i) => (
            <li
              key={role.company}
              className="reveal relative"
              style={{ '--i': i } as React.CSSProperties}
            >
              <span
                aria-hidden="true"
                className="border-background bg-primary absolute top-2 -left-[2.3rem] size-3 rounded-full border-2"
              />
              {/* `period` already ends in "Present" for the current role — the
                source data ships one string per role and the port kept it
                verbatim. Appending dict.common.present here would render
                "Jan 2025 — Present · Present". Render the period alone. */}
              <p className="text-muted-foreground text-sm tracking-[0.12em] uppercase">
                {role.period[locale]}
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                {role.role[locale]} <span className="text-ink-primary">@ {role.company}</span>
              </h3>
              <p className="text-muted-foreground mt-2">{role.summary[locale]}</p>
              <ul className="mt-4 space-y-2">
                {role.highlights[locale].map((line) => (
                  <li key={line} className="text-muted-foreground flex gap-3">
                    <span
                      aria-hidden="true"
                      className="bg-primary mt-2.5 size-1.5 shrink-0 rounded-full"
                    />
                    {line}
                  </li>
                ))}
              </ul>
              <ul className="mt-4 flex flex-wrap gap-2">
                {role.stack.map((tool) => (
                  <li
                    key={tool}
                    className="pop-on-hover bg-surface rounded-full px-2.5 py-0.5 text-sm"
                  >
                    {tool}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <div className="reveal wide:sticky wide:top-28 wide:order-none order-first">
          <Illustration
            name="experience"
            parallax
            alt=""
            width={560}
            height={560}
            className="block overflow-hidden rounded-lg"
          />
        </div>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {[EDUCATION, CERTIFICATION].map((entry, i) => (
          <div key={i} className="reveal border-border bg-surface rounded-lg border p-6">
            <h3 className="text-lg font-semibold tracking-tight">{entry.title[locale]}</h3>
            <p className="text-muted-foreground mt-1">{entry.detail[locale]}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
