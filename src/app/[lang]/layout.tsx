import '@fontsource-variable/inter';
import '../globals.css';
import { LOCALES } from '@/content/locales';
import { ThemeScript } from '@/components/site/theme-script';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ lang: locale }));
}

export default function RootLayout({ children }: LayoutProps<'/[lang]'>) {
  return (
    <html lang="vi" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
