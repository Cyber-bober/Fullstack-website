"use client";
import { useState, useEffect } from "react";
import { NewsPost } from "@/types/page";

interface NewsFormProps {
  post?: NewsPost | null;
  onSave: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

export default function NewsForm({ post, onSave, onCancel }: NewsFormProps) {
  const [title, setTitle] = useState(post?.title || "");
  const [content, setContent] = useState(post?.content || "");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(post?.imageUrl || null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(post?.imageUrl || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(post?.title || "");
    setContent(post?.content || "");
    setImagePreview(post?.imageUrl || null);
    setOriginalImageUrl(post?.imageUrl || null);
    setImage(null);
    setError("");
  }, [post]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Только изображения");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Фото слишком большое (макс 10MB)");
        return;
      }
      setImage(file);
      setError("");
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (title.length < 10 || title.length > 200) {
      setError("Заголовок должен быть от 10 до 200 символов");
      return;
    }

    if (content.length < 10 || content.length > 5000) {
      setError("Контент должен быть от 10 до 5000 символов");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      
      if (image) {
        formData.append("image", image);
      }
      
      if (post?.id && originalImageUrl && !imagePreview) {
        formData.append("removeImage", "true");
      }

      await onSave(formData);
    } catch (err: any) {
      setError(err.message || "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  };

  const isImageRemoved = originalImageUrl && !imagePreview;
  const isNewImage = image !== null;

  return (
    <div 
      className="modal-overlay"
      onClick={onCancel}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto',
      }}
    >
      <div 
        className="modal-content glass-effect"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          margin: 'auto',
          padding: '24px',
          borderRadius: '16px',
        }}
      >
        <button 
          className="modal-close"
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            fontSize: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          ×
        </button>

        <h3 className="section-title" style={{ paddingRight: '40px' }}>
          {post ? "Редактировать новость" : "Новая новость"}
        </h3>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="form-error" style={{ marginBottom: '16px' }}>
              {error}
            </div>
          )}

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
              className="glass-effect"
            />
            <small style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
              {title.length}/200 символов
            </small>
          </div>

          <div className="form-group">
            <label>Контент</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              minLength={10}
              maxLength={5000}
              rows={8}
              placeholder="Введите текст новости (мин 10 символов)"
              className="glass-effect"
              style={{ resize: 'vertical', minHeight: '150px' }}
            />
            <small style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
              {content.length}/5000 символов
            </small>
          </div>

          <div className="form-group">
            <label>Фото (необязательно)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="file-input glass-effect"
              style={{ padding: '10px' }}
            />
            <small style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
              Макс размер: 10MB. Форматы: JPG, PNG, GIF, WebP
            </small>
            
            {imagePreview && (
              <div style={{ marginTop: '12px', position: 'relative' }}>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '250px', 
                    borderRadius: '8px',
                    objectFit: 'cover',
                    display: 'block'
                  }} 
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  title="Удалить фото"
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>
            )}

            {isImageRemoved && (
              <div style={{
                marginTop: '12px',
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                color: 'var(--color-danger)',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '18px' }}></span>
                Фото будет удалено при сохранении
              </div>
            )}

            {isNewImage && (
              <div style={{
                marginTop: '12px',
                padding: '10px 14px',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '8px',
                color: 'var(--color-primary)',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '18px' }}></span>
                Новое фото будет загружено при сохранении
              </div>
            )}
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'flex-end',
            marginTop: '20px',
            flexWrap: 'wrap'
          }}>
            <button 
              type="button" 
              className="btn btn-secondary glass-effect" 
              onClick={onCancel}
              disabled={loading}
              style={{ flex: '1 1 auto', minWidth: '120px' }}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              className="btn btn-primary glass-effect" 
              disabled={loading}
              style={{ flex: '2 1 auto', minWidth: '140px' }}
            >
              {loading ? "Сохранение..." : (post ? "Сохранить" : "Создать")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}