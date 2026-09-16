import type { Locale } from '@/content/locales';
import { SITE } from '@/content/site';
import { CONTACTS } from '@/content/contacts';
import { Container } from './container';

/** Draws only from `CONTACTS` and `SITE` — no string here is invented. No
 *  `dict` prop: unlike `MenuBar`, this component has nothing of its own to
 *  read out of the dictionary, and a required-but-unread prop is a false
 *  claim in a signature every later task calls. */
export function Footer({ locale }: { locale: Locale }) {
  return (
    <footer className="border-border border-t">
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">{SITE.name}</p>
          <p className="text-muted-foreground text-sm">
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
                  : { target: '_blank', rel: 'noreferrer' })}
                className="text-muted-foreground hover:text-foreground duration-fast transition-colors"
              >
                {contact.label[locale]}
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </footer>
  );
}
