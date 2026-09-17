import type { Metadata } from 'next';
import '@fontsource-variable/inter';
import '../globals.css';
import { LOCALES, BCP47 } from '@/content/locales';
import { getDictionary, getLocale } from '@/content/dictionaries';
import { SITE } from '@/content/site';
import { MenuBar } from '@/components/layout/menu-bar';
import { Footer } from '@/components/site/footer';
import { SkipLink } from '@/components/site/skip-link';
import { ThemeScript } from '@/components/site/theme-script';
import { IntroCurtain } from '@/components/site/intro-curtain';
import { BackdropMotifs } from '@/components/site/backdrop-motifs';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ lang: locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const current = await getLocale();
  const dict = await getDictionary();

  return {
    metadataBase: new URL(SITE.url),
    title: { default: dict.meta.title, template: `%s — ${SITE.name}` },
    description: dict.meta.description,
    alternates: {
      canonical: `/${current}/`,
      // Without hreflang, a search engine treats the two languages as
      // duplicate content and picks one for everybody.
      languages: { vi: '/vi/', en: '/en/', 'x-default': '/vi/' },
    },
    openGraph: {
      type: 'website',
      siteName: SITE.name,
      locale: current,
      title: dict.meta.title,
      description: dict.meta.description,
    },
    // A raster, not the drawn SVG this replaces. The mark is a generated
    // illustration in the same hand-drawn line style as the rest of the
    // site's art, and there is no vector of it - see scripts/build-favicon.sh
    // for how the .ico is cut. One file carries 16, 32, 48 and 64; the
    // browser takes the size it wants, and anything that never reads this
    // HTML still finds /favicon.ico by convention.
    icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  };
}

export default async function RootLayout({ children }: LayoutProps<'/[lang]'>) {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <html lang={BCP47[locale]} className="h-full antialiased" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="bg-background text-foreground flex min-h-full flex-col">
        {/* First in the body and outside <main>: it covers the whole page, not
            one section, and a fixed element inside a transformed ancestor
            would be clipped to that ancestor instead of the viewport. */}
        <IntroCurtain />
        {/* The page's ground. Fixed to the viewport and z-index -1, so it
            must be outside <main> and outside anything that establishes a
            containing block. aria-hidden: it is texture. The element itself
            paints the circuit board out of gradients; its one child draws the
            motifs on top of it, and inherits the mask and the fixed position
            by being inside rather than beside it. */}
        <div className="tech-backdrop" aria-hidden="true">
          <BackdropMotifs />
        </div>
        <SkipLink label={dict.nav.skipToContent} />
        <MenuBar locale={locale} dict={dict} />
        {/* tabIndex=-1: Safari has historically not moved focus to a
            non-focusable fragment target, so #main needs to be focusable for
            the skip link to actually work there. Chromium and Firefox already
            handle an unfocusable target correctly; this is the one-attribute
            hedge for the browser that doesn't. */}
        <main id="main" tabIndex={-1} className="flex-1">
          {children}
        </main>
        <Footer locale={locale} />
      </body>
    </html>
  );
}
