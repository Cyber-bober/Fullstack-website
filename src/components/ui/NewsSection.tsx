"use client";
import { NewsPost } from "@/types/page";

interface Props {
  news: NewsPost[];
  userRole: string | null;
  currentUserId?: string;
  setNews?: (news: NewsPost[]) => void;
  onEdit?: (post: NewsPost) => void;
  onAdd?: () => void;
}

export function NewsSection({ news, userRole, currentUserId, setNews, onEdit, onAdd }: Props) {
  const canManage = userRole === "ADMIN" || userRole === "EDITOR";

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить новость?")) return;

    try {
      const res = await fetch(`/api/news?id=${id}`, { method: "DELETE" });
      if (res.ok && setNews) {
        setNews(news.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="news-list">
      <div className="section-header">
        <h3 className="section-title" style={{ margin: 0 }}>Новости</h3>
        {canManage && onAdd && (
          <button 
            className="btn btn-primary glass-effect btn-add-news"
            onClick={onAdd}
          >
            + Добавить новость
          </button>
        )}
      </div>

      {news.map((post, index) => {
        const canEdit = canManage || post.authorId === currentUserId;

        return (
          <article key={post.id} className="news-card glass-effect">
            {post.imageUrl && (
              <div className="news-image-container">
                <div className="news-image-wrapper">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="news-image"
                    loading={index < 3 ? "eager" : "lazy"}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      const container = img.closest('.news-image-container') as HTMLElement | null;
                      if (container) {
                        container.style.display = 'none';
                      }
                    }}
                  />
                </div>
              </div>
            )}

            <div className="news-content-wrapper">
              <h3 className="news-title">{post.title}</h3>
              <p className="news-content">{post.content}</p>
              
              <div className="news-meta">
                <span>Автор: {post.author?.fullName || post.author?.username || "Неизвестно"}</span>
                {" • "}
                <span>
                  {new Date(post.createdAt).toLocaleDateString("ru-RU", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {canEdit && (
                <div className="news-actions">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(post)}
                      className="btn-icon glass-effect"
                      title="Редактировать"
                      style={{ 
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: 'var(--color-primary)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                      }}
                    >
                      
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="btn-icon glass-effect"
                    title="Удалить"
                    style={{ 
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: 'var(--color-danger)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </article>
        );
      })}

      {news.length === 0 && (
        <p className="empty-text">Новостей пока нет</p>
      )}
    </div>
  );
}