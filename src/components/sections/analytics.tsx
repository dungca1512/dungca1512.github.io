import { Section, SectionHeading } from '@/components/site/section';
import { TechArt, artFor } from '@/components/site/tech-art';
import { analyse } from '@/lib/github-analytics';
import { getDictionary, getLocale } from '@/content/dictionaries';
import { BCP47 } from '@/content/locales';

/* Computed once per build, at module scope, not per render: `analyse()` walks
   the whole snapshot, and both locales render from the same numbers. */
const GH = analyse();

/** Month labels for the twelve columns. Vietnamese `{ month: 'short' }` gives
 *  "thg 9", which is four characters too many for a column about 24px wide at
 *  phone width, so that locale gets the "T9" form Vietnamese actually writes.
 *  January carries the year, because otherwise a twelve-month window spanning
 *  a new year gives no clue where it turned over. */
function monthLabel(key: string, locale: 'vi' | 'en'): string {
  const [year, month] = key.split('-').map(Number) as [number, number];
  const january = month === 1;
  const short =
    locale === 'vi'
      ? `T${month}`
      : new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(
          Date.UTC(year, month - 1, 1),
        );
  return january ? `${short} '${String(year).slice(-2)}` : short;
}

export async function Analytics() {
  const locale = await getLocale();
  const dict = await getDictionary();
  const t = dict.sections.analytics;

  const nf = new Intl.NumberFormat(BCP47[locale]);
  const dateFmt = new Intl.DateTimeFormat(BCP47[locale], {
    dateStyle: 'medium',
    timeZone: 'UTC',
  });

  const kpis = [
    { key: 'public', label: t.kpiPublic, value: GH.publicRepos },
    { key: 'own', label: t.kpiOwn, value: GH.ownRepos },
    { key: 'scope', label: t.kpiScope, value: GH.inScope },
    { key: 'languages', label: t.kpiLanguages, value: GH.languageCount },
  ];

  /* Deliberately NOT here: total stars and follower count. Both are real, both
     are in the snapshot, and both measure how many strangers have noticed a
     side project rather than anything this page is claiming. The scope note
     already says the production work is in private repositories, so a star
     count would invite exactly the wrong comparison. */

  const monthMax = Math.max(...GH.months.map((m) => m.count), 1);
  const freshTotal = Math.max(
    GH.freshness.d30 + GH.freshness.d90 + GH.freshness.d180 + GH.freshness.older,
    1,
  );
  const freshRows = [
    { key: 'd30' as const, label: t.days30, value: GH.freshness.d30 },
    { key: 'd90' as const, label: t.days90, value: GH.freshness.d90 },
    { key: 'd180' as const, label: t.days180, value: GH.freshness.d180 },
    { key: 'older' as const, label: t.older, value: GH.freshness.older },
  ];

  return (
    <Section id="analytics" className="band-muted">
      {/* NOT `stacked`, and not beside a portrait-shaped illustration, which is
          how this band was first built. `stacked` caps the <h2> at 24rem so
          that a title can sit next to a square picture — and this title is the
          longest on the page, so at 1440px it broke into five lines reading
          "Tong quan / hoat dong / va tin hieu / ky thuat / tu GitHub." Found by
          looking at it. The wide two-column head gives the title its full
          measure and puts the lead beside it, and the art moves below as a
          banner, where a 32/9 frame is what it wants to be anyway. */}
      <SectionHeading titleId="analytics" eyebrow={t.eyebrow} title={t.title} lead={t.lead} />

      {/* Width-capped on purpose. The banner frame is 32/9, and the drawing
          inside it is a fixed-size chip on a blueprint grid — stretched across
          the full 1150px band the chip occupied the middle third and the rest
          was empty graph paper, which reads as a placeholder rather than as
          art. At 48rem the drawing fills its frame and the strip works as a
          rule under the heading. */}
      <div className="reveal mt-10 max-w-3xl">
        <TechArt {...artFor(4)} banner className="rounded-lg" />
      </div>

      {/* The snapshot's timestamp is part of the claim, not a footnote: these
          numbers are frozen, and a reader who cannot see when they were frozen
          has no way to judge them. <time> so the machine-readable instant is
          the ISO string and the human-readable one is in their locale. */}
      <p className="text-muted-foreground mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <span className="tracking-[0.12em] uppercase">{t.snapshot}</span>
        <time dateTime={GH.generatedAt} className="text-foreground font-medium tabular-nums">
          {dateFmt.format(new Date(GH.generatedAt))}
        </time>
      </p>

      <dl className="stagger mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.key}
            className="reveal border-border bg-surface rounded-lg border p-5"
            style={{ '--i': i } as React.CSSProperties}
          >
            <dt className="text-muted-foreground text-sm">{kpi.label}</dt>
            <dd className="mt-2 text-[clamp(1.75rem,3.4vw,2.5rem)] leading-none font-semibold tracking-tight tabular-nums">
              {nf.format(kpi.value)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="stagger wide:grid-cols-3 mt-6 grid gap-6">
        {/* ── Language mix ── */}
        <article
          className="reveal border-border bg-surface rounded-lg border p-6"
          style={{ '--i': 0 } as React.CSSProperties}
        >
          <h3 className="font-semibold tracking-tight">{t.languageMix}</h3>
          <ul className="mt-5 flex flex-col gap-3">
            {GH.languages.map((lang) => (
              <li
                key={lang.name ?? 'unknown'}
                data-series={lang.series}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  <span className="gh-swatch shrink-0" aria-hidden="true" />
                  <span className="truncate">{lang.name ?? t.unknown}</span>
                </span>
                <span className="text-muted-foreground text-sm tabular-nums">
                  {nf.format(lang.count)} · {Math.round(lang.pct)}%
                </span>
                <span className="gh-bar-track col-span-2">
                  <span
                    className="gh-bar-fill"
                    style={{ '--w': `${lang.pct}%` } as React.CSSProperties}
                  />
                </span>
              </li>
            ))}
          </ul>
        </article>

        {/* ── Update rhythm ── */}
        <article
          className="reveal border-border bg-surface rounded-lg border p-6"
          style={{ '--i': 1 } as React.CSSProperties}
        >
          <h3 className="font-semibold tracking-tight">{t.velocity}</h3>
          <div className="gh-cols mt-5">
            {GH.months.map((month) => (
              <div
                key={month.key}
                className="gh-col-bar"
                data-empty={month.count === 0 ? 'true' : undefined}
                style={{ '--h': `${(month.count / monthMax) * 100}%` } as React.CSSProperties}
              />
            ))}
          </div>
          {/* The labels are a sibling grid rather than children of the columns:
              inside the flex-end column track they would be pushed around by
              the bar's own height, so a tall month and an empty one would put
              their labels on different lines. */}
          <div className="text-muted-foreground mt-2 grid grid-cols-12 gap-1 text-center text-[0.625rem]">
            {GH.months.map((month) => (
              <span key={month.key} className="tabular-nums">
                {monthLabel(month.key, locale)}
              </span>
            ))}
          </div>
          <p className="text-muted-foreground mt-4 text-sm">
            {nf.format(GH.months.reduce((sum, m) => sum + m.count, 0))} {t.repoUnit}
          </p>
        </article>

        {/* ── Freshness ── */}
        <article
          className="reveal border-border bg-surface rounded-lg border p-6"
          style={{ '--i': 2 } as React.CSSProperties}
        >
          <h3 className="font-semibold tracking-tight">{t.freshness}</h3>
          <div className="gh-fresh mt-5" aria-hidden="true">
            {freshRows.map((row) => (
              <span
                key={row.key}
                className="gh-fresh-seg"
                data-fresh={row.key}
                style={{ '--w': `${(row.value / freshTotal) * 100}%` } as React.CSSProperties}
              />
            ))}
          </div>
          {/* The stack above is aria-hidden and this list is not: the bar is a
              picture of the same four numbers, and announcing both makes a
              screen reader read the chart twice. */}
          <ul className="mt-5 flex flex-col gap-2 text-sm">
            {freshRows.map((row) => (
              <li key={row.key} className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground flex items-center gap-2">
                  <span className="gh-dot shrink-0" data-fresh={row.key} aria-hidden="true" />
                  {row.label}
                </span>
                <span className="font-medium tabular-nums">{nf.format(row.value)}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      {/* ── Most recently active repositories ── */}
      <div className="reveal border-border bg-surface mt-6 rounded-lg border p-6">
        <h3 className="font-semibold tracking-tight">{t.topRepos}</h3>
        <ul className="mt-5 flex flex-col">
          {/* No star column. Four of the six rows would read `0`, and a
              column of zeros says less about the work than the date beside
              it does — a star counts strangers who noticed a side project,
              which is not what this band is measuring. Stars are left out of
              the KPI row above for the same reason. */}
          <li
            className="text-muted-foreground border-border grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 border-b pb-2 text-xs tracking-[0.12em] uppercase sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]"
            aria-hidden="true"
          >
            <span>{t.tableRepo}</span>
            <span>{t.tableLanguage}</span>
            <span className="hidden text-right sm:block">{t.tableUpdated}</span>
          </li>
          {GH.topRepos.map((repo) => (
            <li
              key={repo.name}
              className="border-border-soft grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-center gap-3 border-b py-3 text-sm last:border-b-0 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]"
            >
              <a
                href={repo.html_url}
                rel="noreferrer noopener"
                className="hover:text-ink-primary truncate font-medium underline-offset-4 hover:underline"
              >
                {repo.name}
              </a>
              <span className="text-muted-foreground truncate">{repo.language ?? t.unknown}</span>
              <time
                dateTime={repo.pushed_at}
                className="text-muted-foreground hidden text-right tabular-nums sm:block"
              >
                {dateFmt.format(new Date(repo.pushed_at))}
              </time>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-muted-foreground mt-8 max-w-prose text-sm">{t.scope}</p>
    </Section>
  );
}
