import { PrismaNewsRepository } from '@/infrastructure/database/repositories/PrismaNewsRepository';
import Link from 'next/link';

export default async function NewsPage() {
  const newsRepo = new PrismaNewsRepository();
  const { posts, total, page, totalPages } = await newsRepo.findPublished(1, 20);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1>Все новости</h1>
      <Link href="/" style={{ color: '#0070f3' }}>← На главную</Link>

      {posts.length === 0 ? (
        <p style={{ marginTop: 20 }}>Новостей пока нет</p>
      ) : (
        posts.map((post) => (
          <div key={post.id} style={{
            border: '1px solid #eee',
            borderRadius: 8,
            padding: 16,
            marginTop: 12,
          }}>
            <h3>{post.title}</h3>
            <p>{post.getPreview(300)}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: 14 }}>
              <span>{post.createdAt.toLocaleDateString()}</span>
              <span>{post.category}</span>
            </div>
            {post.matchId && (
              <Link href={`/matches/${post.matchId}`} style={{ color: '#0070f3', fontSize: 14 }}>
                Смотреть матч →
              </Link>
            )}
          </div>
        ))
      )}

      {totalPages > 1 && (
        <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'center' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/news?page=${p}`}
              style={{
                padding: '4px 12px',
                background: p === page ? '#0070f3' : '#f0f0f0',
                color: p === page ? 'white' : 'black',
                borderRadius: 4,
                textDecoration: 'none',
              }}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
