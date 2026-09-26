import type { Metadata } from 'next';
import '@fontsource-variable/inter';
import './globals.css';
import { ThemeScript } from '@/components/site/theme-script';
import { localeHref } from '@/lib/paths';
import vi from '@/content/dictionaries/vi';
import en from '@/content/dictionaries/en';

// Both existing `notFound.title` strings, composed rather than one invented:
// there is no locale to pick a single title from, same as the body below.
export const metadata: Metadata = {
  title: `${vi.notFound.title} / ${en.notFound.title}`,
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
};

/** There is no `app/layout.tsx` — the root layout that carries `<html>` and
 *  `<body>` lives at `app/[lang]/layout.tsx`, scoped to the `[lang]` segment.
 *  A 404 for a path outside that segment (or for `/[lang]` itself, before the
 *  locale is known) has nothing wrapping it, so this file renders its own
 *  document. There is no locale to read at this point either, so both
 *  languages are shown rather than guessing one. */
export default function NotFound() {
  return (
    <html
      lang="vi"
      className="h-full antialiased"
      data-theme="dark"
      data-theme-pref="dark"
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="bg-background text-foreground flex min-h-full flex-col items-center justify-center gap-10 px-5 py-20 text-center">
        <section lang="vi" className="flex flex-col items-center gap-3">
          <p className="text-muted-foreground text-sm font-semibold tracking-[0.14em] uppercase">
            404
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{vi.notFound.title}</h1>
          <a href={localeHref('vi')} className="text-primary underline underline-offset-4">
            {vi.notFound.back}
          </a>
        </section>

        <section lang="en" className="flex flex-col items-center gap-3">
          <p className="text-muted-foreground text-sm font-semibold tracking-[0.14em] uppercase">
            404
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{en.notFound.title}</h1>
          <a href={localeHref('en')} className="text-primary underline underline-offset-4">
            {en.notFound.back}
          </a>
        </section>
      </body>
    </html>
  );
}
