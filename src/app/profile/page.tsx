// src/app/profile/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  useEffect(() => {
    fetch("/api/profile/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setToast({ message: data.error, type: "error" });
        } else {
          setUser(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setToast({ message: "Ошибка загрузки профиля", type: "error" });
        setLoading(false);
      });
  }, []);

  if (loading && !user) return <p className="empty-text">Загрузка...</p>;

  return (
    <div className="profile-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Верхняя карточка: Аватар + Имя + Кнопка */}
      <Card className="profile-header-card">
        <div className="profile-avatar-section">
          <div className="avatar-large">
            {user?.photos?.[0] ? (
              <img src={user.photos[0]} alt="Avatar" />
            ) : (
              user?.fullName?.[0]?.toUpperCase() || "?"
            )}
          </div>
          <div className="profile-info">
            <h1>{user?.fullName || "Пользователь"}</h1>
            <p className="username">@{user?.username || "unknown"}</p>
          </div>
        </div>
        
        <Link href="/profile/edit" className="btn btn-secondary">
          ✏️ Редактировать профиль
        </Link>
      </Card>

      {/* Сетка с деталями профиля */}
      <div className="profile-details-grid">
        <div className="detail-item">
          <span className="label">Дата рождения</span>
          <span className="value">{user?.birthDate ? new Date(user.birthDate).toLocaleDateString() : "—"}</span>
        </div>
        <div className="detail-item">
          <span className="label">Город</span>
          <span className="value">{user?.city || "—"}</span>
        </div>
        <div className="detail-item">
          <span className="label">Позиция</span>
          <span className="value">{user?.position || "—"}</span>
        </div>
        <div className="detail-item">
          <span className="label">Команда</span>
          <span className="value">{user?.team?.name || "—"}</span>
        </div>
        <div className="detail-item">
          <span className="label">Рост</span>
          <span className="value">{user?.height ? `${user.height} см` : "—"}</span>
        </div>
        <div className="detail-item">
          <span className="label">Вес</span>
          <span className="value">{user?.weight ? `${user.weight} кг` : "—"}</span>
        </div>
      </div>
    </div>
  );
}