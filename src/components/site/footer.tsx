import type { Locale } from '@/content/locales';
import type { Dictionary } from '@/content/dictionaries';
import { SITE } from '@/content/site';
import { CONTACTS } from '@/content/contacts';
import { Container } from './container';
import { ArrowUp } from './contact-icons';

/** Draws only from `CONTACTS` and `SITE`, plus the one piece of chrome the
 *  dictionary has for it (the way back up).
 *
 *  Dark in both themes, like the Contact band it follows. It used to take the
 *  page's theme, so in light mode the page closed on a navy band and then a
 *  pale strip under it — two endings, the second one reading as leftover. Now
 *  the band and the footer are one closing block, split by a hairline. The
 *  location and role line lives here and only here; the band above used to
 *  repeat it word for word 200px higher. */
export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const year = new Date().getFullYear();

  return (
    <footer data-theme="dark" className="bg-background text-foreground">
      <Container>
        <div className="border-border flex flex-col gap-8 border-t py-10 sm:py-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="font-semibold">{SITE.name}</p>
              <p className="text-muted-foreground mt-1 flex items-start gap-2 text-sm">
                <span className="status-dot mt-1.5 shrink-0" aria-hidden="true" />
                {SITE.location[locale]} · {SITE.status[locale]}
              </p>
            </div>

            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {CONTACTS.map((contact) => (
                <li key={contact.key}>
                  <a
                    href={contact.url}
                    {...(contact.download
                      ? { download: true }
                      : { target: '_blank', rel: 'noreferrer noopener' })}
                    className="text-muted-foreground hover:text-foreground duration-fast transition-colors"
                  >
                    {contact.label[locale]}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-border-soft text-muted-foreground flex items-center justify-between gap-4 border-t pt-6 text-xs">
            <p>
              © {year} {SITE.name}
            </p>
            <a
              href="#main"
              className="hover:text-foreground duration-fast group inline-flex items-center gap-1.5 transition-colors"
            >
              {dict.common.backToTop}
              <ArrowUp className="duration-fast size-3.5 transition-transform group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
