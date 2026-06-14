// src/components/ui/NewsSection.tsx
"use client";
import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import { NewsPost, Props } from "@/types/NewsSection"; 

interface ExtendedProps extends Props {
  currentUserId?: string | null;
}

export function NewsSection({ news, setNews, userRole, currentUserId }: ExtendedProps) {
  const [localNews, setLocalNews] = useState<NewsPost[]>(news);
  useEffect(() => { setLocalNews(news); }, [news]);

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const canEdit = userRole === "ADMIN" || userRole === "EDITOR";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const openEditModal = (post: NewsPost) => {
    setIsEditing(true);
    setEditId(post.id);
    setTitle(post.title);
    setContent(post.content);
    setPreview(post.imageUrl || null);
    setFile(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      if (file) formData.append("image", file);

      const url = isEditing ? `/api/news/${editId}` : "/api/news";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, { method, body: formData });

      if (res.ok) {
        const updatedPost = await res.json();
        
        // ИСПРАВЛЕНИЕ: Сначала формируем новый массив, потом передаем его в setNews
        let updatedList: NewsPost[];
        if (isEditing) {
          updatedList = localNews.map(p => p.id === editId ? updatedPost : p);
        } else {
          updatedList = [updatedPost, ...localNews];
        }

        setLocalNews(updatedList);
        setNews(updatedList); // Передаем готовый массив, а не функцию
        
        resetForm();
      } else {
        const errData = await res.json();
        setError(errData.error || "Ошибка");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить новость?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/news/${id}`, { method: "DELETE" });
      if (res.ok) {
        const updated = localNews.filter(p => p.id !== id);
        setLocalNews(updated);
        setNews(updated); // Передаем готовый массив
      } else {
        alert("Не удалось удалить");
      }
    } catch {
      alert("Ошибка сети");
    } finally {
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setTitle(""); setContent(""); setFile(null); setPreview(null); 
    setShowForm(false); setIsEditing(false); setEditId(null);
  };

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title glass-effect">Новости</h2>
        {canEdit && (
          <button className="btn btn-primary btn-add-news" onClick={() => { resetForm(); setShowForm(true); }}>
            {showForm ? "Отмена" : "Добавить новость"}
          </button>
        )}
      </div>

      {showForm && (
        <Card className="form-card">
          {error && <div className="form-error">{error}</div>}
          <h3 style={{ marginBottom: "16px" }}>{isEditing ? "Редактирование новости" : "Новая новость"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Заголовок</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} required /></div>
            <div className="form-group"><label>Содержание</label><textarea value={content} onChange={e => setContent(e.target.value)} required rows={4} /></div>
            <div className="form-group">
              <label>Изображение {isEditing && "(оставьте пустым, чтобы не менять)"}</label>
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ padding: "8px 0" }} />
              {preview && <div className="file-preview-container"><img src={preview} alt="Preview" className="file-preview" /></div>}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Сохранение..." : "Сохранить"}</button>
              <button type="button" className="btn" onClick={resetForm}>Отмена</button>
            </div>
          </form>
        </Card>
      )}

      {!Array.isArray(localNews) || localNews.length === 0 ? (
        <p className="empty-text">Новостей пока нет</p>
      ) : (
        localNews.map((post: NewsPost) => {
          const isAuthor = post.author?.id === currentUserId;
          const canDelete = userRole === "ADMIN" || isAuthor;
          const canEditThis = canEdit || isAuthor;

          return (
            <Card key={post.id} className="news-card glass-effect">
              {canEditThis && (
                <div className="news-actions">
                  <button onClick={() => openEditModal(post)} className="btn btn-icon" title="Редактировать">✏️</button>
                  {canDelete && (
                    <button onClick={() => handleDelete(post.id)} disabled={deletingId === post.id} className="btn btn-icon btn-delete" title="Удалить">
                      {deletingId === post.id ? "..." : "🗑️"}
                    </button>
                  )}
                </div>
              )}

              <h3 className="news-title">{post.title}</h3>
              <p className="news-content">{post.content}</p>
              <span className="news-meta">Автор: {post.author?.fullName || "Неизвестный"} — {new Date(post.createdAt).toLocaleDateString()}</span>
            </Card>
          );
        })
      )}
    </div>
  );
}