import '@fontsource-variable/inter';
import '../globals.css';

export function generateStaticParams() {
  // Replaced in Task 2 with LOCALES.map(...).
  return [{ lang: 'vi' }, { lang: 'en' }];
}

export default function RootLayout({ children }: LayoutProps<'/[lang]'>) {
  return (
    <html lang="vi" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
