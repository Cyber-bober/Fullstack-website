// src/app/teams/profile/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TeamProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      try {
        const profileRes = await fetch("/api/profile/me");
        if (profileRes.ok) {
          const data = await profileRes.json();
          if (data.teamId) {
            router.replace(`/teams/${data.teamId}`);
          } else {
            router.replace("/teams"); // Если нет команды, кидаем в список
          }
        } else {
          router.replace("/auth/signin");
        }
      } catch {
        router.replace("/teams");
      }
    };
    redirect();
  }, [router]);

  return <div className="container"><p className="empty-text">Перенаправление...</p></div>;
}