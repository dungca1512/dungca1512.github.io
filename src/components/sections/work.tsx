import { Section, SectionHeading } from '@/components/site/section';
import { Illustration } from '@/components/site/illustration';
import { TechArt } from '@/components/site/tech-art';
import { PROJECTS, CASE_STUDY } from '@/content/projects';
import { getDictionary, getLocale } from '@/content/dictionaries';
import { cn } from '@/lib/cn';

export async function Work() {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <Section id="projects" className="band-muted">
      <SectionHeading
        titleId="projects"
        eyebrow={dict.sections.work.eyebrow}
        title={dict.sections.work.title}
        lead={dict.sections.work.lead}
      />

      {/* The case study first: it is the one piece of work with a problem, an
          architecture, its trade-offs and a result written down, so it carries
          more than a card can. */}
      {/* No `bg-surface` here: `.case-band` sets the `background` SHORTHAND,
          which resets background-color, so the utility never painted a pixel.
          The band's ground is one declaration, in work.css. */}
      <article className="case-band reveal border-border mt-16 rounded-lg border p-8 sm:p-12">
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
            {/* Five links on this page read "Repository" and point at four
                different repos. Listed out of context - a standard screen
                reader navigation mode - they are indistinguishable, which is
                WCAG 2.4.9. The visible text stays short; the accessible name
                carries what it is a repository FOR. */}
            <a
              href={CASE_STUDY.repoUrl}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`${dict.common.repository} — ${CASE_STUDY.title[locale]}`}
              className="link-underline mt-6 inline-block text-sm font-medium"
            >
              {dict.common.repository}
            </a>
          </div>
          <Illustration
            name="work"
            parallax
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
             list is already ordered with the flagship first. Index 0 takes
             two columns — the full row at `sm`, two of three at `wide` — and
             is the one card that shows its outcome; nine outcome paragraphs
             in a grid would bury the case study above. */
          const lead = i === 0;
          return (
            <li
              key={project.slug}
              style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
              className={cn(
                'reveal border-border bg-surface flex flex-col overflow-hidden rounded-lg border',
                lead && 'sm:col-span-2',
              )}
            >
              {/* Every card carries a picture, and none of them is a file.
                  Nine generated illustrations would be twenty-seven encoded
                  images against a 40KB-per-file budget — see site/tech-art.tsx.

                  The drawing comes from `project.art`, not from `i`. That is
                  the whole point of the change: what a card shows is a fact
                  about the project, so it is stored on the project. Sorting
                  this list differently now moves the cards and leaves each
                  diagram on the system it describes. */}
              <TechArt {...project.art} banner={lead} />
              <div className="flex flex-1 flex-col p-6">
                <p className="text-muted-foreground text-sm">{project.period}</p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight">{project.name}</h3>
                <p className="text-muted-foreground mt-2 flex-1 text-pretty">
                  {project.summary[locale]}
                </p>
                {lead ? (
                  <p className="text-muted-foreground mt-3 text-pretty">
                    {project.outcome[locale]}
                  </p>
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
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={`${link.label[locale]} — ${project.name}`}
                        className="link-underline font-medium"
                      >
                        {link.label[locale]}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
