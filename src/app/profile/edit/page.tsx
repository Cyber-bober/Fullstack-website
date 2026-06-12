// src/app/profile/edit/page.tsx

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";

const POSITIONS = [
  "Вратарь", "Защитник", "Полузащитник", "Нападающий", 
  "Тренер", "Менеджер", "Болельщик"
];

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [usernameError, setUsernameError] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentError, setConsentError] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "", username: "", city: "", position: "", contacts: "", stats: "", birthDate: "",
  });

  useEffect(() => {
    fetch("/api/profile/me")
      .then((res) => res.json())
      .then((data) => {
        setFormData({
          fullName: data.fullName || "", username: data.username || "", city: data.city || "",
          position: data.position || "", contacts: data.contacts || "", stats: data.stats || "",
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
    setConsentError(false);
    setUsernameError("");

    // Ручная проверка галочки согласия
    if (!consentChecked) {
      setConsentError(true);
      return;
    }

    setSaving(true);
    
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setToast({ message: "Профиль успешно обновлен!", type: "success" });
        
        // МГНОВЕННОЕ ОБНОВЛЕНИЕ: сбрасываем кэш сервера перед переходом
        router.refresh(); 
        
        setTimeout(() => router.push("/profile"), 1000);
      } else {
        const err = await res.json();
        if (err.error && err.error.toLowerCase().includes("username")) {
          setUsernameError(err.error);
        } else {
          setToast({ message: err.error || "Ошибка сохранения", type: "error" });
        }
      }
    } catch {
      setToast({ message: "Ошибка сети", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="empty-text">Загрузка...</p>;

  return (
    <div className="container" style={{ maxWidth: "600px" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Card>
        <h1 className="home-title text-center">Редактирование профиля</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label>@username</label>
            <input 
              type="text" 
              value={formData.username} 
              onChange={(e) => {
                setFormData({ ...formData, username: e.target.value }); 
                setUsernameError("");
              }} 
              // Убрали required, чтобы можно было менять другие поля без изменения ника
              minLength={3} 
              maxLength={30} 
              pattern="[a-zA-Z0-9_]+"
              style={{ borderColor: usernameError ? "#ef4444" : undefined, background: usernameError ? "#fff5f5" : undefined }} 
            />
            {usernameError ? (
              <p className="form-error-text">{usernameError}</p>
            ) : (
              <small className="text-gray">Только латинские буквы, цифры и _ (можно не менять)</small>
            )}
          </div>

          <div className="form-group"><label>Полное имя</label><input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} /></div>
          
          <div className="form-group"><label>Город</label><input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} /></div>
          
          {/* ВЫПАДАЮЩИЙ СПИСОК ПОЗИЦИЙ */}
          <div className="form-group">
            <label>Позиция</label>
            <select 
              value={formData.position || ""} 
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              style={{ width: "100%" }}
            >
              <option value="">Не выбрано</option>
              {POSITIONS.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>

          <div className="form-group"><label>Дата рождения</label><input type="date" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} /></div>
          <div className="form-group"><label>Контакты</label><textarea value={formData.contacts} onChange={(e) => setFormData({ ...formData, contacts: e.target.value })} rows={3} /></div>
          <div className="form-group"><label>Статистика</label><textarea value={formData.stats} onChange={(e) => setFormData({ ...formData, stats: e.target.value })} rows={3} /></div>

          {/* ГАЛОЧКА СОГЛАСИЯ НА ПДн */}
          <div className="pd-consent-wrapper">
            <input 
              type="checkbox" 
              id="pd-consent-edit" 
              checked={consentChecked}
              onChange={(e) => {
                setConsentChecked(e.target.checked);
                if (e.target.checked) setConsentError(false);
              }}
              className="pd-consent-checkbox" 
            />
            <label htmlFor="pd-consent-edit" className="pd-consent-label">
              Я подтверждаю актуальность данных и согласен на обработку{" "}
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="pd-consent-link">
                персональных данных
              </a>{" "}
              в соответствии с Политикой конфиденциальности
            </label>
          </div>
          
          {consentError && (
            <span className="pd-consent-error visible">
              Необходимо подтвердить согласие на обработку данных
            </span>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={saving}>{saving ? "Сохранение..." : "Сохранить изменения"}</button>
        </form>
      </Card>
    </div>
  );
}