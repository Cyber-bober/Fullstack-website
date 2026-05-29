'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function EditProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    if (session?.user) {
      setFullName((session.user as any).fullName || session.user.name || '');
      setUsername((session.user as any).username || '');
    }
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => {
        if (d.city) setCity(d.city);
        if (d.contacts?.email) setEmail(d.contacts.email);
        if (d.contacts?.phone) setPhone(d.contacts.phone);
        if (d.contacts?.telegram) setTelegram(d.contacts.telegram);
        if (d.photos) setPhotos(d.photos);
      })
      .catch(() => {});
  }, [session, status, router]);

  const addPhoto = () => {
    if (!photoUrl.trim()) return;
    if (photos.length >= 10) { setError('Максимум 10 фото'); return; }
    setPhotos([...photos, photoUrl]);
    setPhotoUrl('');
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (username && !/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      setError('Логин: 3-30 символов, буквы, цифры, _');
      return;
    }

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, username, city, contacts: { email, phone, telegram }, photos }),
    });

    const data = await res.json();
    if (res.ok) {
      setSuccess('Профиль обновлён!');
      update();
      setTimeout(() => router.push('/profile'), 1000);
    } else {
      setError(data.error || 'Ошибка');
    }
  };

  if (status === 'loading') return <div style={{ padding: 40, textAlign: 'center' }}>Загрузка...</div>;

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 30, background: 'var(--card-bg, #fff)', borderRadius: 16, border: '1px solid var(--border, #ddd)' }}>
      <h1 style={{ marginTop: 0 }}>Редактировать профиль</h1>
      <form onSubmit={handleSubmit}>
        <label>ФИО</label>
        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
          style={{ width: '100%', padding: 10, margin: '4px 0 12px', borderRadius: 8, border: '1px solid #ddd' }} />

        <label>Логин (@username)</label>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)}
          placeholder="уникальный ID"
          style={{ width: '100%', padding: 10, margin: '4px 0 12px', borderRadius: 8, border: '1px solid #ddd' }} />

        <label>Город</label>
        <input type="text" value={city} onChange={e => setCity(e.target.value)}
          style={{ width: '100%', padding: 10, margin: '4px 0 12px', borderRadius: 8, border: '1px solid #ddd' }} />

        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: 10, margin: '4px 0 12px', borderRadius: 8, border: '1px solid #ddd' }} />

        <label>Телефон</label>
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
          style={{ width: '100%', padding: 10, margin: '4px 0 12px', borderRadius: 8, border: '1px solid #ddd' }} />

        <label>Telegram</label>
        <input type="text" value={telegram} onChange={e => setTelegram(e.target.value)}
          style={{ width: '100%', padding: 10, margin: '4px 0 12px', borderRadius: 8, border: '1px solid #ddd' }} />

        <label>Фото (URL)</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)}
            placeholder="https://..." style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ddd' }} />
          <button type="button" onClick={addPhoto} style={{ padding: '10px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 8 }}>+</button>
        </div>

        {photos.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {photos.map((url, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={url} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                <button type="button" onClick={() => removePhoto(i)}
                  style={{ position: 'absolute', top: -8, right: -8, width: 20, height: 20, borderRadius: 10, background: 'red', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer' }}>×</button>
              </div>
            ))}
          </div>
        )}

        {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
        {success && <p style={{ color: 'green', marginTop: 12 }}>{success}</p>}

        <button type="submit" style={{ width: '100%', padding: 12, marginTop: 20, background: '#0070f3', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, cursor: 'pointer' }}>
          Сохранить
        </button>
      </form>
    </div>
  );
}
