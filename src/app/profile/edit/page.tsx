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

  // Текущее фото из БД
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  
  // Фото, которое пользователь выбрал и обрезал (еще не сохранено в БД)
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState<string | null>(null);
  
  // Флаг для удаления фото (если true, то при сохранении фото удалится из БД)
  const [shouldDeleteAvatar, setShouldDeleteAvatar] = useState(false);
  
  // Состояние для окна кроппера
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  
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

  // Выбор файла -> открытие кроппера
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

  // Обрезка завершена -> сохраняем файл локально
  const handleCropComplete = async (croppedFile: File) => {
    setPendingAvatarFile(croppedFile);
    const previewUrl = URL.createObjectURL(croppedFile);
    setPendingAvatarPreview(previewUrl);
    setShouldDeleteAvatar(false); // Если выбрали новое фото, отменяем флаг удаления
    
    setCropImageSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ✅ НОВАЯ ФУНКЦИЯ: Удаление фото
  const handleRemovePhoto = () => {
    setCurrentAvatar(null);
    setPendingAvatarFile(null);
    setPendingAvatarPreview(null);
    setShouldDeleteAvatar(true); // Помечаем, что нужно удалить фото из БД
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Финальное сохранение ВСЕХ данных
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
      let finalAvatarUrl: string | null = currentAvatar;

      // 1. Если есть новое фото - загружаем его
      if (pendingAvatarFile) {
        const photoFormData = new FormData();
        photoFormData.append("photo", pendingAvatarFile);
        
        const uploadRes = await fetch("/api/profile/upload-photo", { 
          method: "POST", 
          body: photoFormData 
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalAvatarUrl = uploadData.url;
        } else {
          const err = await uploadRes.json();
          throw new Error(err.error || "Ошибка загрузки фото");
        }
      } 
      // 2. Если стоит флаг удаления - удаляем фото через API
      else if (shouldDeleteAvatar) {
        const deleteRes = await fetch("/api/profile/remove-photo", { 
          method: "POST" 
        });
        
        if (!deleteRes.ok) {
          const err = await deleteRes.json();
          console.error("Ошибка удаления фото:", err);
          // Не прерываем выполнение, если удаление фото не критично
        }
        finalAvatarUrl = null;
      }

      // Обновляем текстовые данные профиля
      const updateRes = await fetch("/api/profile/update", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const updateData = await updateRes.json();

      if (updateRes.ok) {
        // Синхронизируем локальное состояние
        setCurrentAvatar(finalAvatarUrl);
        setPendingAvatarFile(null);
        setPendingAvatarPreview(null);
        setShouldDeleteAvatar(false);
        
        setToast({ message: "Профиль успешно обновлен!", type: "success" });
        setTimeout(() => router.push("/profile"), 800);
      } else {
        if (updateData.error && String(updateData.error).toLowerCase().includes("username")) {
          setUsernameError(updateData.error);
        } else {
          setToast({ message: updateData.error || "Ошибка сохранения данных", type: "error" });
        }
      }
    } catch (err: any) {
      console.error(err);
      setToast({ message: err.message || "Ошибка сети", type: "error" });
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

  // Определяем, какое фото показывать
  const displayAvatar = pendingAvatarPreview || currentAvatar;

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

      <div className="container edit-profile-container">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <Card>
          <h1 className="home-title text-center">Редактирование профиля</h1>

          <div className="avatar-edit-section">
            <div 
              className="avatar-edit-wrapper" 
              onClick={() => !saving && fileInputRef.current?.click()}
              style={{ opacity: saving ? 0.5 : 1, pointerEvents: saving ? 'none' : 'auto' }}
            >
              <div className="avatar-large">
                {displayAvatar ? <img src={displayAvatar} alt="Avatar" /> : formData.fullName?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="avatar-edit-overlay"> Изменить</div>
              
              {/* Индикатор изменений */}
              {(pendingAvatarFile || shouldDeleteAvatar) && (
                <div style={{ 
                  position: 'absolute', top: '-8px', right: '-8px', 
                  background: shouldDeleteAvatar ? '#ef4444' : '#f59e0b', 
                  color: 'white', borderRadius: '50%', 
                  width: '24px', height: '24px', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', fontSize: '14px', border: '2px solid white', zIndex: 10
                }}>
                  {shouldDeleteAvatar ? "🗑️" : "!"}
                </div>
              )}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept="image/*" 
              className="hidden-input" 
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <p className="avatar-upload-hint">
                {pendingAvatarFile ? "Новое фото выбрано." : shouldDeleteAvatar ? "Фото будет удалено." : "Нажми на фото, чтобы загрузить"}
              </p>
              
              {/* ✅ КНОПКА УДАЛЕНИЯ */}
              {displayAvatar && !pendingAvatarFile && (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemovePhoto(); }}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '4px 12px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}
                >
                  🗑️ Удалить фото
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="edit-form">
            {/* ... остальная форма без изменений ... */}
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