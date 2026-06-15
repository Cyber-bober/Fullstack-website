// src/app/profile/edit/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";
import ImageCropper from "@/components/ui/ImageCropper";

const POSITIONS = ["Вратарь", "Защитник", "Полузащитник", "Нападающий", "Тренер", "Менеджер", "Болельщик"];

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [usernameError, setUsernameError] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Состояния для фото
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: "", username: "", city: "", position: "", contacts: "", stats: "", birthDate: "",
  });

  useEffect(() => {
    fetch("/api/profile/me")
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) setAuthError(true);
          else setToast({ message: "Ошибка загрузки профиля", type: "error" });
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        
        setFormData({
          fullName: data.fullName || "", 
          username: data.username || "", 
          city: data.city || "",
          position: data.position || "", 
          contacts: data.contacts || "", 
          stats: data.stats || "",
          birthDate: data.birthDate ? new Date(data.birthDate).toISOString().split("T")[0] : "",
        });
        setCurrentAvatar(data.photos?.[0] || null);
        setUsernameError("");
        setLoading(false);
      })
      .catch(() => {
        setToast({ message: "Не удалось соединиться с сервером", type: "error" });
        setLoading(false);
      });
  }, []);

  // ✅ ТОЛЬКО ЧТЕНИЕ ФАЙЛА И ПОКАЗ КРОППЕРА. НИКАКОЙ ЗАГРУЗКИ!
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: "Файл слишком большой (макс 5MB)", type: "error" });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        // Сначала устанавливаем источник, потом показываем модалку
        setTempImageSrc(reader.result as string);
        // Небольшая задержка для гарантии рендеринга Base64 перед открытием
        setTimeout(() => setShowCropper(true), 50);
      };
      reader.onerror = () => {
        setToast({ message: "Ошибка чтения файла", type: "error" });
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ ЗАГРУЗКА ПРОИСХОДИТ ТОЛЬКО ЗДЕСЬ, ПОСЛЕ ОБРЕЗКИ
  const handleCropComplete = async (croppedFile: File) => {
    setShowCropper(false); // Сразу скрываем кроппер
    setSaving(true);
    
    try {
      const formData = new FormData();
      formData.append("photo", croppedFile);
      
      const res = await fetch("/api/profile/upload-photo", { 
        method: "POST", 
        body: formData 
      });
      
      if (res.ok) {
        const data = await res.json();
        setCurrentAvatar(data.url);
        setToast({ message: "Аватар обновлен!", type: "success" });
      } else {
        const err = await res.json();
        setToast({ message: err.error || "Ошибка загрузки фото", type: "error" });
      }
    } catch {
      setToast({ message: "Ошибка сети при загрузке фото", type: "error" });
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTempImageSrc(null); // Очищаем память
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConsentError(false);
    setUsernameError("");

    if (!consentChecked) {
      setConsentError(true);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setToast({ message: "Профиль успешно обновлен!", type: "success" });
        setTimeout(() => router.push("/profile"), 800);
      } else {
        if (data.error && String(data.error).toLowerCase().includes("username")) {
          setUsernameError(data.error);
        } else {
          setToast({ message: data.error || "Ошибка сохранения данных", type: "error" });
        }
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "Ошибка сети", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (authError) {
    return (
      <div className="container text-center" style={{ marginTop: '40px' }}>
        <Card>
          <h2>Доступ запрещен</h2>
          <p>Пожалуйста, войдите в систему.</p>
          <button onClick={() => router.push("/auth/signin")} className="btn btn-primary mt-4">Войти</button>
        </Card>
      </div>
    );
  }

  if (loading) return <p className="empty-text" style={{ marginTop: '40px' }}>Загрузка...</p>;

  return (
    <>
      {/* ✅ КРОППЕР ВЫНЕСЕН ВНЕ ОСНОВНОГО КОНТЕЙНЕРА */}
      {showCropper && tempImageSrc && (
        <ImageCropper 
          imageSrc={tempImageSrc} 
          onCropComplete={handleCropComplete} 
          onCancel={() => { setShowCropper(false); setTempImageSrc(null); }} 
        />
      )}

      <div className="container edit-profile-container">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <Card>
          <h1 className="home-title text-center">Редактирование профиля</h1>

          <div className="avatar-edit-section">
            <div className="avatar-edit-wrapper" onClick={() => fileInputRef.current?.click()}>
              <div className="avatar-large">
                {currentAvatar ? <img src={currentAvatar} alt="Avatar" /> : formData.fullName?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="avatar-edit-overlay">📷 Изменить</div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden-input" />
            <p className="avatar-upload-hint">Нажми на фото, чтобы загрузить новое</p>
          </div>

          <form onSubmit={handleSubmit} className="edit-form">
            <div className="form-group">
              <label>@username</label>
              <input 
                type="text" 
                value={formData.username} 
                onChange={(e) => { 
                  setFormData({ ...formData, username: e.target.value }); 
                  setUsernameError(""); 
                }} 
                minLength={3} 
                maxLength={30} 
                pattern="[a-zA-Z0-9_]+" 
                className={usernameError ? "input-error" : ""} 
              />
              {usernameError && <p className="form-error-text">{usernameError}</p>}
              {!usernameError && <small className="text-gray">Только латиница, цифры и _</small>}
            </div>

            <div className="form-group"><label>Полное имя</label><input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} /></div>
            <div className="form-group"><label>Город</label><input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} /></div>

            <div className="form-group">
              <label>Позиция</label>
              <select value={formData.position || ""} onChange={(e) => setFormData({ ...formData, position: e.target.value })}>
                <option value="">Не выбрано</option>
                {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
              </select>
            </div>

            <div className="form-group"><label>Дата рождения</label><input type="date" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} /></div>
            <div className="form-group"><label>Контакты</label><textarea value={formData.contacts} onChange={(e) => setFormData({ ...formData, contacts: e.target.value })} rows={3} /></div>
            <div className="form-group"><label>Статистика</label><textarea value={formData.stats} onChange={(e) => setFormData({ ...formData, stats: e.target.value })} rows={3} /></div>

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
                Я подтверждаю актуальность данных и согласен на обработку <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="pd-consent-link">персональных данных</a>
              </label>
            </div>
            {consentError && <span className="pd-consent-error visible">Необходимо подтвердить согласие</span>}

            <button type="submit" className="btn btn-primary w-full" disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить изменения"}
            </button>
          </form>
        </Card>
      </div>
    </>
  );
}