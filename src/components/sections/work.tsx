import { Section, SectionHeading } from '@/components/site/section';
import { Illustration } from '@/components/site/illustration';
import { PROJECTS, CASE_STUDY } from '@/content/projects';
import { getDictionary, getLocale } from '@/content/dictionaries';
import { cn } from '@/lib/cn';

export async function Work() {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <Section id="projects">
      <SectionHeading
        eyebrow={dict.sections.work.eyebrow}
        title={dict.sections.work.title}
        lead={dict.sections.work.lead}
      />

      {/* The case study first: it is the one piece of work with a problem, an
          architecture, its trade-offs and a result written down, so it carries
          more than a card can. */}
      <article className="case-band reveal border-border bg-surface mt-16 rounded-lg border p-8 sm:p-12">
        <div className="wide:grid-cols-[minmax(0,1fr)_minmax(14rem,20rem)] wide:items-center grid gap-10">
          <div>
            <h3 className="text-[clamp(1.75rem,3vw,2.5rem)] leading-tight font-semibold tracking-tight text-balance">
              {CASE_STUDY.title[locale]}
            </h3>
            <p className="text-muted-foreground mt-3 text-lg text-pretty">
              {CASE_STUDY.subtitle[locale]}
            </p>
            <ul className="mt-6 space-y-2">
              {CASE_STUDY.highlights.map((line, i) => (
                <li key={i} className="text-muted-foreground flex gap-3 text-sm">
                  <span
                    aria-hidden="true"
                    className="bg-primary mt-2 size-1.5 shrink-0 rounded-full"
                  />
                  {line[locale]}
                </li>
              ))}
            </ul>
            <a
              href={CASE_STUDY.repoUrl}
              rel="noreferrer noopener"
              className="link-underline mt-6 inline-block text-sm font-medium"
            >
              {dict.common.repository}
            </a>
          </div>
          <Illustration
            name="work"
            alt=""
            width={640}
            height={640}
            className="block overflow-hidden rounded-lg"
          />
        </div>

        {/* All five blocks, each with the localized title that ships in the
            data. Three of them on a wide screen, so Result and the last one
            wrap to a second row rather than being cut. */}
        <dl className="stagger wide:grid-cols-3 mt-10 grid gap-8 sm:grid-cols-2">
          {CASE_STUDY.blocks.map((block, i) => (
            <div key={i} className="reveal" style={{ '--i': i } as React.CSSProperties}>
              <dt className="text-ink-primary text-sm font-semibold tracking-[0.14em] uppercase">
                {block.title[locale]}
              </dt>
              <dd className="text-muted-foreground mt-2 text-pretty">{block.text[locale]}</dd>
            </div>
          ))}
        </dl>
      </article>

      <ul className="stagger wide:grid-cols-3 mt-12 grid gap-6 sm:grid-cols-2">
        {PROJECTS.map((project, i) => {
          /* The data has no `highlight` flag and none is invented here — the
             list is already ordered with the flagship first. Index 0 spans the
             row and is the one card that shows its outcome; nine outcome
             paragraphs in a grid would bury the case study above. */
          const lead = i === 0;
          return (
            <li
              key={project.slug}
              style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
              className={cn(
                'reveal border-border bg-surface flex flex-col rounded-lg border p-6',
                lead && 'sm:col-span-2',
              )}
            >
              <p className="text-muted-foreground text-sm">{project.period}</p>
              <h3 className="mt-1 text-lg font-semibold tracking-tight">{project.name}</h3>
              <p className="text-muted-foreground mt-2 flex-1 text-pretty">
                {project.summary[locale]}
              </p>
              {lead ? (
                <p className="text-muted-foreground mt-3 text-pretty">{project.outcome[locale]}</p>
              ) : null}
              <ul className="mt-4 flex flex-wrap gap-2">
                {project.stack.map((tool) => (
                  <li key={tool} className="bg-surface-muted rounded-full px-2.5 py-0.5 text-sm">
                    {tool}
                  </li>
                ))}
              </ul>
              {project.links.length > 0 ? (
                <div className="mt-5 flex gap-4 text-sm">
                  {project.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      rel="noreferrer noopener"
                      className="link-underline font-medium"
                    >
                      {link.label[locale]}
                    </a>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
