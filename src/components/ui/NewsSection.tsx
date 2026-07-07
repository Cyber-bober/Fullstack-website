"use client";
import { NewsPost } from "@/types/page";

interface Props {
  news: NewsPost[];
  userRole: string | null;
  currentUserId?: string;
  setNews?: (news: NewsPost[]) => void;
}

export function NewsSection({ news, userRole, currentUserId, setNews }: Props) {
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
      {news.map((post) => (
        <article key={post.id} className="news-card glass-effect">
          {post.imageUrl && (
            <div className="news-image-container">
              <div className="news-image-wrapper">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="news-image"
                  loading="lazy"
                />
              </div>
            </div>
          )}

          <div className="news-content-wrapper">
            <h3 className="news-title">{post.title}</h3>
            <p className="news-content">{post.content}</p>
            
            <div className="news-meta">
              <span>Автор: {post.author?.fullName || post.author?.username}</span>
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

            {/* Кнопки управления */}
            {(userRole === "ADMIN" || userRole === "EDITOR" || post.authorId === currentUserId) && (
              <div className="news-actions">
                <button
                  onClick={() => handleDelete(post.id)}
                  className="delete-news-btn"
                  title="Удалить"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </article>
      ))}

      {news.length === 0 && (
        <p className="empty-text">Новостей пока нет</p>
      )}
    </div>
  );
}