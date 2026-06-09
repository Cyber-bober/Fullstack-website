import { PrismaMatchRepository } from '@/infrastructure/database/repositories/PrismaMatchRepository';
import Link from 'next/link';

export default async function MatchesPage() {
  const repo = new PrismaMatchRepository();
  const matches = await repo.findUpcoming(20);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1>Все матчи</h1>
      {matches.map(m => (
        <Link key={m.id} href={`/matches/${m.id}`}
          style={{ display: 'block', padding: 12, border: '1px solid #eee', marginBottom: 8, borderRadius: 8, textDecoration: 'none', color: 'inherit' }}>
          <div>{m.homeTeamId} vs {m.awayTeamId}</div>
          <div style={{ fontSize: 14, color: '#666' }}>{m.date.toLocaleDateString()}</div>
        </Link>
      ))}
    </div>
  );
}
