import { Section, SectionHeading } from '@/components/site/section';
import { CursorLabel } from '@/components/motion/cursor-label';
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
            alt=""
            width={560}
            height={560}
            className="block overflow-hidden rounded-lg"
          />
        </div>
      </div>

      {/* CursorLabel is decoration and says so itself: it renders `aria-hidden`,
          only builds on a real pointer, and stands down under reduced motion.
          A row that links is a plain <a> underneath, so nothing here is the
          only way to learn a link is a link. The label overstates the rows that
          carry no href — it is pointer-only decoration and those rows do not
          respond to a click, which is the honest signal. */}
      <CursorLabel label={dict.common.readArticle}>
        <ul className="stagger divide-border border-border mt-16 divide-y border-y">
          {WRITING.map((article, i) => (
            <li
              key={article.title.en}
              className="reveal"
              style={{ '--i': i } as React.CSSProperties}
            >
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
                    </div>
                  </>
                );
                // An entry with no href is a note on work that has no published
                // article and no repo of its own. It renders as a row, not as a
                // link: an <a> without href is not focusable and announces as
                // plain text anyway, so building one would only look clickable
                // to a sighted mouse user. See src/content/writing.ts.
                return article.href ? (
                  <a
                    href={article.href}
                    rel="noreferrer noopener"
                    className={`${ROW} duration-fast group hover:bg-surface transition-colors`}
                  >
                    {body}
                  </a>
                ) : (
                  <div className={ROW}>{body}</div>
                );
              })()}
            </li>
          ))}
        </ul>
      </CursorLabel>
    </Section>
  );
}
