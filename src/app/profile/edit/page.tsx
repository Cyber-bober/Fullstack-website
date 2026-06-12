// src/app/profile/edit/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  
  // Локальная ошибка именно для поля username
  const [usernameError, setUsernameError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    city: "",
    position: "",
    contacts: "",
    stats: "",
    birthDate: "",
  });

  useEffect(() => {
    fetch("/api/profile/me")
      .then((res) => res.json())
      .then((data) => {
        setFormData({
          fullName: data.fullName || "",
          username: data.username || "",
          city: data.city || "",
          position: data.position || "",
          contacts: data.contacts || "",
          stats: data.stats || "",
          birthDate: data.birthDate ? new Date(data.birthDate).toISOString().split("T")[0] : "",
        });
        setLoading(false);
      })
      .catch(() => {
        setToast({ message: "Не удалось загрузить данные профиля", type: "error" });
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setUsernameError(""); // Сбрасываем ошибку поля
    
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setToast({ message: "Профиль успешно обновлен!", type: "success" });
        setTimeout(() => router.push("/profile"), 1500);
      } else {
        const err = await res.json();
        
        // Если ошибка специфична для username, показываем её под полем
        if (err.error && err.error.toLowerCase().includes("username")) {
          setUsernameError(err.error);
        } else {
          // Иначе показываем общий тост
          setToast({ message: err.error || "Ошибка сохранения", type: "error" });
        }
      }
    } catch (err) {
      setToast({ message: "Ошибка сети. Попробуйте позже.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="empty-text">Загрузка...</p>;

  return (
    <div className="container" style={{ maxWidth: "600px" }}>
      {/* Глобальные уведомления */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <Card>
        <h1 className="home-title text-center">Редактирование профиля</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Поле Username с красивой обработкой ошибки */}
          <div className="form-group">
            <label>@username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => {
                setFormData({ ...formData, username: e.target.value });
                setUsernameError(""); // Убираем ошибку при начале ввода
              }}
              required
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_]+"
              style={{ 
                borderColor: usernameError ? "#ef4444" : undefined,
                background: usernameError ? "#fff5f5" : undefined 
              }}
            />
            {usernameError ? (
              <p style={{ color: "#ef4444", fontSize: "13px", marginTop: "4px" }}>
                ⚠️ {usernameError}
              </p>
            ) : (
              <small className="text-gray">Только латинские буквы, цифры и _</small>
            )}
          </div>

          <div className="form-group">
            <label>Полное имя</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Город</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Позиция</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Дата рождения</label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Контакты</label>
            <textarea
              value={formData.contacts}
              onChange={(e) => setFormData({ ...formData, contacts: e.target.value })}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Статистика</label>
            <textarea
              value={formData.stats}
              onChange={(e) => setFormData({ ...formData, stats: e.target.value })}
              rows={3}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={saving}>
            {saving ? "Сохранение..." : "Сохранить изменения"}
          </button>
        </form>
      </Card>
    </div>
  );
}