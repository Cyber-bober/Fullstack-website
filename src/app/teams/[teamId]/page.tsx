import { PrismaTeamRepository } from '@/infrastructure/database/repositories/PrismaTeamRepository';
import { PrismaUserRepository } from '@/infrastructure/database/repositories/PrismaUserRepository';
import { PrismaMatchRepository } from '@/infrastructure/database/repositories/PrismaMatchRepository';
import Link from 'next/link';

export default async function TeamPage({ params }: { params: { teamId: string } }) {
  const id = params.teamId;
  const teamRepo = new PrismaTeamRepository();
  const userRepo = new PrismaUserRepository();
  const matchRepo = new PrismaMatchRepository();

  const team = await teamRepo.findById(id);
  if (!team) return <div>Команда не найдена</div>;

  const players = await userRepo.findByTeamId(id);
  const matches = await matchRepo.findByTeamId(id);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1>{team.name}</h1>
      <h2>Игроки ({players.length})</h2>
      {players.map(p => (
        <div key={p.id}>{p.fullName} (@{p.username})</div>
      ))}
      <h2 style={{ marginTop: 24 }}>Матчи</h2>
      {matches.map(m => (
        <Link key={m.id} href={`/matches/${m.id}`} style={{ display: 'block', padding: 8, border: '1px solid #eee', marginBottom: 4, borderRadius: 8 }}>
          {m.homeTeamId} vs {m.awayTeamId} — {m.date.toLocaleDateString()}
        </Link>
      ))}
    </div>
  );
}
