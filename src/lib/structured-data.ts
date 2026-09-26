import type { Locale } from '@/content/locales';
import { SITE } from '@/content/site';
import { EXPERIENCE, EDUCATION } from '@/content/experience';

/* ─── Structured data ──────────────────────────────────────────────────────
   The JSON-LD the layout puts in every page: a schema.org ProfilePage whose
   main entity is the Person. This is the markup Google documents for a page
   about one person (developers.google.com/search/docs/appearance/
   structured-data/profile-page), and it is what connects a search for the
   name to this site: `name` and `alternateName` say which queries the page
   answers, `sameAs` ties it to the profiles elsewhere that are the same
   person.

   Everything here is read from content/, so the markup cannot say anything
   the page does not. */

/** The name as people type it. Vietnamese order with diacritics is `name`;
 *  these are the spellings a search box sees instead: no diacritics, and the
 *  given-name-first order English forms use. */
const ALTERNATE_NAMES = ['Cong Anh Dung', 'Dung Cong Anh', 'Dũng Công Anh'];

export function profileJsonLd(locale: Locale) {
  const current = EXPERIENCE.find((role) => role.current) ?? EXPERIENCE[0]!;
  const url = `${SITE.url}/${locale}/`;
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${url}#page`,
    url,
    inLanguage: locale,
    name: `${SITE.name} — Portfolio`,
    mainEntity: {
      '@type': 'Person',
      '@id': `${SITE.url}/#person`,
      name: SITE.name,
      alternateName: ALTERNATE_NAMES,
      givenName: 'Dũng',
      familyName: 'Công',
      url: SITE.url,
      image: `${SITE.url}${SITE.avatar}`,
      jobTitle: 'AI/ML Systems Architect',
      description: SITE.status[locale],
      worksFor: { '@type': 'Organization', name: current.company },
      alumniOf: { '@type': 'CollegeOrUniversity', name: EDUCATION.title[locale] },
      address: {
        '@type': 'PostalAddress',
        addressLocality: locale === 'vi' ? 'Hà Nội' : 'Hanoi',
        addressCountry: 'VN',
      },
      knowsAbout: [
        'Machine Learning',
        'MLOps',
        'Speech Recognition',
        'Large Language Models',
        'Retrieval-Augmented Generation',
        'Kubernetes',
        'Cloud Infrastructure',
      ],
      sameAs: SITE.sameAs,
    },
  };
}

/** Serialised for a `<script type="application/ld+json">`. `<` is escaped so
 *  no string in the content can close the script element early. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
