import { Section, SectionHeading } from '@/components/site/section';
import { Illustration } from '@/components/site/illustration';
import { Disclosure } from '@/components/site/disclosure';
import { TechArt } from '@/components/site/tech-art';
import { PROJECTS, CASE_STUDY, type Project } from '@/content/projects';
import { getDictionary, getLocale } from '@/content/dictionaries';
import type { Dictionary } from '@/content/dictionaries';
import type { Locale } from '@/content/locales';
import { cn } from '@/lib/cn';

/* How many projects get the pinned treatment above the fold.
   Three, and not because three is tidy: the effect needs a repeat to read as
   a structure rather than an accident, and each project costs 200dvh of
   scroll (see the stage height in sections/work.css), so a fourth buys a
   third repetition of something already understood at the price of two more
   screens of scrolling.

   These three are NOT removed from the grid below. The fold under them still
   holds all nine — see the note on `allProjects` where it is rendered. */
const PINNED = 3;

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

/** One project, held near the middle of the viewport while the page scrolls
 *  past it. Three layers — the drawing, a light info panel, the name at
 *  display size — brought in one after another by scroll position.
 *
 *  There is no JavaScript here, and none in sections/work.css either: the pin
 *  is `position: sticky` and the scrub is `animation-timeline`, both driven by
 *  the browser off the scroll position it already knows. Nothing listens for a
 *  wheel event, nothing reads a scroll offset on the main thread, and nothing
 *  decides when the visitor has scrolled far enough — so scrolling fast goes
 *  fast, and scrolling back runs the whole thing in reverse for free, because
 *  the scroll position IS the playhead rather than a trigger for a clock.
 *
 *  What this returns is a perfectly ordinary card: a picture, an <h3>, a
 *  paragraph, a list of tools, in that order. That is not a fallback rendered
 *  alongside the real thing — it IS the real thing, and the animation is an
 *  enhancement layered onto it by a stylesheet. Switch JS off, open it in
 *  Firefox, or ask for reduced motion, and this is what stays; find-in-page
 *  finds the project name in every one of those cases.
 *
 *  `still` drops TechArt's idle drift. The prop exists for exactly this —
 *  "art shown large", per its own doc comment — and the drawing here is shown
 *  at roughly six times a grid card's area, where a shape that never quite
 *  settles reads as the page vibrating rather than as texture. */
function PinnedProject({
  project,
  locale,
  index,
}: {
  project: Project;
  locale: Locale;
  index: number;
}) {
  return (
    <li className="pin-stage reveal" style={{ '--i': index } as React.CSSProperties}>
      <article className="pin-card">
        <div className="pin-art">
          <TechArt {...project.art} still />
          {/* Pure legibility, and only once the two text layers sit on top of
              the picture rather than under it — so it is drawn only inside the
              pinned layout, and is `display: none` everywhere else. */}
          <span className="pin-scrim" aria-hidden="true" />
        </div>
        <h3 className="pin-name">{project.name}</h3>
        <div className="pin-panel">
          <p className="pin-period">{project.period}</p>
          <p className="pin-summary">{project.summary[locale]}</p>
          <ul className="pin-stack">
            {project.stack.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
        </div>
      </article>
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
  const pinned = PROJECTS.slice(0, PINNED);

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

      <ul className="pin-list stagger mt-16">
        {pinned.map((project, i) => (
          <PinnedProject key={project.slug} project={project} locale={locale} index={i} />
        ))}
      </ul>

      {/* All nine, INCLUDING the three pinned above, and the duplication is
          the cheaper of two mistakes.

          The alternative — fold only the six that were not pinned — quietly
          deletes a paragraph. `ProjectCard` renders `project.outcome` for the
          lead card and no other, and the lead card is the speech platform,
          which is the first thing pinned. Fold six and the 132 words of
          measured detail behind it (Needleman-Wunsch alignment, p95 under
          benchmarked load, 740 consecutive 2XX) leave the page entirely, with
          nothing to say they had gone.

          So the pinned trio is a highlight reel and this is the record: the
          grid keeps its lead card, its span, its banner art and its folded
          outcome exactly as before, and `cards(PROJECTS, 0, …)` keeps index 0
          meaning what it has always meant. The cost is three project names
          appearing twice, one of those times behind a fold. */}
      <Disclosure
        label={dict.common.allProjects.replace('{count}', String(PROJECTS.length))}
        className="mt-12"
      >
        <ul className={cn(GRID, 'mt-8')}>{cards(PROJECTS, 0, locale, dict)}</ul>
      </Disclosure>
    </Section>
  );
}
