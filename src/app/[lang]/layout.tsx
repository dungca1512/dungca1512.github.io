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
    icons: { icon: '/favicon.svg' },
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
