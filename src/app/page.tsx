// src/app/page.tsx

"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NewsSection } from "@/components/ui/NewsSection";
import { LiveSection } from "@/components/ui/LiveSection";
import { CalendarSection } from "@/components/ui/CalendarSection";
import Pagination from "@/components/ui/Pagination";
import Toast from "@/components/ui/Toast";
import { NewsPost, Match } from "@/types/page";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<"news" | "live" | "calendar">("news");
  const [matches, setMatches] = useState<Match[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Состояния для новостей и пагинации
  const [newsData, setNewsData] = useState<{ data: NewsPost[]; meta: any } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null);

  // Загрузка данных при изменении табов или параметров URL (пагинация/поиск)
  useEffect(() => {
    const loadData = async () => {
      try {
        // Параллельная загрузка сессии и матчей (они не зависят от пагинации)
        const [sessionRes, matchesRes] = await Promise.all([
          fetch("/api/auth/session"),
          fetch("/api/matches"),
        ]);

        if (sessionRes.ok) {
          const session = await sessionRes.json();
          setUserRole(session?.user?.role || null);
          setCurrentUserId(session?.user?.id || null);
        }
        
        if (matchesRes.ok) {
          const data = await matchesRes.json();
          setMatches(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Ошибка загрузки базовых данных:", err);
      }
    };
    
    loadData();
  }, []);

  // Отдельный эффект для загрузки новостей (зависит от поиска и страницы)
  useEffect(() => {
    if (activeTab !== "news") return;

    const page = searchParams.get("page") || "1";
    const q = searchParams.get("q") || "";
    
    // Синхронизируем локальное состояние поиска с URL
    setSearchQuery(q);

    fetch(`/api/news?page=${page}&limit=10&q=${encodeURIComponent(q)}`)
      .then(res => {
        if (!res.ok) throw new Error("Ошибка сервера");
        return res.json();
      })
      .then(data => setNewsData(data))
      .catch(() => setToast({ msg: "Не удалось загрузить новости", type: "error" }));
      
  }, [activeTab, searchParams]);

  // Обработчик поиска
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", searchQuery);
    params.set("page", "1"); // Сброс на первую страницу
    router.push(`?${params.toString()}`);
  };

  // Исправление ошибки типов: создаем явную функцию обновления
  const handleUpdateNews = useCallback((newPosts: NewsPost[]) => {
    setNewsData(prev => prev ? { ...prev, data: newPosts } : null);
  }, []);

  return (
    <div className="container">
      {/* Глобальный контейнер для уведомлений */}
      {toast && (
        <div className="toast-container">
          <Toast 
            message={toast.msg} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        </div>
      )}

      <h1 className="home-title">Football Hub</h1>

      <div className="tabs">
        <button className={`tab ${activeTab === "news" ? "active" : ""}`} onClick={() => setActiveTab("news")}>Новости</button>
        <button className={`tab ${activeTab === "live" ? "active" : ""}`} onClick={() => setActiveTab("live")}>Текстовая трансляция</button>
        <button className={`tab ${activeTab === "calendar" ? "active" : ""}`} onClick={() => setActiveTab("calendar")}>Календарь событий</button>
      </div>

      {activeTab === "news" && (
        <>
          {/* Панель поиска */}
          <form onSubmit={handleSearch} className="search-bar">
            <input 
              type="text" 
              placeholder="Поиск по названию или содержанию..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn btn-primary">Найти</button>
          </form>

          <NewsSection 
            news={newsData?.data || []} 
            setNews={handleUpdateNews} // <-- Используем безопасную обертку
            userRole={userRole} 
            currentUserId={currentUserId ?? undefined} 
          />

          {/* Пагинация */}
          {newsData?.meta && (
            <Pagination 
              currentPage={newsData.meta.page} 
              totalPages={newsData.meta.totalPages} 
            />
          )}
        </>
      )}
      
      {activeTab === "live" && <LiveSection matches={matches} userRole={userRole} />}
      {activeTab === "calendar" && <CalendarSection matches={matches} />}
    </div>
  );
}