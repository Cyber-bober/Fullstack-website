'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PositionLabels } from '@/domain/value-objects/PlayerPosition';
import { PlayerPosition } from '@/domain/value-objects/PlayerPosition';
import { useRouter } from 'next/navigation';

interface UserPlain {
  id: string;
  username: string;
  fullName: string;
  birthDate: string;
  city: string;
  role: string;
  position?: PlayerPosition;
  photos: string[];
  contacts: { email?: string; phone?: string; telegram?: string };
  stats?: Record<string, number>;
}

interface TeamPlain {
  id: string;
  name: string;
  logoUrl?: string;
  playerCount: number;
  stats?: { matchesPlayed?: number; wins?: number; draws?: number; losses?: number; goalsScored?: number; goalsConceded?: number; cleanSheets?: number; } | null;
}

interface Props {
  user: UserPlain;
  team: TeamPlain | null;
}

export default function ProfileCard({ user, team }: Props) {
  const router = useRouter();
  const [photoUrl, setPhotoUrl] = useState('');
  const [photos, setPhotos] = useState(user.photos);

  const addPhoto = async () => {
    if (!photoUrl.trim()) return;
    const res = await fetch('/api/profile/photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoUrl }),
    });
    if (res.ok) {
      const data = await res.json();
      setPhotos(data.photos);
      setPhotoUrl('');
      router.refresh();
    }
  };

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 24, maxWidth: 600 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
        {photos.length > 0 ? (
          photos.map((url, i) => (
            <img key={i} src={url} alt={`Photo ${i + 1}`}
              style={{ width: 80, height: 80, borderRadius: 40, objectFit: 'cover' }} />
          ))
        ) : (
          <div style={{ width: 80, height: 80, borderRadius: 40, background: '#ccc' }} />
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="URL фото"
          style={{ flex: 1, padding: 4 }}
        />
        <button onClick={addPhoto} style={{ padding: '4px 8px' }}>Добавить</button>
      </div>

      <h1 style={{ margin: 0 }}>{user.fullName}</h1>
      <Link href="/profile/edit" style={{ fontSize: 14, color: '#0070f3', textDecoration: 'none' }}>
        Редактировать
      </Link>
      <p style={{ color: '#666' }}>@{user.username}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
        <div><strong>Дата рождения:</strong> {new Date(user.birthDate).toLocaleDateString()}</div>
        <div><strong>Город:</strong> {user.city}</div>
        <div><strong>Позиция:</strong> {user.position ? PositionLabels[user.position] : 'Не указана'}</div>
        <div>
          <strong>Команда:</strong>{' '}
          {team ? (
            <Link href={`/teams/${team.id}`} style={{ color: '#0070f3' }}>{team.name}</Link>
          ) : ('Нет команды')}
        </div>
      </div>

      {user.contacts && (
        <div style={{ marginTop: 16 }}>
          <strong>Контакты:</strong>
          {user.contacts.email && <div>Email: {user.contacts.email}</div>}
          {user.contacts.phone && <div>Телефон: {user.contacts.phone}</div>}
          {user.contacts.telegram && <div>Telegram: @{user.contacts.telegram}</div>}
        </div>
      )}

      {user.stats && (
        <div style={{ marginTop: 16 }}>
          <h3>Статистика</h3>
          {Object.entries(user.stats).map(([key, value]) => (
            <div key={key}><strong>{key}:</strong> {value}</div>
          ))}
        </div>
      )}
    </div>
  );
}
