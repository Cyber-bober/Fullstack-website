// src/components/ui/NewsSection.tsx

"use client";
import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import { NewsPost, Props } from "@/types/NewsSection"; 

interface ExtendedProps extends Props {
  currentUserId?: string | null;
}

export function NewsSection({ news, setNews, userRole, currentUserId }: ExtendedProps) {
  // Локальный стейт для мгновенного отклика UI
  const [localNews, setLocalNews] = useState<NewsPost[]>(news);

  // Синхронизация с родительским стейтом при загрузке новой страницы/поиске
  useEffect(() => {
    setLocalNews(news);
  }, [news]);

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const canEdit = userRole === "ADMIN" || userRole === "EDITOR";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
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

      const res = await fetch("/api/news", { method: "POST", body: formData });

      if (res.ok) {
        const newPost = await res.json();
        
        // Обновляем локальный стейт для мгновенного отображения
        const updatedNews = [newPost, ...localNews];
        setLocalNews(updatedNews);
        
        // Уведомляем родителя об обновлении
        setNews(updatedNews);
        
        setTitle(""); 
        setContent(""); 
        setFile(null); 
        setPreview(null); 
        setShowForm(false);
      } else {
        const errData = await res.json();
        setError(errData.error || "Ошибка добавления новости");
      }
    } catch (err) {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту новость?")) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/news/${id}`, { method: "DELETE" });
      
      if (res.ok) {
        // Фильтруем локальный стейт
        const updatedNews = localNews.filter((p) => p.id !== id);
        setLocalNews(updatedNews);
        
        // Уведомляем родителя
        setNews(updatedNews);
      } else {
        const err = await res.json();
        alert(err.error || "Не удалось удалить");
      }
    } catch (err) {
      alert("Ошибка сети при удалении");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Новости</h2>
        {canEdit && (
          <button className="btn btn-primary btn-add-news" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Отмена" : "Добавить новость"}
          </button>
        )}
      </div>

      {showForm && (
        <Card className="form-card">
          {error && <div className="form-error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Заголовок</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            
            <div className="form-group">
              <label>Содержание</label>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={4} />
            </div>

            <div className="form-group">
              <label>Изображение (необязательно)</label>
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ padding: "8px 0" }} />
              {preview && (
                <div className="file-preview-container">
                  <img src={preview} alt="Предпросмотр" className="file-preview" />
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Публикация..." : "Опубликовать"}
            </button>
          </form>
        </Card>
      )}

      {!Array.isArray(localNews) || localNews.length === 0 ? (
        <p className="empty-text">Новостей пока нет</p>
      ) : (
        localNews.map((post: NewsPost) => {
          const isAuthor = post.author?.id === currentUserId;
          const canDelete = userRole === "ADMIN" || isAuthor;

          return (
            <Card key={post.id} className="news-card">
              {canDelete && (
                <button
                  onClick={() => handleDelete(post.id)}
                  disabled={deletingId === post.id}
                  className="delete-news-btn"
                  title="Удалить новость"
                >
                  {deletingId === post.id ? "..." : "×"}
                </button>
              )}

              {post.imageUrl && (
                <div className="news-image-wrapper">
                  <img src={post.imageUrl} alt={post.title} />
                </div>
              )}
              
              <h3 className="news-title">{post.title}</h3>
              <p className="news-content">{post.content}</p>
              
              <span className="news-meta">
                Автор: {post.author?.fullName || "Неизвестный"} — {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </Card>
          );
        })
      )}
    </div>
  );
}