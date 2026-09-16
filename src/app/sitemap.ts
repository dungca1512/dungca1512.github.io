import type { MetadataRoute } from 'next';
import { LOCALES } from '@/content/locales';
import { SITE } from '@/content/site';

// `output: 'export'` needs every metadata route to declare itself static up
// front — without this, `next build` refuses to collect page data for it.
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => ({
    url: `${SITE.url}/${locale}/`,
    lastModified: new Date(),
    alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE.url}/${l}/`])) },
  }));
}
