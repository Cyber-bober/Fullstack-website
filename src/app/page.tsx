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
  const searchParams = useSearchParams() ?? new URLSearchParams();
  
  const [activeTab, setActiveTab] = useState<"news" | "live" | "calendar">("news");
  const [matches, setMatches] = useState<Match[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [newsData, setNewsData] = useState<{ data: NewsPost[]; meta: any } | null>(null);
  const [liveNewsQuery, setLiveNewsQuery] = useState(searchParams.get("q") || "");
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null);

  // Состояния для модального окна матча
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [matchForm, setMatchForm] = useState({ homeTeamId: "", awayTeamId: "", date: "", venue: "" });
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sessionRes, matchesRes, teamsRes] = await Promise.all([
          fetch("/api/auth/session"),
          fetch("/api/matches"),
          fetch("/api/teams?limit=100")
        ]);
        
        if (sessionRes.ok) { 
          const s = await sessionRes.json(); 
          setUserRole(s?.user?.role || null); 
          setCurrentUserId(s?.user?.id || null); 
        }
        if (matchesRes.ok) { 
          const d = await matchesRes.json(); 
          setMatches(Array.isArray(d) ? d : []); 
        }
        if (teamsRes.ok) {
          const t = await teamsRes.json();
          setTeams(t.data || []);
        }
      } catch (err) { console.error("Ошибка загрузки:", err); }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab !== "news") return;
    const page = searchParams.get("page") || "1";
    const q = searchParams.get("q") || "";
    setLiveNewsQuery(q);

    fetch(`/api/news?page=${page}&limit=10&q=${encodeURIComponent(q)}`)
      .then(res => { if (!res.ok) throw new Error("Ошибка сервера"); return res.json(); })
      .then(data => setNewsData(data))
      .catch(() => setToast({ msg: "Не удалось загрузить новости", type: "error" }));
  }, [activeTab, searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQ = searchParams.get("q") || "";
      if (liveNewsQuery !== currentQ) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("q", liveNewsQuery);
        params.set("page", "1");
        router.push(`?${params.toString()}`);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [liveNewsQuery, searchParams, router]);

  const handleUpdateNews = useCallback((newPosts: NewsPost[]) => {
    setNewsData(prev => prev ? { ...prev, data: newPosts } : null);
  }, []);

  const handleDeleteMatch = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот матч?")) return;
    
    setDeletingMatchId(id);
    try {
      const res = await fetch(`/api/matches?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setToast({ msg: "Матч успешно удален!", type: "success" });
        // Обновляем список матчей
        const mRes = await fetch("/api/matches");
        if (mRes.ok) setMatches(await mRes.json());
      } else {
        const err = await res.json();
        setToast({ msg: err.error || "Ошибка удаления", type: "error" });
      }
    } catch {
      setToast({ msg: "Ошибка сети", type: "error" });
    } finally {
      setDeletingMatchId(null);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (matchForm.homeTeamId === matchForm.awayTeamId) {
      setToast({ msg: "Хозяева и гости не могут быть одной командой!", type: "error" });
      return;
    }

    setCreatingMatch(true);
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(matchForm),
      });
      if (res.ok) {
        setToast({ msg: "Матч успешно создан!", type: "success" });
        setShowMatchModal(false);
        const mRes = await fetch("/api/matches");
        if (mRes.ok) setMatches(await mRes.json());
        setMatchForm({ homeTeamId: "", awayTeamId: "", date: "", venue: "" });
      } else {
        const err = await res.json();
        setToast({ msg: err.error || "Ошибка создания", type: "error" });
      }
    } catch {
      setToast({ msg: "Ошибка сети", type: "error" });
    } finally {
      setCreatingMatch(false);
    }
  };

  const canManageMatches = userRole === "ADMIN" || userRole === "EDITOR";
  const isAdmin = userRole === "ADMIN";

  return (
    <div className="container">
      {toast && <div className="toast-container"><Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} /></div>}
      
      {/* Верхняя панель управления */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 className="home-title" style={{ margin: 0 }}>RTLive</h1>
        {canManageMatches && (
          <button className="btn btn-primary" onClick={() => setShowMatchModal(true)}>
            + Добавить матч
          </button>
        )}
      </div>

      <div className="tabs">
        <button className={`tab glass-btn ${activeTab === "news" ? "active" : ""}`} onClick={() => setActiveTab("news")}>Новости</button>
        <button className={`tab glass-btn ${activeTab === "live" ? "active" : ""}`} onClick={() => setActiveTab("live")}>Текстовая трансляция</button>
        <button className={`tab glass-btn ${activeTab === "calendar" ? "active" : ""}`} onClick={() => setActiveTab("calendar")}>Календарь событий</button>
      </div>

      {activeTab === "news" && (
        <>
          <div className="search-bar glass-effect">
            <input type="text" className="search-input" placeholder="Поиск новостей..." value={liveNewsQuery} onChange={e => setLiveNewsQuery(e.target.value)} />
          </div>
          <NewsSection 
            news={newsData?.data || []} 
            setNews={handleUpdateNews} 
            userRole={userRole} 
            currentUserId={currentUserId ?? undefined} 
          />
          {newsData?.meta && <Pagination currentPage={newsData.meta.page} totalPages={newsData.meta.totalPages} />}
        </>
      )}
      
      {activeTab === "live" && <LiveSection matches={matches} userRole={userRole} onDeleteMatch={isAdmin ? handleDeleteMatch : undefined} deletingId={deletingMatchId} />}
      {activeTab === "calendar" && <CalendarSection matches={matches} onDeleteMatch={isAdmin ? handleDeleteMatch : undefined} deletingId={deletingMatchId} />}

      {/* МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ МАТЧА */}
      {showMatchModal && (
        <div className="modal-overlay" onClick={() => setShowMatchModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <h3 className="section-title">Новый матч</h3>
            <form onSubmit={handleCreateMatch}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label>Хозяева</label>
                  <select value={matchForm.homeTeamId} onChange={e => setMatchForm({...matchForm, homeTeamId: e.target.value})} required>
                    <option value="">Выберите...</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Гости</label>
                  <select 
                    value={matchForm.awayTeamId} 
                    onChange={e => setMatchForm({...matchForm, awayTeamId: e.target.value})} 
                    required
                    // ✅ ОТКЛЮЧАЕМ ОПЦИЮ, ЕСЛИ ОНА ВЫБРАНА В ПОЛЕ ХОЗЯЕВ
                  >
                    <option value="">Выберите...</option>
                    {teams.map(t => (
                      <option 
                        key={t.id} 
                        value={t.id} 
                        disabled={t.id === matchForm.homeTeamId}
                      >
                        {t.name} {t.id === matchForm.homeTeamId ? "(уже выбраны)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group mb-4">
                <label>Дата и время</label>
                <input type="datetime-local" value={matchForm.date} onChange={e => setMatchForm({...matchForm, date: e.target.value})} required />
              </div>
              <div className="form-group mb-4">
                <label>Стадион</label>
                <input type="text" value={matchForm.venue} onChange={e => setMatchForm({...matchForm, venue: e.target.value})} placeholder="Название стадиона" />
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button type="button" className="btn" onClick={() => setShowMatchModal(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary" disabled={creatingMatch}>{creatingMatch ? "Создание..." : "Создать матч"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}