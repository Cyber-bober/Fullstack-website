import { PrismaTeamRepository } from '@/infrastructure/database/repositories/PrismaTeamRepository';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/auth/authOptions';
import Link from 'next/link';

export default async function TeamsPage() {
  const teamRepo = new PrismaTeamRepository();
  const teams = await teamRepo.findAll();
  const session = await getServerSession(authOptions);
  const canCreate = session && ((session.user as any).role === 'ADMIN' || (session.user as any).role === 'CAPTAIN');

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Команды</h1>
        {canCreate && (
          <Link href="/teams/create" style={{ padding: '8px 16px', background: '#0070f3', color: '#fff', borderRadius: 8, textDecoration: 'none' }}>
            + Создать команду
          </Link>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        {teams.map(team => (
          <Link key={team.id} href={`/teams/${team.id}`}
            style={{ padding: 16, border: '1px solid #eee', borderRadius: 12, textDecoration: 'none', color: 'inherit' }}>
            <h3>{team.name}</h3><p>Игроков: {team.playerCount}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
