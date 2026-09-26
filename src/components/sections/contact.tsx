import { Section, SectionHeading } from '@/components/site/section';
import { Illustration } from '@/components/site/illustration';
import { CONTACTS } from '@/content/contacts';
import { getDictionary, getLocale } from '@/content/dictionaries';
import { DrawnUnderline } from '@/components/motion/drawn-underline';
import { CopyButton } from '@/components/site/copy-button';
import {
  ArrowRight,
  ArrowUpRight,
  Download,
  GitHubMark,
  LinkedInMark,
} from '@/components/site/contact-icons';

/** The data has a label and a url and nothing in between — there is no separate
 *  display string, and inventing one would mean writing contact details that are
 *  not in the source. So the card shows the url with its plumbing removed: the
 *  scheme, the mailto query, the `www.`, the trailing slash. Everything shown is
 *  still literally the destination. */
function displayTarget(url: string): string {
  if (url.startsWith('mailto:')) return url.slice('mailto:'.length).split('?')[0]!;
  if (url.startsWith('https://')) {
    const { hostname, pathname } = new URL(url);
    return `${hostname.replace(/^www\./, '')}${pathname.replace(/\/$/, '')}`;
  }
  return url.replace(/^\//, '');
}

/** The last band, and the only dark one. `dark` on Section sets data-theme, so
 *  every token inside flips — nothing here needs a dark-specific class. */
export async function Contact() {
  const locale = await getLocale();
  const dict = await getDictionary();
  const email = CONTACTS.find((c) => c.key === 'email')!;
  const booking = CONTACTS.find((c) => c.key === 'book-a-call')!;
  const cv = CONTACTS.find((c) => c.download)!;
  const profiles = CONTACTS.filter((c) => c.url.startsWith('https://'));
  const address = displayTarget(email.url);

  return (
    <Section id="contact" dark blueprint>
      <div className="wide:grid-cols-[minmax(0,1fr)_minmax(14rem,20rem)] wide:items-center grid gap-12">
        <div>
          <SectionHeading
            titleId="contact"
            eyebrow={dict.sections.contact.eyebrow}
            title={dict.sections.contact.title}
            lead={dict.sections.contact.lead}
            stacked
          />
          <DrawnUnderline className="mt-4 max-w-md" />
        </div>
        <Illustration
          name="contact"
          parallax
          darkGround
          alt=""
          width={560}
          height={560}
          className="block overflow-hidden rounded-lg"
        />
      </div>

      {/* One destination carries the band: the address, set large enough to
          read as the answer to the headline's question. It used to be one card
          of five at equal weight, beside a "book a call" card that showed the
          very same address — two tiles saying one thing, and an orphaned sixth
          cell in the three-column grid. Booking and the CV are actions, so
          they are buttons; the two profiles are places, so they are a list. */}
      <div className="border-border wide:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] wide:items-end mt-14 grid gap-10 border-t pt-10 sm:mt-16 sm:pt-12">
        <div className="reveal min-w-0">
          <p className="text-muted-foreground text-sm">{email.label[locale]}</p>
          <div className="mt-3 flex items-center gap-3">
            <a
              href={email.url}
              className="contact-email text-[clamp(1.25rem,3.1vw,2.5rem)] leading-tight font-semibold tracking-tight sm:whitespace-nowrap"
            >
              {/* The only break opportunity is after the @: each half is held
                  whole, so on a phone the domain drops to its own line instead
                  of splitting at a hyphen inside it. */}
              <span className="whitespace-nowrap">{address.split('@')[0]}@</span>
              <wbr />
              <span className="whitespace-nowrap">{address.split('@')[1]}</span>
            </a>
            <CopyButton
              value={address}
              label={dict.common.copyEmail}
              copiedLabel={dict.common.copied}
              className="text-muted-foreground hover:text-foreground border-border hover:bg-surface-muted duration-fast inline-flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors"
            />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={booking.url}
              className="group duration-fast ease-out-soft bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-full px-6 py-3 font-medium transition-transform hover:-translate-y-0.5"
            >
              {booking.label[locale]}
              <ArrowRight className="duration-fast size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href={cv.url}
              download=""
              className="duration-fast border-border hover:bg-surface-muted inline-flex items-center gap-2 rounded-full border px-6 py-3 font-medium transition-colors"
            >
              <Download className="size-4" />
              {cv.label[locale]}
            </a>
          </div>
        </div>

        <ul className="stagger grid gap-3">
          {profiles.map((contact, i) => {
            const Mark = contact.key === 'github' ? GitHubMark : LinkedInMark;
            return (
              <li key={contact.key} className="reveal" style={{ '--i': i } as React.CSSProperties}>
                <a
                  href={contact.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group contact-card border-border duration-fast flex items-center gap-4 rounded-lg border px-5 py-4 transition-colors"
                >
                  <Mark className="text-foreground size-6 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{contact.label[locale]}</span>
                    <span className="text-muted-foreground block truncate text-sm">
                      {displayTarget(contact.url)}
                    </span>
                  </span>
                  <ArrowUpRight className="text-muted-foreground group-hover:text-foreground duration-fast size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}
