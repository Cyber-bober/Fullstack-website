"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NewsSection } from "@/components/ui/NewsSection";
import { LiveSection } from "@/components/ui/LiveSection";
import { CalendarSection } from "@/components/ui/CalendarSection";
import { LiveStreamSection } from "@/components/ui/LiveStreamSection";
import NewsForm from "@/components/ui/NewsForm";
import Toast from "@/components/ui/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DatePicker from "@/components/ui/DatePicker";
import { NewsPost, Match } from "@/types/page";

function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultMatchDateTime() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() < 30 ? 30 : 0);
  if (d.getMinutes() === 0) d.setHours(d.getHours() + 1);
  return {
    date: getLocalDateString(d),
    hours: d.getHours().toString().padStart(2, '0'),
    minutes: d.getMinutes().toString().padStart(2, '0'),
  };
}

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
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsPost | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  
  const [matchForm, setMatchForm] = useState(() => {
    const def = getDefaultMatchDateTime();
    return {
      homeTeamId: "",
      awayTeamId: "",
      date: def.date,
      hours: def.hours,
      minutes: def.minutes,
      venue: ""
    };
  });
  
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);
  const [confirmDeleteMatchId, setConfirmDeleteMatchId] = useState<string | null>(null);

  const loadMatches = useCallback(async () => {
    try {
      const mRes = await fetch("/api/matches", { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (mRes.ok) {
        const d = await mRes.json();
        setMatches(d.data || []);
      }
    } catch (err) {
      console.error("Ошибка загрузки матчей:", err);
    }
  }, []);

  const loadTeams = useCallback(async () => {
    try {
      const tRes = await fetch("/api/teams?limit=100", { cache: 'no-store' });
      if (tRes.ok) {
        const t = await tRes.json();
        setTeams(t.data || []);
      }
    } catch (err) {
      console.error("Ошибка загрузки команд:", err);
    }
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const sessionRes = await fetch("/api/auth/session");
      if (sessionRes.ok) {
        const s = await sessionRes.json();
        setUserRole(s?.user?.role || null);
        setCurrentUserId(s?.user?.id || null);
      }
    } catch (err) {
      console.error("Ошибка загрузки сессии:", err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadSession(), loadMatches(), loadTeams()]);
    };
    loadData();
  }, [loadSession, loadMatches, loadTeams]);

  const openMatchModal = useCallback(() => {
    const def = getDefaultMatchDateTime();
    setMatchForm({
      homeTeamId: "",
      awayTeamId: "",
      date: def.date,
      hours: def.hours,
      minutes: def.minutes,
      venue: ""
    });
    setShowMatchModal(true);
  }, []);

  useEffect(() => {
    const handleOpenMatchModal = () => openMatchModal();
    window.addEventListener('openMatchModal', handleOpenMatchModal);
    return () => window.removeEventListener('openMatchModal', handleOpenMatchModal);
  }, [openMatchModal]);

  useEffect(() => {
    if (activeTab !== "news") return;
    const page = searchParams.get("page") || "1";
    const q = searchParams.get("q") || "";
    setLiveNewsQuery(q);
    fetch(`/api/news?page=${page}&limit=10&q=${encodeURIComponent(q)}`, { cache: 'no-store' })
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

  const handleAddNews = useCallback(() => {
    setEditingNews(null);
    setShowNewsForm(true);
  }, []);

  const handleEditNews = useCallback((post: NewsPost) => {
    setEditingNews(post);
    setShowNewsForm(true);
  }, []);

  const handleSaveNews = async (formData: FormData) => {
    const isEditing = editingNews !== null;
    const url = isEditing ? `/api/news/${editingNews!.id}` : "/api/news";
    const method = isEditing ? "PATCH" : "POST";

    const res = await fetch(url, { method, body: formData });

    if (!res.ok) {
      let errorMessage = "Ошибка сохранения";
      try {
        const err = await res.json();
        errorMessage = err.error || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    setToast({ msg: isEditing ? "Новость обновлена!" : "Новость создана!", type: "success" });
    setShowNewsForm(false);
    setEditingNews(null);

    const mRes = await fetch(`/api/news?page=1&limit=10`, { cache: 'no-store' });
    if (mRes.ok) {
      const data = await mRes.json();
      setNewsData(data);
    }
  };

  const handleDeleteMatch = useCallback((id: string) => {
    setConfirmDeleteMatchId(id);
  }, []);

  const confirmDeleteMatch = async () => {
    if (!confirmDeleteMatchId) return;
    setDeletingMatchId(confirmDeleteMatchId);
    try {
      const res = await fetch(`/api/matches?id=${confirmDeleteMatchId}`, {
        method: "DELETE",
        cache: 'no-store'
      });
      if (res.ok) {
        setToast({ msg: "Матч успешно удален!", type: "success" });
        await loadMatches();
      } else {
        const err = await res.json();
        setToast({ msg: err.error || "Ошибка удаления", type: "error" });
      }
    } catch {
      setToast({ msg: "Ошибка сети", type: "error" });
    } finally {
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

    if (!matchForm.date) {
      setToast({ msg: "Дата матча не указана", type: "error" });
      return;
    }

    const [year, month, day] = matchForm.date.split('-').map(Number);
    const hours = parseInt(matchForm.hours) || 18;
    const minutes = parseInt(matchForm.minutes) || 0;

    const localDate = new Date(year, month - 1, day, hours, minutes, 0);

    if (isNaN(localDate.getTime())) {
      setToast({ msg: "Некорректная дата", type: "error" });
      return;
    }

    const now = new Date();
    if (localDate < now) {
      setToast({
        msg: "Нельзя создать матч в прошлом. Выберите дату и время позже текущего момента.",
        type: "error"
      });
      return;
    }

    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 5);
    if (localDate > maxDate) {
      setToast({ msg: "Дата слишком далекая (максимум 5 лет вперёд)", type: "error" });
      return;
    }

    setCreatingMatch(true);
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: 'no-store',
        body: JSON.stringify({
          homeTeamId: matchForm.homeTeamId,
          awayTeamId: matchForm.awayTeamId,
          date: localDate.toISOString(),
          venue: matchForm.venue || undefined,
        })
      });

      if (res.ok) {
        setToast({ msg: "Матч успешно создан!", type: "success" });
        setShowMatchModal(false);
        await loadMatches();

        const def = getDefaultMatchDateTime();
        setMatchForm({
          homeTeamId: "",
          awayTeamId: "",
          date: def.date,
          hours: def.hours,
          minutes: def.minutes,
          venue: ""
        });
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
        <button className="btn glass-btn" disabled={page === 1} onClick={() => router.push(`?page=${page - 1}&q=${liveNewsQuery}`)}>← Назад</button>
        {pages.map((p, i) =>
          p === "..." ? <span key={`dots-${i}`} style={{ padding: "0 4px" }}>…</span> :
          <button key={p} className={`btn ${p === page ? "btn-primary" : "glass-btn"}`} style={{ minWidth: 36 }} onClick={() => router.push(`?page=${p}&q=${liveNewsQuery}`)}>{p}</button>
        )}
        <button className="btn glass-btn" disabled={page === totalPages} onClick={() => router.push(`?page=${page + 1}&q=${liveNewsQuery}`)}>Вперёд →</button>
      </div>
    );
  };

  return (
    <div className="container">
      {toast && <div className="toast-container"><Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} /></div>}

      <div className="after-header">
        <h1 className="home-title" style={{ margin: 0 }}>RTLive</h1>
        {canManageMatches && (
          <button className="btn btn-primary glass-effect" onClick={openMatchModal}>Добавить матч</button>
        )}
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
          <NewsSection
            news={newsData?.data || []}
            setNews={handleUpdateNews}
            userRole={userRole}
            currentUserId={currentUserId ?? undefined}
            onAdd={handleAddNews}
            onEdit={handleEditNews}
          />
          {renderPagination()}
        </>
      )}

      {activeTab === "live" && (
        <LiveSection
          matches={matches}
          userRole={userRole}
          onDeleteMatch={isAdmin ? handleDeleteMatch : undefined}
          deletingId={deletingMatchId}
        />
      )}

      {activeTab === "stream" && <LiveStreamSection userRole={userRole} />}

      {activeTab === "calendar" && (
        <CalendarSection
          matches={matches}
          onDeleteMatch={isAdmin ? handleDeleteMatch : undefined}
          deletingId={deletingMatchId}
        />
      )}

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
                  <DatePicker
                    label="Дата матча"
                    value={matchForm.date}
                    onChange={(date) => setMatchForm({...matchForm, date})}
                    placeholder="Выберите дату"
                    minDate={getLocalDateString()}
                  />
                </div>

                <div className="form-group">
                  <label>Время (24ч)</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      className="glass-effect"
                      value={matchForm.hours}
                      onChange={e => setMatchForm({...matchForm, hours: e.target.value})}
                      style={{ flex: 1, padding: '12px 8px' }}
                    >
                      {Array.from({length: 24}, (_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <span style={{ color: 'white', fontWeight: 'bold' }}>:</span>
                    <select
                      className="glass-effect"
                      value={matchForm.minutes}
                      onChange={e => setMatchForm({...matchForm, minutes: e.target.value})}
                      style={{ flex: 1, padding: '12px 8px' }}
                    >
                      {[0, 15, 30, 45].map(m => (
                        <option key={m} value={m.toString().padStart(2, '0')}>
                          {m.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group mb-4">
                <label>Стадион</label>
                <input
                  className="glass-effect"
                  type="text"
                  value={matchForm.venue}
                  onChange={e => setMatchForm({...matchForm, venue: e.target.value})}
                  placeholder="Название стадиона"
                />
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  className="btn btn-primary glass-effect"
                  disabled={creatingMatch}
                >
                  {creatingMatch ? "Создание..." : "Создать матч"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary glass-effect"
                  onClick={() => setShowMatchModal(false)}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewsForm && (
        <NewsForm
          post={editingNews}
          onSave={handleSaveNews}
          onCancel={() => { setShowNewsForm(false); setEditingNews(null); }}
        />
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