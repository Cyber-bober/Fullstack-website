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
    setShowForm(false);
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
        
        let updatedList: NewsPost[];
        if (isEditing) {
          updatedList = localNews.map(p => p.id === editId ? updatedPost : p);
        } else {
          updatedList = [updatedPost, ...localNews];
        }

        setLocalNews(updatedList);
        setNews(updatedList);
        
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
        setNews(updated);
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
    setTitle(""); 
    setContent(""); 
    setFile(null); 
    setPreview(null); 
    setShowForm(false); 
    setIsEditing(false); 
    setEditId(null);
  };

  return (
    <div>
      <div className="section-header">
        {canEdit && (
          <button 
            className="btn btn-primary btn-add-news glass-effect" 
            onClick={() => { 
              if (showForm) {
                resetForm();
              } else {
                setIsEditing(false);
                setEditId(null);
                setTitle("");
                setContent("");
                setFile(null);
                setPreview(null);
                setShowForm(true);
              }
            }}
          >
            {showForm ? "Отмена" : "Добавить новость"}
          </button>
        )}
      </div>

      {showForm && !isEditing && (
        <Card className="form-card glass-effect">
          {error && <div className="form-error">{error}</div>}
          <h3 className="form-title">Новая новость</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Заголовок</label>
              <input type="text" className="glass-effect" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Содержание</label>
              <textarea className="glass-effect" value={content} onChange={e => setContent(e.target.value)} required rows={4} />
            </div>
            <div className="form-group">
              <label>Изображение</label>
              <input type="file" accept="image/*" onChange={handleFileChange} className="file-input" />
              {preview && (
                <div className="file-preview-container">
                  <img src={preview} alt="Preview" className="file-preview" />
                </div>
              )}
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary glass-effect" disabled={loading}>
                {loading ? "Сохранение..." : "Сохранить"}
              </button>
              <button type="button" className="btn btn-secondary glass-effect" onClick={resetForm}>
                Отмена
              </button>
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
          const isCurrentlyEditing = isEditing && editId === post.id;

          return (
            <Card key={post.id} className="news-card glass-effect">
              {canEditThis && (
                <div className="news-actions">
                  <button 
                    onClick={() => isCurrentlyEditing ? resetForm() : openEditModal(post)} 
                    className="btn btn-icon btn-edit glass-effect" 
                    title={isCurrentlyEditing ? "Отмена" : "Редактировать"}
                  >
                    <img src="/uploads/svg/edit.svg" className="svg"/>
                  </button>
                  {canDelete && (
                    <button 
                      onClick={() => handleDelete(post.id)} 
                      disabled={deletingId === post.id} 
                      className="btn btn-icon btn-delete glass-effect" 
                      title="Удалить"
                    >
                      <img src="/uploads/svg/delete.svg" className="svg"/>
                      {deletingId === post.id ? "..." : ""}
                    </button>
                  )}
                </div>
              )}

              {isCurrentlyEditing ? (
                <div>
                  {error && <div className="form-error">{error}</div>}
                  <h3 className="form-title">Редактирование новости</h3>
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label>Заголовок</label>
                      <input type="text" className="glass-effect" value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Содержание</label>
                      <textarea className="glass-effect" value={content} onChange={e => setContent(e.target.value)} required rows={4} />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary glass-effect" disabled={loading}>
                        {loading ? "Сохранение..." : "Сохранить"}
                      </button>
                      <button type="button" className="btn btn-secondary glass-effect" onClick={resetForm}>
                        Отмена
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div>
                  <h3 className="news-title">{post.title}</h3>
                  <p className="news-content">{post.content}</p>
                  <span className="news-meta">
                    Автор: {post.author?.fullName || "Неизвестный"} — {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}