//src/app/layout.tsx

import "@/app/globals.css";
import Nav from "@/components/ui/Nav";
import Footer from "@/components/ui/Footer";

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
        <Nav />
        <main style={{ minHeight: "calc(100vh - 140px)" }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}