"use client";
import { useState } from "react";

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function NewsForm({ onSuccess, onCancel }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Только изображения");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Фото слишком большое (макс 5MB)");
        return;
      }
      setImage(file);
      setError("");
      
      // Превью
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      if (image) {
        formData.append("image", image);
      }

      const res = await fetch("/api/news", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ошибка создания");
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-card glass-effect">
      <h3 className="form-title">Новая новость</h3>
      
      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label>Заголовок</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={10}
          maxLength={200}
          placeholder="Введите заголовок (мин 10 символов)"
        />
      </div>

      <div className="form-group">
        <label>Контент</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          placeholder="Введите текст новости (мин 10 символов)"
        />
      </div>

      <div className="form-group">
        <label>Фото (необязательно)</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="file-input"
        />
        
        {imagePreview && (
          <div className="file-preview-container">
            <img src={imagePreview} alt="Preview" className="file-preview" />
          </div>
        )}
        
        <small className="form-hint">
          Макс размер: 5MB. Форматы: JPG, PNG, GIF
        </small>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? "Создание..." : "Создать новость"}
        </button>
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}