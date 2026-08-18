"use client";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Link from "next/link";
import ImageModal from "@/components/ui/ImageModal";

export default function ProfileClient({ 
  user, 
  isOwnProfile,
  currentUserRole,
}: { 
  user: any; 
  isOwnProfile?: boolean;
  currentUserRole?: string | null;
}) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingStats, setEditingStats] = useState(false);
  const [statsValue, setStatsValue] = useState(user.stats || "");
  const [savingStats, setSavingStats] = useState(false);
  const [statsError, setStatsError] = useState("");

  const photos = user.photos || [];
  const displayPhoto = photos[0] || null;
  const isAdmin = currentUserRole === "ADMIN";

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const pass = formData.get("password") as string;
    
    try {
      const res = await fetch("/api/profile/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass }),
      });
      
      if (res.ok) {
        alert("Пароль установлен! Теперь вы можете входить по логину и паролю.");
        window.location.reload();
      } else {
        const err = await res.json();
        alert(err.error || "Ошибка установки пароля");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети");
    }
  };

  const handleSaveStats = async () => {
    setStatsError("");
    setSavingStats(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stats: statsValue || null,
          targetUserId: user.id,
        }),
      });

      if (res.ok) {
        setEditingStats(false);
        window.location.reload();
      } else {
        const err = await res.json();
        setStatsError(err.error || "Ошибка сохранения");
      }
    } catch {
      setStatsError("Ошибка сети");
    } finally {
      setSavingStats(false);
    }
  };

  return (
    <div className="profile-container">
      <Card className="profile-header-card">
        <div className="profile-header-content">
          <div className="profile-avatar-section">
            <div 
              className="profile-avatar-large"
              onClick={() => displayPhoto && setSelectedImage(displayPhoto)}
              style={{ cursor: displayPhoto ? 'pointer' : 'default' }}
            >
              {displayPhoto ? (
                <img src={displayPhoto} alt="Avatar" />
              ) : (
                <div className="avatar-placeholder">
                  {user.fullName?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>
          </div>

          <div className="profile-info-section">
            <div className="profile-header-info">
              <h1 className="profile-name-compact">{user.fullName}</h1>
              <p className="profile-username-compact">@{user.username}</p>
              
              <div className="profile-quick-info">
                {user.position && (
                  <span className="quick-info-item">
                    <strong>Позиция:</strong> {user.position}
                  </span>
                )}
                {user.city && (
                  <span className="quick-info-item">
                    <strong>Город:</strong> {user.city}
                  </span>
                )}
                {user.team && (
                  <span className="quick-info-item">
                    <strong>Команда:</strong> {user.team.name}
                  </span>
                )}
              </div>
            </div>

            {isOwnProfile && (
              <Link href="/profile/edit" className="btn btn-primary edit-profile-btn">
                Редактировать
              </Link>
            )}
          </div>
        </div>
      </Card>

      <div className="profile-details-grid">
        <Card className="detail-card">
          <div className="detail-label">Дата рождения</div>
          <div className="detail-value">
            {user.birthDate ? new Date(user.birthDate).toLocaleDateString('ru-RU') : "—"}
          </div>
        </Card>

        <Card className="detail-card">
          <div className="detail-label">Город</div>
          <div className="detail-value">{user.city || "—"}</div>
        </Card>

        <Card className="detail-card">
          <div className="detail-label">Позиция</div>
          <div className="detail-value">{user.position || "—"}</div>
        </Card>

        <Card className="detail-card">
          <div className="detail-label">Команда</div>
          <div className="detail-value">{user.team?.name || "—"}</div>
        </Card>

        {user.contacts && (
          <Card className="detail-card full-width">
            <div className="detail-label">Контакты</div>
            <div className="detail-value">{user.contacts}</div>
          </Card>
        )}

        {(user.stats || isAdmin) && (
          <Card className="detail-card full-width">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div className="detail-label">Статистика</div>
              {isAdmin && !editingStats && (
                <button
                  type="button"
                  className="btn btn-secondary glass-effect"
                  onClick={() => {
                    setStatsValue(user.stats || "");
                    setEditingStats(true);
                    setStatsError("");
                  }}
                  style={{ fontSize: "12px", padding: "4px 12px" }}
                >
                  {user.stats ? "Изменить" : "Добавить"}
                </button>
              )}
            </div>

            {editingStats ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <textarea
                  className="glass-effect"
                  value={statsValue}
                  onChange={(e) => setStatsValue(e.target.value)}
                  rows={4}
                  placeholder="Голы: 15, Передачи: 8, Матчи: 42..."
                  style={{ resize: "vertical", minHeight: "80px" }}
                />
                {statsError && (
                  <small className="form-error" style={{ color: "#ef4444" }}>{statsError}</small>
                )}
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn btn-secondary glass-effect"
                    onClick={() => setEditingStats(false)}
                    disabled={savingStats}
                    style={{ fontSize: "13px", padding: "6px 14px" }}
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary glass-effect"
                    onClick={handleSaveStats}
                    disabled={savingStats}
                    style={{ fontSize: "13px", padding: "6px 14px" }}
                  >
                    {savingStats ? "Сохранение..." : "Сохранить"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="detail-value">{user.stats || "Не указана"}</div>
            )}
          </Card>
        )}
      </div>

      {isOwnProfile && !user.passwordHash && (
        <Card>
          <h3 className="section-title">Защита аккаунта</h3>
          <p className="text-gray" style={{ marginBottom: "1rem" }}>
            Установите пароль, чтобы входить не только через Google
          </p>
          <form onSubmit={handleSetPassword}>
            <div className="form-group">
              <label>Придумайте пароль</label>
              <input 
                name="password" 
                type="password" 
                required 
                minLength={6} 
                placeholder="Минимум 6 символов"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Установить пароль
            </button>
          </form>
        </Card>
      )}

      {selectedImage && (
        <ImageModal
          src={selectedImage}
          alt="Фото профиля"
          onClose={() => setSelectedImage(null)}
          hasPrev={photos.indexOf(selectedImage) > 0}
          hasNext={photos.indexOf(selectedImage) < photos.length - 1}
          onPrev={() => {
            const idx = photos.indexOf(selectedImage);
            if (idx > 0) setSelectedImage(photos[idx - 1]);
          }}
          onNext={() => {
            const idx = photos.indexOf(selectedImage);
            if (idx < photos.length - 1) setSelectedImage(photos[idx + 1]);
          }}
        />
      )}
    </div>
  );
}
