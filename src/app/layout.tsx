import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SessionProvider from "./SessionProvider";

export const metadata: Metadata = { title: "Football Hub" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <SessionProvider>
          <Nav />
          <main className="max-w-4xl mx-auto p-4">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
