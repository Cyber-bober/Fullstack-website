// src/app/layout.tsx

import "@/app/globals.css";
import Nav from "@/components/ui/Nav";
import Footer from "@/components/ui/Footer";
import Providers from "@/components/ui/Providers";
import { Inter } from "next/font/google";
import CookieBanner from "@/components/ui/CookieBanner";
import SupportWidget from "@/components/ui/SupportMessage";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <Providers> {}
          <Nav />
          <main style={{ minHeight: "calc(100vh - 140px)" }}>
            {children}
          </main>
          <Footer />
        </Providers>
        <CookieBanner/>
        <SupportWidget/>
      </body>
    </html>
  );
}