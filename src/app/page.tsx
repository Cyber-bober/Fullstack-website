import { PrismaNewsRepository } from '@/infrastructure/database/repositories/PrismaNewsRepository';
import { PrismaMatchRepository } from '@/infrastructure/database/repositories/PrismaMatchRepository';
import MatchCalendar from '@/presentation/components/calendar/MatchCalendar';
import HomeClient from '@/presentation/components/home/HomeClient';

export default async function HomePage() {
  const newsRepo = new PrismaNewsRepository();
  const matchRepo = new PrismaMatchRepository();

  const { posts } = await newsRepo.findPublished(1, 10);
  const upcomingMatches = await matchRepo.findUpcoming(5);

  const postsPlain = posts.map((p) => ({
    id: p.id,
    title: p.title,
    preview: p.getPreview(200),
    createdAt: p.createdAt.toISOString(),
    category: p.category,
    matchId: p.matchId,
  }));

  const matchesPlain = upcomingMatches.map((m) => ({
    id: m.id,
    homeTeamId: m.homeTeamId,
    awayTeamId: m.awayTeamId,
    date: m.date.toISOString(),
    status: m.status,
    score: m.score,
    isLive: m.isLive(),
    isFinished: m.isFinished(),
  }));

  return <HomeClient posts={postsPlain} matches={matchesPlain} />;
}
