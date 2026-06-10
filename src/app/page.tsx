// src/app/page.tsx
"use client";
import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";

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

      {/* ВКЛАДКИ */}
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

      {/* КОНТЕНТ */}
      {activeTab === "news" && (
        <div>
          <h2 className="section-title">Новости</h2>
          {(!Array.isArray(news) || news.length === 0) ? (
            <p className="empty-text">Новостей пока нет</p>
          ) : (
            news.map((p) => (
              <Card key={p.id} className="news-card">
                {p.imageUrl && <img src={p.imageUrl} alt={p.title} className="news-image" />}
                <h3 className="news-title">{p.title}</h3>
                <p className="news-content">{p.content}</p>
                <span className="news-meta">
                  Автор: {p.author.fullName} — {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === "live" && (
        <div>
          <h2 className="section-title">Текстовая трансляция</h2>
          <p className="empty-text">Выберите матч в форме ниже (демо)</p>
        </div>
      )}

      {activeTab === "calendar" && (
        <div>
          <h2 className="section-title">Календарь событий</h2>
          {matches.length === 0 ? (
            <p className="empty-text">Матчей пока нет</p>
          ) : (
            matches.map((m) => (
              <Card key={m.id}>
                <strong>{m.homeTeam.name}</strong> vs <strong>{m.awayTeam.name}</strong>
                <div className="text-gray">
                  {new Date(m.date).toLocaleDateString()} • {m.venue || "Не указано"}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}