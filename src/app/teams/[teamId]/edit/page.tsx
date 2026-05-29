'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function EditTeamPage() {
  const { teamId } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/teams/${teamId}`)
      .then(r => r.json())
      .then(d => { setName(d.name || ''); setLogoUrl(d.logoUrl || ''); })
      .catch(() => {});
  }, [teamId]);

  const handleSave = async () => {
    setSaving(true);
    const file = fileRef.current?.files?.[0];
    if (file) {
      const fd = new FormData();
      fd.append('logo', file);
      await fetch(`/api/teams/${teamId}/photo`, { method: 'POST', body: fd });
    }
    await fetch(`/api/teams/${teamId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setSaving(false);
    router.push(`/teams/${teamId}`);
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 30, background: '#fff', borderRadius: 16, border: '1px solid #eee' }}>
      <h1>Редактировать команду</h1>
      <input type="text" value={name} onChange={e => setName(e.target.value)}
        style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid #ddd' }} />
      {logoUrl && <img src={logoUrl} alt="" style={{ height: 60, marginBottom: 8 }} />}
      <input type="file" accept="image/*" ref={fileRef} style={{ marginBottom: 8 }} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={handleSave} disabled={saving}
        style={{ width: '100%', padding: 12, background: '#0070f3', color: '#fff', border: 'none', borderRadius: 12 }}>
        {saving ? 'Сохранение...' : 'Сохранить'}
      </button>
    </div>
  );
}
