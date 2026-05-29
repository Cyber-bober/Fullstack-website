'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateTeamPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, logoUrl }),
    });
    if (res.ok) {
      router.push('/teams');
    } else {
      const data = await res.json();
      setError(data.error || 'Ошибка');
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 30, background: 'var(--card-bg, #fff)', borderRadius: 16, border: '1px solid var(--border, #ddd)' }}>
      <h1>Создать команду</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Название команды" required
          style={{ width: '100%', padding: 10, margin: '8px 0', borderRadius: 8, border: '1px solid #ddd' }} />
        <input type="text" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="URL логотипа"
          style={{ width: '100%', padding: 10, margin: '8px 0', borderRadius: 8, border: '1px solid #ddd' }} />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ width: '100%', padding: 12, marginTop: 12, background: '#0070f3', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16 }}>
          Создать
        </button>
      </form>
    </div>
  );
}
