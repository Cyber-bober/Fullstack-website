'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    if (session?.user) {
      setFullName((session.user as any).fullName || '');
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
      }).catch(() => {});
  }, [session, status, router]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);
    const res = await fetch('/api/profile/photo', { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json();
      setPhotos(data.photos);
    }
    setUploading(false);
  };

  const removePhoto = (index: number) => { setPhotos(photos.filter((_, i) => i !== index)); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (username && !/^[a-zA-Z0-9_]{3,30}$/.test(username)) { setError('Логин: 3-30 символов, буквы, цифры, _'); return; }
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, username, city, contacts: { email, phone, telegram }, photos }),
    });
    const data = await res.json();
    if (res.ok) { setSuccess('Готово!'); update(); setTimeout(() => router.push('/profile'), 800); }
    else setError(data.error || 'Ошибка');
  };

  if (status === 'loading') return <div style={{ padding: 40, textAlign: 'center' }}>Загрузка...</div>;

  const s = { width: '100%', padding: 10, margin: '4px 0 12px', borderRadius: 10, border: '1px solid #ddd', boxSizing: 'border-box' as const };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 30, background: '#fff', borderRadius: 20, border: '1px solid #eee', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
      <h1 style={{ marginTop: 0 }}>Редактировать профиль</h1>
      <form onSubmit={handleSubmit}>
        <label>ФИО</label><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} style={s} />
        <label>@username</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="уникальный ID" style={s} />
        <label>Город</label><input type="text" value={city} onChange={e => setCity(e.target.value)} style={s} />
        <label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} style={s} />
        <label>Телефон</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={s} />
        <label>Telegram</label><input type="text" value={telegram} onChange={e => setTelegram(e.target.value)} style={s} />

        <label>Фото</label>
        <input type="file" accept="image/*" ref={fileRef} onChange={handleUpload} style={{ marginBottom: 8 }} />
        {uploading && <span style={{ fontSize: 12, color: '#666' }}>Загрузка...</span>}

        {photos.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {photos.map((url, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={url} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                <button type="button" onClick={() => removePhoto(i)}
                  style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, background: 'red', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer' }}>×</button>
              </div>
            ))}
          </div>
        )}

        {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
        {success && <p style={{ color: 'green', marginTop: 12 }}>{success}</p>}

        <button type="submit" style={{ width: '100%', padding: 12, marginTop: 20, background: '#0070f3', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, cursor: 'pointer' }}>
          Сохранить
        </button>
      </form>
    </div>
  );
}
