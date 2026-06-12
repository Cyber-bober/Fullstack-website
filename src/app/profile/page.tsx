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
    <div className="container" style={{ maxWidth: "800px" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Карточка профиля */}
      <Card style={{ textAlign: "center", padding: "32px" }}>
        <div style={{ 
          width: "100px", height: "100px", borderRadius: "50%", 
          background: "#e5e7eb", margin: "0 auto 16px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "40px", color: "#9ca3af", border: "2px dashed #d1d5db"
        }}>
          {user?.photos?.[0] ? (
            <img src={user.photos[0]} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            user?.fullName?.[0]?.toUpperCase() || "?"
          )}
        </div>
        
        <h2 style={{ margin: "0 0 4px", fontSize: "24px" }}>{user?.fullName || "Пользователь"}</h2>
        <p className="text-gray" style={{ marginBottom: "20px", fontSize: "16px" }}>
          @{user?.username || "unknown"}
        </p>
        
        {/* Только кнопка редактирования, настройки теперь в хедере */}
        <Link href="/profile/edit" className="btn btn-primary">
          Редактировать профиль
        </Link>
      </Card>

      {/* Сетка с информацией */}
      <div className="grid grid-cols-2 gap-4" style={{ marginTop: "24px" }}>
        <Card>
          <strong>Дата рождения:</strong> {user?.birthDate ? new Date(user.birthDate).toLocaleDateString() : "—"}
        </Card>
        <Card>
          <strong>Город:</strong> {user?.city || "—"}
        </Card>
        <Card>
          <strong>Позиция:</strong> {user?.position || "—"}
        </Card>
        <Card>
          <strong>Команда:</strong> {user?.team?.name || "—"}
        </Card>
      </div>
    </div>
  );
}