'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PostSummary {
  id: string;
  title: string;
  isPublished: boolean;
  createdAt: string;
}

interface Props {
  posts: PostSummary[];
  total: number;
  page: number;
  totalPages: number;
}

export default function NewsAdminPanel({ posts, total, page, totalPages }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreate = async () => {
    setError('');
    setSuccess('');

    const url = editingId ? `/api/news?id=${editingId}` : '/api/news';
    const method = editingId ? 'PATCH' : 'POST';
    const body = editingId ? { title, content } : { title, content };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok) {
      setSuccess(editingId ? 'Пост обновлён!' : 'Новость опубликована!');
      setTitle('');
      setContent('');
      setEditingId(null);
      setTimeout(() => setSuccess(''), 3000);
      router.refresh();
    } else {
      setError(data.error || 'Ошибка');
    }
  };

  const handleEdit = (post: PostSummary) => {
    setEditingId(post.id);
    setTitle(post.title);
    setContent('');
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setError('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить пост?')) return;
    await fetch(`/api/news?id=${id}`, { method: 'DELETE' });
    router.refresh();
  };

  const handleToggle = async (id: string) => {
    await fetch(`/api/news?id=${id}`, { method: 'PATCH' });
    router.refresh();
  };

  return (
    <div>
      {/* Create / Edit form */}
      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 24 }}>
        <h3>{editingId ? 'Редактировать пост' : 'Новый пост'}</h3>
        {error && <p style={{ color: 'red', padding: 8, background: '#ffeaea', borderRadius: 4 }}>{error}</p>}
        {success && <p style={{ color: 'green', padding: 8, background: '#eaffea', borderRadius: 4 }}>{success}</p>}
        
        <input
          type="text"
          placeholder="Заголовок (мин. 3 символа)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: '100%', padding: 8, marginBottom: 8 }}
        />
        <textarea
          placeholder="Содержание (мин. 10 символов)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          style={{ width: '100%', padding: 8, marginBottom: 8 }}
        />
        
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleCreate} style={{ padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            {editingId ? 'Обновить' : 'Опубликовать'}
          </button>
          {editingId && (
            <button onClick={handleCancelEdit} style={{ padding: '8px 16px', background: '#666', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              Отмена
            </button>
          )}
        </div>
      </div>

      {/* Posts list */}
      <h3>Все посты ({total})</h3>
      {posts.length === 0 && <p>Нет постов</p>}
      {posts.map((post) => (
        <div
          key={post.id}
          style={{
            border: '1px solid #eee',
            borderRadius: 8,
            padding: 12,
            marginBottom: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: editingId === post.id ? '#fff3cd' : 'transparent',
          }}
        >
          <div>
            <strong>{post.title}</strong>
            <span style={{ marginLeft: 8, color: post.isPublished ? 'green' : 'red', fontSize: 12 }}>
              {post.isPublished ? 'Опубликовано' : 'Скрыто'}
            </span>
            <div style={{ fontSize: 12, color: '#666' }}>
              {new Date(post.createdAt).toLocaleString()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handleEdit(post)}
              style={{ padding: '4px 8px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
            >
              Ред.
            </button>
            <button
              onClick={() => handleToggle(post.id)}
              style={{ padding: '4px 8px', background: post.isPublished ? '#ffc107' : '#28a745', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
            >
              {post.isPublished ? 'Скрыть' : 'Опубл.'}
            </button>
            <button
              onClick={() => handleDelete(post.id)}
              style={{ padding: '4px 8px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
            >
              Удалить
            </button>
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => router.push(`/admin/news?page=${p}`)}
              style={{
                padding: '4px 12px',
                background: p === page ? '#0070f3' : '#f0f0f0',
                color: p === page ? 'white' : 'black',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
