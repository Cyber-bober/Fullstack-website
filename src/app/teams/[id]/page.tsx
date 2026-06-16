// src/app/teams/[id]/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";
import ImageCropper from "@/components/ui/ImageCropper";
import AddPlayerForm from "@/components/ui/AddPlayerForm";
import PlayerCard from "@/components/ui/PlayerCard";

interface TeamStats {
  description?: string;
  foundedYear?: string;
  stadium?: string;
  city?: string;
}

interface TeamData {
  id: string;
  name: string;
  logoUrl?: string | null;
  captainId?: string | null;
  players: any[];
  stats?: string | null; // JSON-строка из БД
}

export default function TeamPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  
  const [team, setTeam] = useState<TeamData | null>(null);
  const [isCaptain, setIsCaptain] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Вкладки
  const [activeTab, setActiveTab] = useState<"roster" | "stats">("roster");
  
  // Состояния для логотипа
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingLogoPreview, setPendingLogoPreview] = useState<string | null>(null);
  const [shouldDeleteLogo, setShouldDeleteLogo] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Состояние для редактирования статистики
  const [statsForm, setStatsForm] = useState<TeamStats>({
    description: "",
    foundedYear: "",
    stadium: "",
    city: ""
  });

  useEffect(() => {
    loadTeamData();
  }, [params.id]);

  const loadTeamData = async () => {
    try {
      const sessionRes = await fetch("/api/auth/session");
      if (!sessionRes.ok) throw new Error("Not authorized");
      const session = await sessionRes.json();
      
      setCurrentUserId(session?.user?.id);
      setUserRole(session?.user?.role || null);

      const teamRes = await fetch(`/api/teams/${params.id}`);
      if (teamRes.ok) {
        const data = await teamRes.json();
        data.players = data.players.map((p: any) => ({
          ...p,
          isCaptain: p.id === data.captainId,
        }));
        setTeam(data);
        setIsCaptain(data.captainId === session.user.id || session.user.role === "ADMIN");
        
        // ✅ Парсим JSON из поля stats
        let parsedStats: TeamStats = {};
        try {
          if (data.stats) parsedStats = JSON.parse(data.stats);
        } catch {}
        
        setStatsForm({
          description: parsedStats.description || "",
          foundedYear: parsedStats.foundedYear || "",
          stadium: parsedStats.stadium || "",
          city: parsedStats.city || ""
        });
      } else {
        setToast({ message: "Команда не найдена", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "Ошибка загрузки данных", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // --- ЛОГИКА СТАТИСТИКИ ---
  const handleSaveStats = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== "ADMIN") return;
    
    setSaving(true);
    try {
      // ✅ Упаковываем данные в JSON-строку
      const statsJson = JSON.stringify(statsForm);
      
      const res = await fetch(`/api/teams/${params.id}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats: statsJson }),
      });

      if (res.ok) {
        setToast({ message: "Статистика обновлена!", type: "success" });
        // Обновляем локальные данные
        setTeam(prev => prev ? { ...prev, stats: statsJson } : null);
      } else {
        const err = await res.json();
        setToast({ message: err.error || "Ошибка сохранения", type: "error" });
      }
    } catch {
      setToast({ message: "Ошибка сети", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // --- ЛОГИКА ЛОГОТИПА ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: "Файл слишком большой (макс 5MB)", type: "error" });
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedFile: File) => {
    setPendingLogoFile(croppedFile);
    setPendingLogoPreview(URL.createObjectURL(croppedFile));
    setShouldDeleteLogo(false);
    setCropImageSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveLogo = () => {
    setPendingLogoFile(null);
    setPendingLogoPreview(null);
    setShouldDeleteLogo(true);
  };

  const handleSaveLogo = async () => {
    if (!pendingLogoFile && !shouldDeleteLogo) return;
    setSaving(true);
    
    try {
      let finalLogoUrl = team?.logoUrl || null;

      if (pendingLogoFile) {
        const formData = new FormData();
        formData.append("file", pendingLogoFile); 
        formData.append("type", "logo"); 
        
        const res = await fetch(`/api/teams/${params.id}/upload`, { 
          method: "POST", 
          body: formData 
        });
        if (res.ok) {
          const data = await res.json();
          finalLogoUrl = data.url;
        } else {
          const err = await res.json();
          throw new Error(err.error);
        }
      } else if (shouldDeleteLogo) {
        await fetch(`/api/teams/${params.id}/upload`, { 
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: team?.logoUrl, type: "logo" })
        });
        finalLogoUrl = null;
      }

      setToast({ message: "Логотип обновлен!", type: "success" });
      setTeam(prev => prev ? { ...prev, logoUrl: finalLogoUrl } : null);
      setPendingLogoFile(null);
      setPendingLogoPreview(null);
      setShouldDeleteLogo(false);
      
    } catch (err: any) {
      setToast({ message: err.message || "Ошибка", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // --- ЛОГИКА ИГРОКОВ ---
  const handleAddPlayer = async (userId: string) => {
    if (!team) return;
    try {
      const res = await fetch(`/api/teams/${team.id}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        setShowAddPlayer(false);
        await loadTeamData();
        setToast({ message: "Игрок добавлен!", type: "success" });
      } else {
        const error = await res.json();
        setToast({ message: error.error || "Ошибка", type: "error" });
      }
    } catch {
      setToast({ message: "Ошибка сети", type: "error" });
    }
  };

  const handleRemovePlayer = async (userId: string) => {
    if (!team || !confirm("Удалить игрока из команды?")) return;
    try {
      const res = await fetch(`/api/teams/${team.id}/players`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) await loadTeamData();
    } catch {}
  };

  const handleSetCaptain = async (userId: string) => {
    if (!team || !confirm("Назначить капитаном?")) return;
    try {
      const res = await fetch(`/api/teams/${team.id}/captain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) await loadTeamData();
    } catch {}
  };

  // --- РЕНДЕРИНГ ---
  if (loading) return <div className="container"><p className="empty-text">Загрузка...</p></div>;
  if (!team) return <div className="container"><p className="empty-text">Команда не найдена</p></div>;

  const displayLogo = pendingLogoPreview || team.logoUrl;
  const isAdmin = userRole === "ADMIN";

  // Парсим статистику для отображения
  let displayStats: TeamStats = {};
  try { if (team.stats) displayStats = JSON.parse(team.stats); } catch {}

  return (
    <>
      {cropImageSrc && (
        <ImageCropper 
          imageSrc={cropImageSrc} 
          onCropComplete={handleCropComplete} 
          onCancel={() => {
            setCropImageSrc(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }} 
        />
      )}

      <div className="container">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* Шапка команды с Лого */}
        <Card style={{ textAlign: 'center', padding: '32px', marginBottom: '24px' }}>
          <div 
            className="avatar-edit-wrapper" 
            onClick={() => isCaptain && !saving && fileInputRef.current?.click()}
            style={{ 
              display: 'inline-block', position: 'relative', marginBottom: '16px',
              opacity: (isCaptain && !saving) ? 1 : 0.8, cursor: (isCaptain && !saving) ? 'pointer' : 'default'
            }}
          >
            <div className="avatar-large" style={{ width: '120px', height: '120px', margin: '0 auto', background: '#f3f4f6' }}>
              {displayLogo ? <img src={displayLogo} alt="Team Logo" /> : "?"}
            </div>
            {isCaptain && <div className="avatar-edit-overlay">Изменить лого</div>}
            
            {(pendingLogoFile || shouldDeleteLogo) && (
              <div style={{ 
                position: 'absolute', top: '-8px', right: '-8px', 
                background: shouldDeleteLogo ? '#ef4444' : '#f59e0b', 
                color: 'white', borderRadius: '50%', width: '24px', height: '24px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: '14px', border: '2px solid white', zIndex: 10
              }}>
                {shouldDeleteLogo ? "🗑️" : "!"}
              </div>
            )}
          </div>
          
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden-input" />
          
          <h1 className="home-title" style={{ margin: '0 0 8px' }}>{team.name}</h1>
          <p className="text-gray">Игроков: {team.players.length}</p>

          {/* Кнопки управления лого */}
          {isCaptain && (
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {pendingLogoFile && (
                <button onClick={handleSaveLogo} disabled={saving} className="btn btn-primary">
                  {saving ? "Сохранение..." : "Сохранить лого"}
                </button>
              )}
              {displayLogo && !pendingLogoFile && (
                <button onClick={handleRemoveLogo} className="btn btn-secondary" style={{ background: '#fee2e2', color: '#dc2626' }}>
                  Удалить лого
                </button>
              )}
              {shouldDeleteLogo && (
                 <button onClick={handleSaveLogo} disabled={saving} className="btn btn-primary">
                  {saving ? "Удаление..." : "Подтвердить удаление"}
                </button>
              )}
            </div>
          )}
        </Card>

        {/* Вкладки навигации */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
          <button 
            onClick={() => setActiveTab("roster")}
            className={`btn ${activeTab === "roster" ? "btn-primary" : "btn-secondary"}`}
            style={{ background: activeTab === "roster" ? undefined : 'transparent', border: activeTab === "roster" ? 'none' : '1px solid #e5e7eb' }}
          >
            Состав
          </button>
          <button 
            onClick={() => setActiveTab("stats")}
            className={`btn ${activeTab === "stats" ? "btn-primary" : "btn-secondary"}`}
            style={{ background: activeTab === "stats" ? undefined : 'transparent', border: activeTab === "stats" ? 'none' : '1px solid #e5e7eb' }}
          >
            Статистика
          </button>
        </div>

        {/* Содержимое вкладки "Состав" */}
        {activeTab === "roster" && (
          <>
            {(isCaptain || isAdmin) && (
              <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowAddPlayer(!showAddPlayer)} className="btn btn-primary">
                  {showAddPlayer ? "Скрыть поиск" : "+ Добавить игрока"}
                </button>
              </div>
            )}

            {showAddPlayer && (isCaptain || isAdmin) && (
              <Card style={{ marginBottom: '24px' }}>
                <AddPlayerForm onAddPlayer={handleAddPlayer} addingPlayer={false} teamId={team.id} />
              </Card>
            )}

            <h2 className="section-title">Состав команды</h2>
            <div className="team-players">
              {team.players.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  canManage={isCaptain || isAdmin}
                  isAdmin={isAdmin}
                  onSetCaptain={handleSetCaptain}
                  onRemovePlayer={handleRemovePlayer}
                />
              ))}
            </div>
          </>
        )}

        {/* Содержимое вкладки "Статистика" */}
        {activeTab === "stats" && (
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Информация о команде</h2>
              {isAdmin && (
                <span style={{ fontSize: '12px', background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '8px' }}>
                  Режим редактирования (Админ)
                </span>
              )}
            </div>

            {isAdmin ? (
              // ✅ ФОРМА РЕДАКТИРОВАНИЯ ДЛЯ АДМИНА
              <form onSubmit={handleSaveStats} className="edit-form">
                <div className="form-group">
                  <label>Описание команды</label>
                  <textarea 
                    value={statsForm.description} 
                    onChange={(e) => setStatsForm({...statsForm, description: e.target.value})}
                    rows={4}
                    placeholder="Краткая история или описание..."
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Год основания</label>
                    <input 
                      type="number" 
                      value={statsForm.foundedYear} 
                      onChange={(e) => setStatsForm({...statsForm, foundedYear: e.target.value})}
                      placeholder="Например: 2010"
                    />
                  </div>
                  <div className="form-group">
                    <label>Город</label>
                    <input 
                      type="text" 
                      value={statsForm.city} 
                      onChange={(e) => setStatsForm({...statsForm, city: e.target.value})}
                      placeholder="Город базирования"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Стадион / Место проведения игр</label>
                  <input 
                    type="text" 
                    value={statsForm.stadium} 
                    onChange={(e) => setStatsForm({...statsForm, stadium: e.target.value})}
                    placeholder="Название стадиона"
                  />
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={saving}>
                  {saving ? "Сохранение..." : "Сохранить изменения"}
                </button>
              </form>
            ) : (
              // ✅ ПРОСМОТР ДЛЯ ОБЫЧНЫХ ПОЛЬЗОВАТЕЛЕЙ
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {displayStats.description && (
                  <div>
                    <h3 style={{ fontSize: '14px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Описание</h3>
                    <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{displayStats.description}</p>
                  </div>
                )}
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                  {displayStats.foundedYear && (
                    <div>
                      <h3 style={{ fontSize: '14px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Год основания</h3>
                      <p style={{ fontSize: '18px', fontWeight: 600 }}>{displayStats.foundedYear}</p>
                    </div>
                  )}
                  {displayStats.city && (
                    <div>
                      <h3 style={{ fontSize: '14px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Город</h3>
                      <p style={{ fontSize: '18px', fontWeight: 600 }}>{displayStats.city}</p>
                    </div>
                  )}
                  {displayStats.stadium && (
                    <div>
                      <h3 style={{ fontSize: '14px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Стадион</h3>
                      <p style={{ fontSize: '18px', fontWeight: 600 }}>{displayStats.stadium}</p>
                    </div>
                  )}
                </div>

                {!displayStats.description && !displayStats.foundedYear && !displayStats.city && !displayStats.stadium && (
                  <p className="empty-text">Информация о команде пока не заполнена.</p>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </>
  );
}