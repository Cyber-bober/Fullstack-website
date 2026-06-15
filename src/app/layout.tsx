// src/app/layout.tsx
import "@/app/globals.css";
import Nav from "@/components/ui/Nav";
import Providers from "@/components/ui/Providers";
import CookieBanner from "@/components/ui/CookieBanner";
import SupportWidget from "@/components/ui/SupportWidget";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <Providers>
          {/* Новая раскладка: Сайдбар слева, контент справа */}
          <div className="app-layout">
            <Nav />
            
            <main className="main-content">
              {children}
            </main>
          </div>
          
          <CookieBanner />
          <SupportWidget />
        </Providers>
      </body>
    </html>
  );
}