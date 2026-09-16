import { Section, SectionHeading } from '@/components/site/section';
import { Illustration } from '@/components/site/illustration';
import { CONTACTS } from '@/content/contacts';
import { SITE } from '@/content/site';
import { getDictionary, getLocale } from '@/content/dictionaries';
import { DrawnUnderline } from '@/components/motion/drawn-underline';

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

      <ul className="stagger wide:grid-cols-3 mt-14 grid gap-4 sm:grid-cols-2">
        {CONTACTS.map((contact, i) => (
          <li key={contact.key} className="reveal" style={{ '--i': i } as React.CSSProperties}>
            <a
              href={contact.url}
              {...(contact.download ? { download: '' } : { rel: 'noreferrer noopener' })}
              className="duration-fast contact-card border-border flex flex-col gap-1 rounded-lg border p-6 transition-colors"
            >
              <span className="text-muted-foreground text-sm tracking-[0.12em] uppercase">
                {contact.label[locale]}
              </span>
              <span className="text-lg font-medium break-all">{displayTarget(contact.url)}</span>
            </a>
          </li>
        ))}
      </ul>

      <p className="text-muted-foreground mt-14">
        {SITE.location[locale]} · {SITE.status[locale]}
      </p>
    </Section>
  );
}
