// src/app/layout.tsx
import "@/app/globals.css";
import Nav from "@/components/ui/Nav";

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
        {children}
      </body>
    </html>
  );
}