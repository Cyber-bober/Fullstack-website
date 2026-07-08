"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Breadcrumb {
  name: string;
  href: string;
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  
  if (!pathname) return null;
  
  const breadcrumbs = generateBreadcrumbs(pathname);
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      item: `${baseUrl}${b.href}`,
    })),
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className="breadcrumbs">
        <ol>
          {breadcrumbs.map((b, i) => (
            <li key={b.href}>
              {i > 0 && <span className="separator">/</span>}
              {i === breadcrumbs.length - 1 ? (
                <span aria-current="page">{b.name}</span>
              ) : (
                <Link href={b.href}>{b.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}

function generateBreadcrumbs(pathname: string): Breadcrumb[] {
  const paths = pathname.split("/").filter(Boolean);
  const breadcrumbs: Breadcrumb[] = [{ name: "Главная", href: "/" }];
  
  const names: Record<string, string> = {
    news: "Новости",
    teams: "Команды",
    matches: "Матчи",
    profile: "Профиль",
    admin: "Админ",
    auth: "Авторизация",
    signin: "Вход",
    register: "Регистрация",
    chat: "Чат",
    support: "Поддержка",
    livestream: "Трансляция",
    calendar: "Календарь",
    edit: "Редактирование",
  };
  
  let currentPath = "";
  paths.forEach((path) => {
    currentPath += `/${path}`;
    breadcrumbs.push({
      name: names[path] || path.charAt(0).toUpperCase() + path.slice(1),
      href: currentPath,
    });
  });
  
  return breadcrumbs;
}