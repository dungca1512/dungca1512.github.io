import { Section, SectionHeading } from '@/components/site/section';
import { CursorLabel } from '@/components/motion/cursor-label';
import { WRITING } from '@/content/writing';
import { getDictionary, getLocale } from '@/content/dictionaries';

export async function Writing() {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <Section id="writing" className="bg-surface-muted">
      <SectionHeading
        titleId="writing"
        eyebrow={dict.sections.writing.eyebrow}
        title={dict.sections.writing.title}
        lead={dict.sections.writing.lead}
      />

      {/* CursorLabel is decoration and says so itself: it renders `aria-hidden`,
          only builds on a real pointer, and stands down under reduced motion.
          Every row is a plain <a> underneath, so nothing here is the only way to
          learn a link is a link. */}
      <CursorLabel label={dict.common.readArticle}>
        <ul className="stagger divide-border border-border mt-16 divide-y border-y">
          {WRITING.map((article, i) => (
            <li
              key={article.title.en}
              className="reveal"
              style={{ '--i': i } as React.CSSProperties}
            >
              {/* Keyed on the title, not the href: all six articles currently
                  point at the same profile URL, so href is not unique. */}
              <a
                href={article.href}
                rel="noreferrer noopener"
                className="duration-fast group hover:bg-surface wide:grid-cols-[8rem_minmax(0,1fr)] wide:items-baseline wide:gap-8 wide:px-4 grid gap-2 py-6 transition-colors"
              >
                <time
                  dateTime={article.date}
                  className="text-muted-foreground text-sm tabular-nums"
                >
                  {article.date}
                </time>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight">{article.title[locale]}</h3>
                  <p className="text-muted-foreground mt-1 text-pretty">{article.blurb[locale]}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </CursorLabel>
    </Section>
  );
}
