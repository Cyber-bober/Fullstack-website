import type { Metadata, Viewport } from 'next';
import Navigation from '@/presentation/components/ui/Navigation';
import CookieBanner from '@/presentation/components/cookie/CookieBanner';
import SessionProvider from '@/presentation/providers/SessionProvider';
import ThemeProvider from '@/presentation/providers/ThemeProvider';

export const metadata: Metadata = {
  title: 'Football Hub',
  description: 'Football community portal',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0070f3',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body style={{ margin: 0 }}>
        <SessionProvider>
          <ThemeProvider>
            <Navigation />
            <main>{children}</main>
            <CookieBanner />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
