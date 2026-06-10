import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Card from "@/components/Card";

// Типы для данных
type NewsPostWithAuthor = {
  id: string;
  title: string;
  content: string;
  author: { fullName: string };
  createdAt: Date;
};

type MatchWithTeams = {
  id: string;
  date: Date;
  homeTeam: { name: string };
  awayTeam: { name: string };
};

export default async function HomePage() {
  const posts = await prisma.newsPost.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { author: { select: { fullName: true } } },
  }) as NewsPostWithAuthor[];

  const matches = await prisma.match.findMany({
    where: { status: "SCHEDULED" }, // Исправлена опечатка
    take: 5,
    orderBy: { date: "asc" },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  }) as MatchWithTeams[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Football Hub</h1>

      <section>
        <h2 className="text-xl font-semibold mb-2">Новости</h2>
        {posts.map((p: NewsPostWithAuthor) => (
          <Card key={p.id} className="mb-2">
            <h3 className="font-bold">{p.title}</h3>
            <p className="text-sm text-gray-500">{p.content.slice(0, 150)}</p>
            <span className="text-xs text-gray-400">Автор: {p.author.fullName}</span>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Ближайшие матчи</h2>
        {matches.map((m: MatchWithTeams) => (
          <Link key={m.id} href={`/matches/${m.id}`}>
            <Card className="mb-2 hover:shadow-md transition">
              <span className="font-bold">{m.homeTeam.name}</span>
              {" vs "}
              <span className="font-bold">{m.awayTeam.name}</span>
              <span className="text-sm text-gray-500 ml-2">
                — {new Date(m.date).toLocaleDateString()}
              </span>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
