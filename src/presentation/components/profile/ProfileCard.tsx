'use client';

import Link from 'next/link';
import { PositionLabels } from '@/domain/value-objects/PlayerPosition';
import { PlayerPosition } from '@/domain/value-objects/PlayerPosition';

interface UserPlain {
  id: string; username: string; fullName: string; birthDate: string; city: string; role: string;
  position?: PlayerPosition; photos: string[];
  contacts: { email?: string; phone?: string; telegram?: string };
  stats?: Record<string, number>;
}
interface TeamPlain {
  id: string; name: string; logoUrl?: string; playerCount: number;
  stats?: { matchesPlayed?: number; wins?: number; draws?: number; losses?: number; goalsScored?: number; goalsConceded?: number; cleanSheets?: number; } | null;
}
export default function ProfileCard({ user, team }: { user: UserPlain; team: TeamPlain | null }) {
  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
        {user.photos.length > 0 ? user.photos.map((url, i) => (
          <img key={i} src={url} style={{ width: 80, height: 80, borderRadius: 40, objectFit: 'cover' }} />
        )) : <div style={{ width: 80, height: 80, borderRadius: 40, background: '#e0e0e0' }} />}
      </div>
      <h1 style={{ margin: 0 }}>{user.fullName}</h1>
      <Link href="/profile/edit" style={{ fontSize: 14, color: '#0070f3' }}>Редактировать</Link>
      <p style={{ color: '#888' }}>@{user.username}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
        <div>Дата рождения: {new Date(user.birthDate).toLocaleDateString()}</div>
        <div>Город: {user.city}</div>
        <div>Позиция: {user.position ? PositionLabels[user.position] : '—'}</div>
        <div>Команда: {team ? <Link href={`/teams/${team.id}`}>{team.name}</Link> : '—'}</div>
      </div>
    </div>
  );
}
