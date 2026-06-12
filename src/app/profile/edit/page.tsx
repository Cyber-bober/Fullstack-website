//src/app/profile/edit/page.tsx

"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { positionLabels } from "@/types/positions";

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    city: "",
    position: "",
    contacts: "",
    stats: "",
    birthDate: "",
  });
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Не удалось загрузить профиль");
        const user = await res.json();
        setFormData({
          fullName: user.fullName || "",
          city: user.city || "",
          position: user.position || "",
          contacts: user.contacts || "",
          stats: user.stats || "",
          birthDate: user.birthDate
            ? new Date(user.birthDate).toISOString().split("T")[0]
            : "",
        });
        setPreviewUrls(user.photos || []);
      } catch (err) {
        console.error(err);
        alert("Ошибка загрузки профиля");
      }
    };
    loadProfile();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).slice(0, 3 - previewUrls.length);
    if (newFiles.length === 0) return;

    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    const newPreviews = [...previewUrls];
    const removed = newPreviews.splice(index, 1);
    setPreviewUrls(newPreviews);

    if (removed[0]) URL.revokeObjectURL(removed[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          photos: previewUrls,
        }),
      });

      if (res.ok) {
        router.push("/profile");
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Ошибка сохранения");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-profile-container">
      <Card>
        <h1 style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "1.5rem", fontWeight: "bold" }}>
          Редактирование профиля
        </h1>
        
        <form onSubmit={handleSubmit} className="edit-profile-form">
          {/* ФИО */}
          <div className="form-group">
            <label>ФИО</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          {/* Дата рождения */}
          <div className="form-group">
            <label>Дата рождения</label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            />
          </div>

          {/* Город */}
          <div className="form-group">
            <label>Город</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          {/* Позиция */}
          <div className="form-group">
            <label>Позиция</label>
            <select
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            >
              <option value="">Выберите позицию</option>
              {Object.entries(positionLabels).map(([key, label]) => (
                <option key={key} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Контакты */}
          <div className="form-group">
            <label>Контакты</label>
            <input
              type="text"
              value={formData.contacts}
              onChange={(e) => setFormData({ ...formData, contacts: e.target.value })}
            />
          </div>

          {/* Статистика */}
          <div className="form-group">
            <label>Статистика</label>
            <input
              type="text"
              value={formData.stats}
              onChange={(e) => setFormData({ ...formData, stats: e.target.value })}
            />
          </div>

          {/* ФОТОГРАФИИ */}
          <div className="photos-upload-section">
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
              Фотографии (до 3)
            </label>
            
            <div className="photos-preview">
              {previewUrls.map((url, index) => (
                <div key={index} className="photo-preview-item">
                  <img src={url} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="photo-remove-btn"
                    title="Удалить фото"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }} // Скрываем стандартный инпут
              multiple
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={previewUrls.length >= 3}
              className="upload-btn"
            >
              {previewUrls.length >= 3 ? "Максимум 3 фото" : "Добавить фото"}
            </button>
          </div>

          {/* Кнопка сохранения */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "1rem", padding: "12px" }}
          >
            {loading ? "Сохранение..." : "Сохранить"}
          </button>
        </form>
      </Card>
    </div>
  );
}