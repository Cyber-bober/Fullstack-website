"use client";
import { useEffect, useState } from "react";

interface OrganizationSchema {
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs?: string[];
}

export function OrganizationJsonLd({ data }: { data: OrganizationSchema }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: data.name,
    url: data.url,
    logo: data.logo,
    description: data.description,
    sameAs: data.sameAs || [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["Russian", "English"],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ArticleJsonLd({ 
  title, 
  description, 
  image, 
  author, 
  datePublished 
}: {
  title: string;
  description: string;
  image?: string;
  author: string;
  datePublished: string;
}) {
  const [currentUrl, setCurrentUrl] = useState("");
  
  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: image ? [image] : [],
    author: {
      "@type": "Person",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: "RTLive",
      logo: {
        "@type": "ImageObject",
        url: "/uploads/img/logo.png",
      },
    },
    datePublished,
    dateModified: datePublished,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": currentUrl || "http://localhost:3000",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function SportsTeamJsonLd({ 
  name, 
  sport, 
  logo, 
  url 
}: {
  name: string;
  sport: string;
  logo?: string;
  url: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name,
    sport,
    logo: logo || "",
    url,
    member: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function SportsEventJsonLd({
  name,
  startDate,
  endDate,
  location,
  competitor,
}: {
  name: string;
  startDate: string;
  endDate?: string;
  location: string;
  competitor: Array<{ name: string }>;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name,
    startDate,
    endDate: endDate || startDate,
    location: {
      "@type": "Place",
      name: location,
    },
    competitor: competitor.map(c => ({
      "@type": "SportsTeam",
      name: c.name,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface JsonLdProps {
  type: string;
  data: any;
}

export function JsonLd({ type, data }: JsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": type,
    ...data,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}