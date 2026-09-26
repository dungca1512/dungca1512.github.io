import { Section, SectionHeading } from '@/components/site/section';
import { Illustration } from '@/components/site/illustration';
import { Disclosure } from '@/components/site/disclosure';
import { TechArt } from '@/components/site/tech-art';
import { Tilt } from '@/components/motion/tilt';
import { PROJECTS, CASE_STUDY, type Project } from '@/content/projects';
import { getDictionary, getLocale } from '@/content/dictionaries';
import type { Dictionary } from '@/content/dictionaries';
import type { Locale } from '@/content/locales';
import { cn } from '@/lib/cn';

/* How many projects are open on the page before the fold. Five fills the
   grid at either of its widths, because the lead card is two columns wide:
   on two columns the lead is a row of its own and the other four make two
   more; on three, the lead plus one card, then three. A sixth would start a
   row with one card on it either way.

   Five is also what this section shipped with until 2026-09-20, when three of
   them were pinned to the viewport and their picture, panel and name scrubbed
   in by scroll position (commit 5651831). That went on 2026-09-26 at the
   owner's request: the text sliding in and the picture fading up read as a
   page still loading, not as a page holding something. The cards are cards
   again, with the same on-enter reveal every other list on the page has, and
   the fold below holds the rest rather than all nine. */
const FEATURED = 5;

/** One project. Lifted out of the map so the folded cards and the open ones
 *  are the same card, rather than the same JSX typed twice and edited once. */
function ProjectCard({
  project,
  locale,
  lead,
  index,
  measuredOutcomeLabel,
}: {
  project: Project;
  locale: Locale;
  /** The flagship, at index 0: two columns wide, and the only card that carries
   *  its outcome. The data has no `highlight` flag and none is invented — the
   *  list is already ordered with the flagship first. */
  lead: boolean;
  index: number;
  measuredOutcomeLabel: string;
}) {
  return (
    <li
      style={{ '--i': Math.min(index, 7) } as React.CSSProperties}
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
        <p className="text-muted-foreground mt-2 flex-1 text-pretty">{project.summary[locale]}</p>
        {/* The outcome is 132 words of measured detail — Needleman-Wunsch
            alignment, p95 under load, 740 consecutive 2XX responses — and it
            was the single longest unbroken block of prose on the page, sitting
            in the first card a reader reaches. None of it is padding, which is
            exactly why it is folded rather than cut: the summary above says
            what the system is, and this says how well it works, to whoever
            asks. */}
        {lead ? (
          <Disclosure label={measuredOutcomeLabel} className="mt-4">
            <p className="text-muted-foreground mt-4 text-pretty">{project.outcome[locale]}</p>
          </Disclosure>
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
}

const GRID = 'stagger wide:grid-cols-3 grid gap-6 sm:grid-cols-2';

function cards(projects: Project[], offset: number, locale: Locale, dict: Dictionary) {
  return projects.map((project, i) => (
    <ProjectCard
      key={project.slug}
      project={project}
      locale={locale}
      lead={offset + i === 0}
      index={offset + i}
      measuredOutcomeLabel={dict.common.measuredOutcome}
    />
  ));
}

export async function Work() {
  const locale = await getLocale();
  const dict = await getDictionary();
  const featured = PROJECTS.slice(0, FEATURED);
  const rest = PROJECTS.slice(FEATURED);

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
          {/* Leans toward the pointer on a fine-pointer device; flat
              everywhere else. The parallax on the <img> inside and the tilt
              on this wrapper are two transforms on two elements, so neither
              overwrites the other. */}
          <Tilt>
            <Illustration
              name="work"
              parallax
              alt=""
              width={640}
              height={640}
              className="block overflow-hidden rounded-lg"
            />
          </Tilt>
        </div>

        {/* All five blocks, each with the localized title that ships in the
            data — folded away, because what the case study has to say up top
            is already said: a title, a one-line claim, three highlights and a
            link. The breakdown is 125 words for the reader who wants the
            argument rather than the headline, and the summary line above names
            all four parts so it is clear what opening it buys. */}
        <Disclosure label={dict.common.caseStudyDetail} className="mt-10">
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
        </Disclosure>
      </article>

      {/* The open grid and the folded one are the same card. `cards` carries
          the running index into the fold so the stagger keeps counting from
          where the open grid stopped, and `lead` is index 0 alone: the
          flagship, two columns wide, with its measured outcome folded inside
          it. Folding at FEATURED is what keeps that paragraph on the page —
          the lead is never behind the fold. */}
      <ul className={cn(GRID, 'mt-12')}>{cards(featured, 0, locale, dict)}</ul>

      {rest.length > 0 ? (
        <Disclosure
          label={dict.common.moreProjects.replace('{count}', String(rest.length))}
          className="mt-8"
        >
          <ul className={cn(GRID, 'mt-8')}>{cards(rest, FEATURED, locale, dict)}</ul>
        </Disclosure>
      ) : null}
    </Section>
  );
}
