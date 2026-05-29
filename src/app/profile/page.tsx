/**
 * Profile page — personal cabinet.
 * Fetches data server-side, passes plain objects to client component.
 */
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/auth/authOptions';
import { PrismaUserRepository } from '@/infrastructure/database/repositories/PrismaUserRepository';
import { PrismaTeamRepository } from '@/infrastructure/database/repositories/PrismaTeamRepository';
import ProfileCard from '@/presentation/components/profile/ProfileCard';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return <div>Пожалуйста, войдите в систему</div>;
  }

  const userRepo = new PrismaUserRepository();
  const teamRepo = new PrismaTeamRepository();
  const user = await userRepo.findById((session.user as any).id);

  if (!user) {
    return <div>Пользователь не найден</div>;
  }

  let teamPlain = null;
  if (user.teamId) {
    const team = await teamRepo.findById(user.teamId);
    if (team) {
      teamPlain = {
        id: team.id,
        name: team.name,
        logoUrl: team.logoUrl,
        playerCount: team.playerCount,
        stats: team.stats ? { ...team.stats } : null,
      };
    }
  }

  const userPlain = {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    birthDate: user.birthDate.toISOString(),
    city: user.city,
    role: user.role,
    position: user.position,
    photos: user.photos,
    contacts: user.contacts,
    stats: user.stats,
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <ProfileCard user={userPlain} team={teamPlain} />
    </div>
  );
}
