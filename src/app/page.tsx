// src/app/page.tsx
"use client";
import { useState, useEffect } from "react";
import { NewsSection } from "@/components/ui/NewsSection";
import { LiveSection } from "@/components/ui/LiveSection";
import { CalendarSection } from "@/components/ui/CalendarSection";

type NewsPost = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  author: { fullName: string };
  createdAt: string;
};

type Match = {
  id: string;
  date: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  venue?: string;
  status: string;
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"news" | "live" | "calendar">("news");
  const [news, setNews] = useState<NewsPost[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [newsRes, matchesRes, sessionRes] = await Promise.all([
          fetch("/api/news"),
          fetch("/api/matches"),
          fetch("/api/auth/session"),
        ]);

        if (newsRes.ok) {
          const data = await newsRes.json();
          setNews(Array.isArray(data) ? data : []);
        }
        if (matchesRes.ok) {
          const data = await matchesRes.json();
          setMatches(Array.isArray(data) ? data : []);
        }
        if (sessionRes.ok) {
          const session = await sessionRes.json();
          setUserRole(session?.user?.role || null);
        }
      } catch (err) {
        console.error("Ошибка:", err);
      }
    };
    loadData();
  }, []);

  return (
    <div className="container">
      <h1 className="home-title">Football Hub</h1>

      <div className="tabs">
        <button
          className={`tab ${activeTab === "news" ? "active" : ""}`}
          onClick={() => setActiveTab("news")}
        >
          Новости
        </button>
        <button
          className={`tab ${activeTab === "live" ? "active" : ""}`}
          onClick={() => setActiveTab("live")}
        >
          Текстовая трансляция
        </button>
        <button
          className={`tab ${activeTab === "calendar" ? "active" : ""}`}
          onClick={() => setActiveTab("calendar")}
        >
          Календарь событий
        </button>
      </div>

      {activeTab === "news" && <NewsSection news={news} setNews={setNews} userRole={userRole} />}
      {activeTab === "live" && <LiveSection matches={matches} userRole={userRole} />}
      {activeTab === "calendar" && <CalendarSection matches={matches} />}
    </div>
  );
}