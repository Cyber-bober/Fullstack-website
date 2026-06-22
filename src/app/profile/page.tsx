"use client";
import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/profile/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error("Ошибка загрузки профиля:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <p className="empty-text">Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <p className="empty-text">Профиль не найден</p>
      </div>
    );
  }

  // Определяем неоновый класс по роли или статусу капитана
  const getNeonClass = () => {
    if (user.role === "ADMIN") return "neon-admin neon-border";
    if (user.role === "EDITOR") return "neon-editor neon-border";
    
    // Проверяем, является ли пользователь капитаном своей команды
    if (user.team && user.team.captainId === user.id) {
      return "neon-captain neon-border";
    }
    
    return "";
  };

  const neonClass = getNeonClass();

  return (
    <div className="profile-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className={`profile-header-card glass-effect ${neonClass}`}>
        <div className="profile-header-content">
          <div className="profile-avatar-section">
            <div className="avatar-large">
              {user.photos && user.photos.length > 0 ? (
                <img src={user.photos[0]} alt={user.fullName} />
              ) : (
                <div className="avatar-placeholder">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="profile-info">
            <h1 className="profile-name">{user.fullName}</h1>
            <p className="profile-username">@{user.username}</p>
            {user.role && (
              <p className="profile-role" style={{ 
                fontSize: "14px", 
                color: user.role === "ADMIN" ? "#ff0040" : user.role === "EDITOR" ? "#0066ff" : "#9ca3af",
                marginBottom: "12px" 
              }}>
                {user.role === "ADMIN" ? " Администратор" : user.role === "EDITOR" ? "🔵 Редактор" : "Пользователь"}
              </p>
            )}
            <Link href="/profile/edit" className="btn btn-primary glass-effect">
              Редактировать профиль
            </Link>
          </div>
        </div>
      </div>

      <div className="profile-details-grid">
        <Card className="detail-item glass-effect">
          <span className="label">Дата рождения</span>
          <span className="value">
            {user.birthDate ? new Date(user.birthDate).toLocaleDateString("ru-RU") : "—"}
          </span>
        </Card>

        <Card className="detail-item glass-effect">
          <span className="label">Город</span>
          <span className="value">{user.city || "—"}</span>
        </Card>

        <Card className="detail-item glass-effect">
          <span className="label">Позиция</span>
          <span className="value">{user.position || "—"}</span>
        </Card>

        <Card className="detail-item glass-effect">
          <span className="label">Команда</span>
          <span className="value">
            {user.team ? (
              <Link href={`/teams/${user.team.id}`} className="text-primary">
                {user.team.name}
              </Link>
            ) : (
              "—"
            )}
          </span>
        </Card>

        <Card className="detail-item glass-effect">
          <span className="label">Рост</span>
          <span className="value">{user.height ? `${user.height} см` : "—"}</span>
        </Card>

        <Card className="detail-item glass-effect">
          <span className="label">Вес</span>
          <span className="value">{user.weight ? `${user.weight} кг` : "—"}</span>
        </Card>
      </div>
    </div>
  );
}