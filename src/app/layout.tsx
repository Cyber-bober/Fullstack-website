import type { Metadata, Viewport } from 'next';
import Navigation from '@/presentation/components/ui/Navigation';
import Footer from '@/presentation/components/ui/Footer';
import CookieBanner from '@/presentation/components/cookie/CookieBanner';
import SessionProvider from '@/presentation/providers/SessionProvider';
import ThemeProvider from '@/presentation/providers/ThemeProvider';
import GlassWrapper from '@/presentation/providers/GlassWrapper';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body style={{ margin: 0 }}>
        <SessionProvider>
          <ThemeProvider>
            <Navigation />
            <GlassWrapper>
              <main style={{ minHeight: 'calc(100vh - 160px)' }}>{children}</main>
            </GlassWrapper>
            <Footer />
            <CookieBanner />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
