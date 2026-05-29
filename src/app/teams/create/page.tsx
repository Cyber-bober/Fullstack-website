'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateTeamPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    const teamId = data.id;

    const file = fileRef.current?.files?.[0];
    if (file) {
      setUploading(true);
      const fd = new FormData();
      fd.append('logo', file);
      await fetch(`/api/teams/${teamId}/photo`, { method: 'POST', body: fd });
      setUploading(false);
    }
    router.push('/teams');
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 30, background: '#fff', borderRadius: 16, border: '1px solid #eee' }}>
      <h1>Создать команду</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Название" required
          style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: '1px solid #ddd' }} />
        <input type="file" accept="image/*" ref={fileRef} style={{ marginBottom: 12 }} />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={uploading}
          style={{ width: '100%', padding: 12, background: '#0070f3', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer' }}>
          {uploading ? 'Загрузка...' : 'Создать'}
        </button>
      </form>
    </div>
  );
}
