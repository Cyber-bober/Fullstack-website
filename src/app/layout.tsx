import "@/app/globals.css";
import Nav from "@/components/ui/Nav";
import MobileHeader from "@/components/ui/MobileHeader";
import Footer from "@/components/ui/Footer";
import Providers from "@/components/ui/Providers";
import CookieBanner from "@/components/ui/CookieBanner";
import BreadCrumbs from "@/components/ui/BreadCrumbs";
import { OrganizationJsonLd, JsonLd } from "@/components/ui/JsonLd";
import { Inter } from "next/font/google";
import Script from "next/script";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  
  title: {
    default: "RTLive - Футбольные новости, трансляции матчей, статистика команд",
    template: "%s | RTLive - Футбольный портал",
  },
  
  description: "RTLive - актуальные футбольные новости Ртищево и России. Прямые трансляции матчей, статистика команд и игроков, календарь игр, текстовые онлайн-трансляции. Следите за футболом в реальном времени.",
  
  keywords: [
    "футбол", "футбольные новости", "трансляции футбола", "статистика футбола",
    "календарь матчей", "онлайн трансляции", "футбол России", "РПЛ", "ФНЛ",
    "команды футбола", "игроки футбола", "составы команд", "рейтинг команд",
    "результаты матчей", "футбол онлайн", "live футбол", "текстовая трансляция",
    "sports news", "football news", "live stream", "match statistics",
    "sports analytics", "football Russia", "football live", "Ртищево",
    "Ртищево Спортивные новости", "Спорт", "Александр Миронов", "Стадион",
    "Стадион Локомотив", "Локомотив", "ФОК", "ФОК Ртищево"
  ],
  
  authors: [
    { name: "RTLive Team", url: baseUrl },
  ],
  
  creator: "RTLive",
  publisher: "RTLive Football Portal",
  
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  
  alternates: {
    canonical: "/",
  },
  
  openGraph: {
    title: "RTLive - Футбольные новости и трансляции",
    description: "Актуальные футбольные новости Ртищево и России. Прямые трансляции матчей, статистика команд и игроков.",
    url: baseUrl,
    siteName: "RTLive",
    locale: "ru_RU",
    type: "website",
    images: [
      {
        url: "/uploads/img/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "RTLive - Футбольный портал",
      },
    ],
  },
  
  twitter: {
    card: "summary_large_image",
    title: "RTLive - Футбольные новости",
    description: "Актуальные футбольные новости и трансляции",
    images: ["/uploads/img/og-image.jpg"],
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  category: "sports",
  
  other: {
    "geo.region": "RU-SAR",
    "geo.placename": "Ртищево",
    "geo.position": "51.4025;43.7833",
    "ICBM": "51.4025, 43.7833",
    "rating": "general",
    "revisit-after": "1 days",
    "distribution": "global",
  },
  
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
  },
  
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RTLive",
  },
  
  applicationName: "RTLive",
  referrer: "origin-when-cross-origin",
  generator: "Next.js",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a1628" },
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
  ],
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/uploads/img/icon-192.png" />
        <link rel="apple-touch-icon" href="/uploads/img/apple-touch-icon.png" />
        
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                `,
              }}
            />
          </>
        )}
        
        {/* Yandex Metrika */}
        {process.env.NEXT_PUBLIC_YM_ID && (
          <Script
            id="yandex-metrika"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
                (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
                ym(${process.env.NEXT_PUBLIC_YM_ID}, "init", {
                  clickmap:true,
                  trackLinks:true,
                  accurateTrackBounce:true
                });
              `,
            }}
          />
        )}
      </head>
      <body className={inter.className} data-theme="dark">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
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

        <OrganizationJsonLd
          data={{
            name: "RTLive",
            url: baseUrl,
            logo: `${baseUrl}/uploads/img/logo.png`,
            description: "Футбольный портал с новостями, трансляциями и статистикой команд Ртищево",
            sameAs: [
              "https://vk.com/rtlive",
              "https://t.me/rtlive",
            ],
          }}
        />

        <JsonLd
          type="WebSite"
          data={{
            name: "RTLive",
            url: baseUrl,
            potentialAction: {
              "@type": "SearchAction",
              target: `${baseUrl}/news?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }}
        />

        <Providers>
          <Nav />
          <MobileHeader />
          
          <div className="main-wrapper">
            <main className="main-content">
              <BreadCrumbs />
              {children}
            </main>
            <Footer />
          </div>
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}