import '@fontsource-variable/inter';
import '../globals.css';
import { LOCALES } from '@/content/locales';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ lang: locale }));
}

export default function RootLayout({ children }: LayoutProps<'/[lang]'>) {
  return (
    <html lang="vi" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
