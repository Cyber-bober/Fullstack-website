// src/components/ui/NewsSection.tsx

import { useState } from "react";
import Card from "@/components/ui/Card";
import { NewsPost, Props } from "@/types/LiveSection";


export function NewsSection({ news, setNews, userRole }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", content: "", imageUrl: "" });
  const [loading, setLoading] = useState(false);

  const canEdit = userRole === "ADMIN" || userRole === "EDITOR";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const newPost = await res.json();
        setNews((prev) => [newPost, ...prev]);
        setFormData({ title: "", content: "", imageUrl: "" });
        setShowForm(false);
      } else {
        alert("Ошибка добавления новости");
      }
    } catch {
      alert("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 className="section-title">Новости</h2>
        {userRole && (userRole === "ADMIN" || userRole === "EDITOR") && (
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Отмена" : "Добавить новость"}
        </button>
        )}
      </div>

      {showForm && (
        <Card className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Заголовок</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Содержание</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                rows={4}
              />
            </div>
            <div className="form-group">
              <label>URL изображения (необязательно)</label>
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Публикация..." : "Опубликовать"}
            </button>
          </form>
        </Card>
      )}

      {!Array.isArray(news) || news.length === 0 ? (
        <p className="empty-text">Новостей пока нет</p>
      ) : (
        news.map((post) => (
          <Card key={post.id} className="news-card">
            {post.imageUrl && (
              <img src={post.imageUrl} alt={post.title} className="news-image" />
            )}
            <h3 className="news-title">{post.title}</h3>
            <p className="news-content">{post.content}</p>
            <span className="news-meta">
              Автор: {post.author.fullName} — {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </Card>
        ))
      )}
    </div>
  );
}