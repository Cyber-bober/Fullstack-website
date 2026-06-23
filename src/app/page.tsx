"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NewsSection } from "@/components/ui/NewsSection";
import { LiveSection } from "@/components/ui/LiveSection";
import { CalendarSection } from "@/components/ui/CalendarSection";
import { LiveStreamSection } from "@/components/ui/LiveStreamSection";
import Toast from "@/components/ui/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { NewsPost, Match } from "@/types/page";

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams() ?? new URLSearchParams();
  
  const [activeTab, setActiveTab] = useState<"news" | "live" | "stream" | "calendar">("news");
  const [matches, setMatches] = useState<Match[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [newsData, setNewsData] = useState<{ data: NewsPost[]; meta: any } | null>(null);
  const [liveNewsQuery, setLiveNewsQuery] = useState(searchParams.get("q") || "");
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null);

  const [showMatchModal, setShowMatchModal] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [matchForm, setMatchForm] = useState({ homeTeamId: "", awayTeamId: "", date: "", venue: "" });
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);
  const [confirmDeleteMatchId, setConfirmDeleteMatchId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sessionRes, matchesRes, teamsRes] = await Promise.all([
          fetch("/api/auth/session"),
          fetch("/api/matches"),
          fetch("/api/teams?limit=100")
        ]);
        if (sessionRes.ok) { const s = await sessionRes.json(); setUserRole(s?.user?.role || null); setCurrentUserId(s?.user?.id || null); }
        if (matchesRes.ok) { const d = await matchesRes.json(); setMatches(Array.isArray(d) ? d : []); }
        if (teamsRes.ok) { const t = await teamsRes.json(); setTeams(t.data || []); }
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

  const handleDeleteMatch = (id: string) => {
    setConfirmDeleteMatchId(id);
  };

  const confirmDeleteMatch = async () => {
    if (!confirmDeleteMatchId) return;
    setDeletingMatchId(confirmDeleteMatchId);
    try {
      const res = await fetch(`/api/matches?id=${confirmDeleteMatchId}`, { method: "DELETE" });
      if (res.ok) {
        setToast({ msg: "Матч успешно удален!", type: "success" });
        const mRes = await fetch("/api/matches");
        if (mRes.ok) setMatches(await mRes.json());
      } else {
        const err = await res.json();
        setToast({ msg: err.error || "Ошибка удаления", type: "error" });
      }
    } catch { setToast({ msg: "Ошибка сети", type: "error" }); }
    finally { 
      setDeletingMatchId(null); 
      setConfirmDeleteMatchId(null);
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
      const dateStr = matchForm.date;
      if (!dateStr) {
        setToast({ msg: "Выберите дату матча", type: "error" });
        setCreatingMatch(false);
        return;
      }
      
      let localDate: Date;
      
      if (dateStr.includes('T')) {
        const [datePart, timePart] = dateStr.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = (timePart || '10:00').split(':').map(Number);
        localDate = new Date(year, month - 1, day, hours || 10, minutes || 0);
      } else {
        const [year, month, day] = dateStr.split('-').map(Number);
        localDate = new Date(year, month - 1, day, 10, 0);
      }
      
      const res = await fetch("/api/matches", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({
          homeTeamId: matchForm.homeTeamId,
          awayTeamId: matchForm.awayTeamId,
          date: localDate.toISOString(),
          venue: matchForm.venue,
        })
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
    } catch (err) {
      console.error("Ошибка создания матча:", err);
      setToast({ msg: "Ошибка сети", type: "error" }); 
    } finally { 
      setCreatingMatch(false); 
    }
  };

  const canManageMatches = userRole === "ADMIN" || userRole === "EDITOR";
  const isAdmin = userRole === "ADMIN";

  const renderPagination = () => {
    if (!newsData?.meta) return null;
    const { page, totalPages } = newsData.meta;
    if (totalPages <= 1) return null;

    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }

    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 24, flexWrap: "wrap" }}>
        <button className="btn glass-btn" disabled={page === 1} onClick={() => router.push(`?page=${page - 1}&q=${liveNewsQuery}`)}>
          ← Назад
        </button>
        {pages.map((p, i) =>
          p === "..." ? <span key={`dots-${i}`} style={{ padding: "0 4px" }}>…</span> :
          <button key={p} className={`btn ${p === page ? "btn-primary" : "glass-btn"}`} style={{ minWidth: 36 }} onClick={() => router.push(`?page=${p}&q=${liveNewsQuery}`)}>{p}</button>
        )}
        <button className="btn glass-btn" disabled={page === totalPages} onClick={() => router.push(`?page=${page + 1}&q=${liveNewsQuery}`)}>
          Вперёд →
        </button>
      </div>
    );
  };

  const getHours = () => {
    if (!matchForm.date) return '10';
    const timePart = matchForm.date.split('T')[1] || '10:00';
    return timePart.split(':')[0];
  };

  const getMinutes = () => {
    if (!matchForm.date) return '00';
    const timePart = matchForm.date.split('T')[1] || '10:00';
    return timePart.split(':')[1] || '00';
  };

  const getDatePart = () => {
    return matchForm.date ? matchForm.date.split('T')[0] : new Date().toISOString().split('T')[0];
  };

  return (
    <div className="container">
      {toast && <div className="toast-container"><Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} /></div>}
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 className="home-title" style={{ margin: 0 }}>RTLive</h1>
        {canManageMatches && <button className="btn btn-primary glass-effect" onClick={() => setShowMatchModal(true)}>Добавить матч</button>}
      </div>

      <div className="tabs">
        <button className={`tab glass-btn ${activeTab === "news" ? "active" : ""}`} onClick={() => setActiveTab("news")}>Новости</button>
        <button className={`tab glass-btn ${activeTab === "live" ? "active" : ""}`} onClick={() => setActiveTab("live")}>Текстовая трансляция</button>
        <button className={`tab glass-btn ${activeTab === "stream" ? "active" : ""}`} onClick={() => setActiveTab("stream")}>Прямая трансляция</button>
        <button className={`tab glass-btn ${activeTab === "calendar" ? "active" : ""}`} onClick={() => setActiveTab("calendar")}>Календарь событий</button>
      </div>

      {activeTab === "news" && (
        <>
          <div className="search-bar glass-effect">
            <input type="text" className="search-input" placeholder="Поиск новостей..." value={liveNewsQuery} onChange={e => setLiveNewsQuery(e.target.value)} />
          </div>
          <NewsSection news={newsData?.data || []} setNews={handleUpdateNews} userRole={userRole} currentUserId={currentUserId ?? undefined} />
          {renderPagination()}
        </>
      )}
      
      {activeTab === "live" && <LiveSection matches={matches} userRole={userRole} onDeleteMatch={isAdmin ? handleDeleteMatch : undefined} deletingId={deletingMatchId} />}
      
      {activeTab === "stream" && <LiveStreamSection userRole={userRole} />}
      
      {activeTab === "calendar" && <CalendarSection matches={matches} onDeleteMatch={isAdmin ? handleDeleteMatch : undefined} deletingId={deletingMatchId} />}

      {showMatchModal && (
        <div className="modal-overlay" onClick={() => setShowMatchModal(false)}>
          <div className="modal-content glass-effect" onClick={e => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <h3 className="section-title">Новый матч</h3>
            <form onSubmit={handleCreateMatch}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label>Хозяева</label>
                  <select className="glass-effect" value={matchForm.homeTeamId} onChange={e => setMatchForm({...matchForm, homeTeamId: e.target.value})} required>
                    <option value="">Выберите...</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Гости</label>
                  <select className="glass-effect" value={matchForm.awayTeamId} onChange={e => setMatchForm({...matchForm, awayTeamId: e.target.value})} required>
                    <option value="">Выберите...</option>
                    {teams.map(t => <option key={t.id} value={t.id} disabled={t.id === matchForm.homeTeamId}>{t.name}{t.id === matchForm.homeTeamId ? " (уже выбраны)" : ""}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label>Дата</label>
                  <input 
                    className="glass-effect" 
                    type="date" 
                    value={getDatePart()} 
                    onChange={e => {
                      const hours = getHours();
                      const minutes = getMinutes();
                      setMatchForm({...matchForm, date: `${e.target.value}T${hours}:${minutes}`});
                    }} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Время (24ч)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select 
                      className="glass-effect" 
                      value={getHours()}
                      onChange={e => {
                        const date = getDatePart();
                        const minutes = getMinutes();
                        setMatchForm({...matchForm, date: `${date}T${e.target.value}:${minutes}`});
                      }}
                      style={{ flex: 1 }}
                    >
                      {Array.from({length: 24}, (_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <span style={{ alignSelf: 'center', color: 'black', fontWeight: 'bold' }}>:</span>
                    <select 
                      className="glass-effect" 
                      value={getMinutes()}
                      onChange={e => {
                        const date = getDatePart();
                        const hours = getHours();
                        setMatchForm({...matchForm, date: `${date}T${hours}:${e.target.value}`});
                      }}
                      style={{ flex: 1 }}
                    >
                      {Array.from({length: 60}, (_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="form-group mb-4">
                <label>Стадион</label>
                <input className="glass-effect" type="text" value={matchForm.venue} onChange={e => setMatchForm({...matchForm, venue: e.target.value})} placeholder="Название стадиона" />
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button type="submit" className="btn btn-primary glass-effect" disabled={creatingMatch}>{creatingMatch ? "Создание..." : "Создать матч"}</button>
                <button type="button" className="btn btn-secondary glass-effect" onClick={() => setShowMatchModal(false)}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDeleteMatchId}
        title="Удалить матч?"
        message="Вы уверены, что хотите удалить этот матч? Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        onConfirm={confirmDeleteMatch}
        onCancel={() => setConfirmDeleteMatchId(null)}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="container"><p className="empty-text">Загрузка...</p></div>}>
      <HomePageContent />
    </Suspense>
  );
}