import type { MetadataRoute } from 'next';
import { SITE } from '@/content/site';

// `output: 'export'` needs every metadata route to declare itself static up
// front — without this, `next build` refuses to collect page data for it.
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
