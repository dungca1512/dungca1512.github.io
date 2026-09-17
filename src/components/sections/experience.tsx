import { Section, SectionHeading } from '@/components/site/section';
import { Illustration } from '@/components/site/illustration';
import { Disclosure } from '@/components/site/disclosure';
import { HighlightIcon } from '@/components/site/highlight-icon';
import { EXPERIENCE, EDUCATION, CERTIFICATION, type Role } from '@/content/experience';
import { getDictionary, getLocale } from '@/content/dictionaries';
import type { Locale } from '@/content/locales';

/** One role on the axis. Lifted out of the map so the folded roles and the
 *  open one are the same node — same dot, same spacing, same icons — rather
 *  than the same JSX typed twice and then edited once. */
function RoleItem({ role, locale, index }: { role: Role; locale: Locale; index: number }) {
  return (
    <li className="reveal relative" style={{ '--i': index } as React.CSSProperties}>
      <span
        aria-hidden="true"
        className="border-background bg-primary absolute top-2 -left-[2.4rem] size-3 rounded-full border-2"
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
      {/* The glyph is the bullet. Every line used to open with the
          same 6px dot, so the left edge — the column a scanning eye
          actually travels down — carried no information at all. The
          glyph is chosen per line in the content module, index-aligned
          with the text; `?? 'pipeline'` is a render-time floor only,
          because the lengths are pinned equal in the tests and a
          missing entry should fail there, not silently here. */}
      <ul className="mt-4 space-y-2.5">
        {role.highlights[locale].map((line, j) => (
          <li key={line} className="text-muted-foreground flex gap-3">
            <HighlightIcon
              glyph={role.glyphs[j] ?? 'pipeline'}
              className="text-ink-primary mt-0.5 size-[1.15rem] shrink-0"
            />
            {line}
          </li>
        ))}
      </ul>
      <ul className="mt-4 flex flex-wrap gap-2">
        {role.stack.map((tool) => (
          <li key={tool} className="pop-on-hover bg-surface rounded-full px-2.5 py-0.5 text-sm">
            {tool}
          </li>
        ))}
      </ul>
    </li>
  );
}

export async function Experience() {
  const locale = await getLocale();
  const dict = await getDictionary();

  /* The data is newest-first and `current` is asserted to be its head, so the
     head is the open role and the tail — reversed — is the past, read
     forwards. Taking them apart by the `current` flag rather than by index
     would be the same split today and a different one the day a second role
     runs concurrently; the flag says "this is the one still running", not
     "this is the one to show". */
  const [now, ...before] = EXPERIENCE;
  const earlier = before.toReversed();

  return (
    <Section id="experience">
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
        {/* An axis, not just a list.
            The rail is the WRAPPER's left border rather than the list's, so the
            two caps can hang off the same line the roles do — without them the
            rail started at the first role and stopped at the last, which is a
            list with a stripe beside it, not a time axis. With them it has a
            beginning, a direction and an end.

            And it reads upward in time. It used to run newest-first, the way a
            CV does, so the page opened on the present and worked backwards —
            "thời gian k để tăng dần từ quá khứ đến hiện tại mà lại ngược lại?".
            A CV is a reference document that a reader scans; this section is an
            argument that a reader follows, and an argument for someone growing
            into harder problems has to be told forwards. The split above
            copies, so the module's own newest-first order — which `current`
            being EXPERIENCE[0] depends on — is untouched. */}
        {/* `border-primary/25`, not `border-border`. The rail used to be a 1px
            hairline in the border token, which against the page ground measures
            about 1.1:1 — present in the DOM and invisible on the screen, which
            is the worst state for the one line that is supposed to say "this is
            an axis". Two pixels of the brand ink at a quarter strength reads as
            a drawn line without competing with the text beside it. */}
        <div className="border-primary/25 border-l-2">
          <p className="text-muted-foreground relative pb-8 pl-8 text-sm tracking-[0.12em] uppercase">
            <span
              aria-hidden="true"
              className="border-border bg-background absolute top-1.5 -left-[0.4rem] size-2.5 rounded-full border-2"
            />
            {dict.sections.experience.axisStart}
          </p>

          {/* The past, folded into one node on the axis.
              What a reader needs from a timeline at a glance is the shape — how
              long, how many steps, where it ends up — and the shape survives
              this: the fold sits exactly where those years sit, carries its own
              dot, and names the companies in its summary line. What folds is
              the prose, which is the part that is also on the CV. Opening it
              gives back the roles in full, icons and stack chips and all.

              A hollow dot, matching the axis's opening cap rather than the
              filled dots of the open roles: a node that is there and not
              expanded, which is what it is. */}
          {earlier.length > 0 ? (
            <div className="relative pb-10 pl-8">
              <span
                aria-hidden="true"
                className="border-border bg-background absolute top-6 -left-[0.4rem] size-2.5 rounded-full border-2"
              />
              <Disclosure
                label={dict.common.earlierRoles
                  .replace('{count}', String(earlier.length))
                  .replace('{names}', earlier.map((role) => role.company).join(', '))}
              >
                <ol className="stagger mt-10 space-y-10">
                  {earlier.map((role, i) => (
                    <RoleItem key={role.company} role={role} locale={locale} index={i} />
                  ))}
                </ol>
              </Disclosure>
            </div>
          ) : null}

          <ol className="stagger space-y-10 pl-8">
            <RoleItem role={now} locale={locale} index={0} />
          </ol>

          <p className="text-ink-primary relative pt-8 pl-8 text-sm font-semibold tracking-[0.12em] uppercase">
            <span
              aria-hidden="true"
              className="border-background bg-primary absolute bottom-1.5 -left-[0.4rem] size-2.5 rounded-full border-2"
            />
            {dict.sections.experience.axisNow}
          </p>
        </div>

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
            {/* Rendered only when there is one. The certification carries no
                detail line, and an unconditional <p> would emit an empty
                paragraph — visible as uneven card heights, and the kind of
                blank the check:content `undefined` gate does not catch. */}
            {entry.detail && <p className="text-muted-foreground mt-1">{entry.detail[locale]}</p>}
          </div>
        ))}
      </div>
    </Section>
  );
}
