"use client";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Link from "next/link";
import ImageModal from "@/components/ui/ImageModal";

export default function ProfileClient({ 
  user, 
  isOwnProfile 
}: { 
  user: any; 
  isOwnProfile?: boolean 
}) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const photos = user.photos || [];
  const displayPhoto = photos[0] || null;

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

  return (
    <div className="profile-container">
      {/* Верхняя карточка с фото и основной информацией */}
      <Card className="profile-header-card">
        <div className="profile-header-content">
          {/* Фото слева */}
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

          {/* Информация справа */}
          <div className="profile-info-section">
            <div className="profile-header-info">
              <h1 className="profile-name-compact">{user.fullName}</h1>
              <p className="profile-username-compact">@{user.username}</p>
              
              {/* Быстрая информация в одну строку */}
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

            {/* Кнопка редактирования */}
            {isOwnProfile && (
              <Link href="/profile/edit" className="btn btn-primary edit-profile-btn">
                Редактировать
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* Детальная информация в сетке */}
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

        {user.stats && (
          <Card className="detail-card full-width">
            <div className="detail-label">Статистика</div>
            <div className="detail-value">{user.stats}</div>
          </Card>
        )}
      </div>

      {/* Блок установки пароля для OAuth-пользователей */}
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