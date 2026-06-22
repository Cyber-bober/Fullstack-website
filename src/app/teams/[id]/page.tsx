"use client";
import { useState, useEffect, useRef } from "react";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";
import ImageCropper from "@/components/ui/ImageCropper";
import AddPlayerForm from "@/components/ui/AddPlayerForm";
import PlayerCard from "@/components/ui/PlayerCard";
import ConfirmModal from "@/components/ui/ConfirmModal";

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
  stats?: string | null;
  rating?: number;
  globalIndex?: number;
}

export default function TeamPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const [team, setTeam] = useState<TeamData | null>(null);
  const [isCaptain, setIsCaptain] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"roster" | "stats">("roster");

  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingLogoPreview, setPendingLogoPreview] = useState<string | null>(null);
  const [shouldDeleteLogo, setShouldDeleteLogo] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [statsForm, setStatsForm] = useState<TeamStats>({
    description: "",
    foundedYear: "",
    stadium: "",
    city: "",
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [confirmRemovePlayerId, setConfirmRemovePlayerId] = useState<string | null>(null);
  const [confirmCaptainId, setConfirmCaptainId] = useState<string | null>(null);

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

        let parsedStats: TeamStats = {};
        try {
          if (data.stats) parsedStats = JSON.parse(data.stats);
        } catch {}

        setStatsForm({
          description: parsedStats.description || "",
          foundedYear: parsedStats.foundedYear || "",
          stadium: parsedStats.stadium || "",
          city: parsedStats.city || "",
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

  const handleSaveStats = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== "ADMIN") return;

    setSaving(true);
    try {
      const statsJson = JSON.stringify(statsForm);

      const res = await fetch(`/api/teams/${params.id}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats: statsJson }),
      });

      if (res.ok) {
        setToast({ message: "Статистика обновлена!", type: "success" });
        setTeam((prev) => (prev ? { ...prev, stats: statsJson } : null));
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

  const handleSaveName = async () => {
    if (!editName.trim() || editName === team?.name) {
      setIsEditingName(false);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/teams/${params.id}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });

      if (res.ok) {
        setToast({ message: "Название обновлено!", type: "success" });
        setTeam((prev) => (prev ? { ...prev, name: editName.trim() } : null));
        setIsEditingName(false);
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
          body: formData,
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
          body: JSON.stringify({ url: team?.logoUrl, type: "logo" }),
        });
        finalLogoUrl = null;
      }

      setToast({ message: "Логотип обновлен!", type: "success" });
      setTeam((prev) => (prev ? { ...prev, logoUrl: finalLogoUrl } : null));
      setPendingLogoFile(null);
      setPendingLogoPreview(null);
      setShouldDeleteLogo(false);
    } catch (err: any) {
      setToast({ message: err.message || "Ошибка", type: "error" });
    } finally {
      setSaving(false);
    }
  };

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

  const handleRemovePlayer = (userId: string) => {
    if (!team) return;
    setConfirmRemovePlayerId(userId);
  };

  const confirmRemovePlayer = async () => {
    if (!team || !confirmRemovePlayerId) return;
    try {
      const res = await fetch(`/api/teams/${team.id}/players`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: confirmRemovePlayerId }),
      });
      if (res.ok) await loadTeamData();
    } catch {}
    setConfirmRemovePlayerId(null);
  };

  const handleSetCaptain = (userId: string) => {
    if (!team) return;
    setConfirmCaptainId(userId);
  };

  const confirmSetCaptain = async () => {
    if (!team || !confirmCaptainId) return;
    try {
      const res = await fetch(`/api/teams/${team.id}/captain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: confirmCaptainId }),
      });
      if (res.ok) await loadTeamData();
    } catch {}
    setConfirmCaptainId(null);
  };

  if (loading) return <div className="container"><p className="empty-text">Загрузка...</p></div>;
  if (!team) return <div className="container"><p className="empty-text">Команда не найдена</p></div>;

  const displayLogo = pendingLogoPreview || team.logoUrl;
  const isAdmin = userRole === "ADMIN";
  const canEdit = isCaptain || isAdmin;

// Определяем неоновый класс по позиции команды
const getTeamNeonClass = () => {
  const pos = team.globalIndex;
  
  // Проверяем по позиции
  if (pos === 1) return "neon-1st neon-border";
  if (pos === 2) return "neon-2nd neon-border";
  if (pos === 3) return "neon-3rd neon-border";
  
  return "";
};

const headerClass = `team-header-card glass-effect ${getTeamNeonClass()}`;

  let displayStats: TeamStats = {};
  try {
    if (team.stats) displayStats = JSON.parse(team.stats);
  } catch {}

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

      <div className="container team-profile-page">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <div className={headerClass}>
          <div className="team-header-content">
            <div className="team-avatar-section">
              <div
                className={`avatar-large ${isCaptain ? "editable" : ""}`}
                onClick={() => isCaptain && fileInputRef.current?.click()}
              >
                {displayLogo ? (
                  <img src={displayLogo} alt="Team Logo" />
                ) : (
                  <div className="avatar-placeholder">?</div>
                )}

                {isCaptain && <div className="avatar-edit-overlay">Изменить лого</div>}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden-input"
              />

              {(pendingLogoFile || shouldDeleteLogo) && (
                <div className="avatar-badge">{shouldDeleteLogo ? "✕" : "!"}</div>
              )}
            </div>

            <div className="team-info">
              {isEditingName ? (
                <div
                  className="edit-name-container"
                  style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}
                >
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") {
                        setIsEditingName(false);
                        setEditName(team?.name || "");
                      }
                    }}
                    className="edit-name-input glass-effect"
                    style={{
                      padding: "8px 12px",
                      fontSize: "28px",
                      fontWeight: 700,
                      color: "white",
                      background: "rgba(255, 255, 255, 0.15)",
                      border: "2px solid #0160ce",
                      borderRadius: "8px",
                      outline: "none",
                      minWidth: "200px",
                      maxWidth: "400px",
                    }}
                    autoFocus
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={handleSaveName}
                      disabled={saving || !editName.trim()}
                      className="btn btn-primary"
                      style={{ padding: "8px 16px", fontSize: "14px" }}
                    >
                      {saving ? "..." : "✓"}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setEditName(team?.name || "");
                      }}
                      className="btn"
                      style={{
                        padding: "8px 16px",
                        fontSize: "14px",
                        background: "rgba(255, 255, 255, 0.1)",
                        color: "white",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <h1 className="team-name">{team.name}</h1>
                  {canEdit && (
                    <button
                      onClick={() => {
                        setEditName(team.name);
                        setIsEditingName(true);
                        setTimeout(() => nameInputRef.current?.focus(), 100);
                      }}
                      className="edit-name-btn"
                      title="Редактировать название"
                      style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: "rgba(255, 255, 255, 0.8)" }}
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
              <p className="team-players-count">Игроков: {team.players.length}</p>
            </div>
          </div>

          {isCaptain && (
            <div className="team-logo-controls">
              {pendingLogoFile && (
                <button onClick={handleSaveLogo} disabled={saving} className="btn btn-primary">
                  {saving ? "..." : "Сохранить лого"}
                </button>
              )}
              {displayLogo && !pendingLogoFile && (
                <button onClick={handleRemoveLogo} className="btn btn-danger">
                  Удалить лого
                </button>
              )}
              {shouldDeleteLogo && (
                <button onClick={handleSaveLogo} disabled={saving} className="btn btn-primary">
                  {saving ? "..." : "Подтвердить"}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="team-tabs glass-effect">
          <button
            onClick={() => setActiveTab("roster")}
            className={`tab-btn ${activeTab === "roster" ? "active" : ""}`}
          >
            Состав
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`tab-btn ${activeTab === "stats" ? "active" : ""}`}
          >
            Статистика
          </button>
        </div>

        {activeTab === "roster" && (
          <>
            {(isCaptain || isAdmin) && (
              <div className="team-actions">
                <button
                  onClick={() => setShowAddPlayer(!showAddPlayer)}
                  className="btn btn-primary glass-effect"
                >
                  {showAddPlayer ? "Скрыть поиск" : "Добавить игрока"}
                </button>
              </div>
            )}

            {showAddPlayer && (isCaptain || isAdmin) && (
              <Card className="glass-effect">
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
              {team.players.length === 0 && (
                <p className="empty-text">В команде пока нет игроков</p>
              )}
            </div>
          </>
        )}

        {activeTab === "stats" && (
          <Card className="glass-effect">
            <div className="stats-header">
              <h2 className="section-title" style={{ margin: 0 }}>
                Информация о команде
              </h2>
              {isAdmin && <span className="admin-badge">Режим редактирования</span>}
            </div>

            {isAdmin ? (
              <form onSubmit={handleSaveStats} className="stats-form">
                <div className="form-group">
                  <label>Описание команды</label>
                  <textarea
                    className="glass-effect"
                    value={statsForm.description}
                    onChange={(e) => setStatsForm({ ...statsForm, description: e.target.value })}
                    rows={4}
                    placeholder="Краткая история или описание..."
                  />
                </div>

                <div className="stats-grid">
                  <div className="form-group">
                    <label>Год основания</label>
                    <input
                      className="glass-effect"
                      type="number"
                      value={statsForm.foundedYear}
                      onChange={(e) => setStatsForm({ ...statsForm, foundedYear: e.target.value })}
                      placeholder="2010"
                    />
                  </div>
                  <div className="form-group">
                    <label>Город</label>
                    <input
                      className="glass-effect"
                      type="text"
                      value={statsForm.city}
                      onChange={(e) => setStatsForm({ ...statsForm, city: e.target.value })}
                      placeholder="Город"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Стадион</label>
                  <input
                    className="glass-effect"
                    type="text"
                    value={statsForm.stadium}
                    onChange={(e) => setStatsForm({ ...statsForm, stadium: e.target.value })}
                    placeholder="Название стадиона"
                  />
                </div>

                <button type="submit" className="btn btn-primary glass-effect w-full" disabled={saving}>
                  {saving ? "..." : "Сохранить"}
                </button>
              </form>
            ) : (
              <div className="stats-display">
                {displayStats.description && (
                  <div className="stat-section">
                    <h3 className="stat-label">Описание</h3>
                    <p className="stat-value">{displayStats.description}</p>
                  </div>
                )}

                <div className="stats-grid-display">
                  {displayStats.foundedYear && (
                    <div className="stat-item">
                      <h3 className="stat-label">Год основания</h3>
                      <p className="stat-value">{displayStats.foundedYear}</p>
                    </div>
                  )}
                  {displayStats.city && (
                    <div className="stat-item">
                      <h3 className="stat-label">Город</h3>
                      <p className="stat-value">{displayStats.city}</p>
                    </div>
                  )}
                  {displayStats.stadium && (
                    <div className="stat-item">
                      <h3 className="stat-label">Стадион</h3>
                      <p className="stat-value">{displayStats.stadium}</p>
                    </div>
                  )}
                </div>

                {!displayStats.description &&
                  !displayStats.foundedYear &&
                  !displayStats.city &&
                  !displayStats.stadium && <p className="empty-text">Информация пока не заполнена</p>}
              </div>
            )}
          </Card>
        )}
      </div>

      <ConfirmModal
        isOpen={!!confirmRemovePlayerId}
        title="Удалить игрока?"
        message="Вы уверены, что хотите удалить игрока из команды?"
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        onConfirm={confirmRemovePlayer}
        onCancel={() => setConfirmRemovePlayerId(null)}
      />

      <ConfirmModal
        isOpen={!!confirmCaptainId}
        title="Назначить капитаном?"
        message="Вы уверены, что хотите назначить этого игрока капитаном команды?"
        confirmText="Назначить"
        cancelText="Отмена"
        variant="warning"
        onConfirm={confirmSetCaptain}
        onCancel={() => setConfirmCaptainId(null)}
      />
    </>
  );
}