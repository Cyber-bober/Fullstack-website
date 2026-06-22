import "@/app/globals.css";
import Nav from "@/components/ui/Nav";
import Footer from "@/components/ui/Footer";
import Providers from "@/components/ui/Providers";
import CookieBanner from "@/components/ui/CookieBanner";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" data-theme="dark">
      <body className={inter.className} data-theme="dark">
        <Providers>
          <Nav />
          <div className="main-wrapper">
            <main className="main-content">
              {children}
            </main>
            <Footer />
          </div>
          <CookieBanner />
        </Providers>
        <ThemeInitializer />
      </body>
    </html>
  );
}

function ThemeInitializer() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var theme = localStorage.getItem('theme') || 'dark';
              document.documentElement.setAttribute('data-theme', theme);
              document.body.setAttribute('data-theme', theme);
            } catch (e) {}
          })();
        `,
      }}
    />
  );
}