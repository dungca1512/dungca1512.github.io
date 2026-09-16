import { Section, SectionHeading } from '@/components/site/section';
import { Illustration } from '@/components/site/illustration';
import { WRITING } from '@/content/writing';
import { getDictionary, getLocale } from '@/content/dictionaries';

const ROW =
  'wide:grid-cols-[8rem_minmax(0,1fr)] wide:items-baseline wide:gap-8 wide:px-4 grid gap-2 py-6';

export async function Writing() {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <Section id="writing" className="band-muted">
      <div className="wide:grid-cols-[minmax(0,1fr)_minmax(15rem,21rem)] wide:items-center grid gap-10">
        <SectionHeading
          stacked
          titleId="writing"
          eyebrow={dict.sections.writing.eyebrow}
          title={dict.sections.writing.title}
          lead={dict.sections.writing.lead}
        />
        <div className="reveal wide:order-none order-first">
          <Illustration
            name="writing"
            parallax
            alt=""
            width={560}
            height={560}
            className="block overflow-hidden rounded-lg"
          />
        </div>
      </div>

      {/* The pointer-following "Đọc bài" / "Read" label is gone. It promised
          an article over rows whose links went to a GitHub repository, so the
          page said "read" and delivered a README. The rows are no longer
          links at all; the only link is the explicit "Mã nguồn" one below,
          which says where it goes. */}
      <ul className="stagger divide-border border-border mt-16 divide-y border-y">
        {WRITING.map((article, i) => (
          <li key={article.title.en} className="reveal" style={{ '--i': i } as React.CSSProperties}>
            {/* Keyed on the title: two entries can share a destination, and
                  four carry none at all, so href is not a key. */}
            {(() => {
              const body = (
                <>
                  <time
                    dateTime={article.date}
                    className="text-muted-foreground text-sm tabular-nums"
                  >
                    {article.date}
                  </time>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight">
                      {article.title[locale]}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-pretty">
                      {article.blurb[locale]}
                    </p>
                    {/* The row itself is never a link — see writing.ts:
                          none of these is a published article, so a clickable
                          title would promise a read that does not exist. Where
                          a repository exists it gets its own link, labelled as
                          code and carrying the repo's own name, so the
                          destination is legible before the click.

                          `aria-label` because "Mã nguồn" repeated three times
                          down the page is three identically-named links in a
                          screen reader's link list; the title disambiguates
                          them. */}
                    {article.repo && (
                      <a
                        href={article.repo}
                        rel="noreferrer noopener"
                        aria-label={`${dict.common.repository} — ${article.title[locale]}`}
                        className="text-ink-primary duration-fast mt-3 inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 transition-colors hover:underline"
                      >
                        {dict.common.repository}
                        <span aria-hidden="true">↗</span>
                        <span className="text-muted-foreground font-normal">
                          {article.repo.replace('https://github.com/', '')}
                        </span>
                      </a>
                    )}
                  </div>
                </>
              );
              return <div className={ROW}>{body}</div>;
            })()}
          </li>
        ))}
      </ul>
    </Section>
  );
}
