import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Card from "@/components/Card";

export default async function HomePage() {
  const posts = await prisma.newsPost.findMany({ where: { isPublished: true }, orderBy: { createdAt: "desc" }, take: 10 });
  const matches = await prisma.match.findMany({ where: { status: "SCHEDULED" }, take: 5 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Football Hub</h1>
      <section>
        <h2 className="text-xl font-semibold mb-2">Новости</h2>
        {posts.map(p => (
          <Card key={p.id} className="mb-2">
            <h3 className="font-bold">{p.title}</h3>
            <p className="text-sm text-gray-500">{p.content.slice(0, 150)}</p>
          </Card>
        ))}
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">Ближайшие матчи</h2>
        {matches.map(m => (
          <Link key={m.id} href={`/matches/${m.id}`}>
            <Card className="mb-2 hover:shadow-md transition">
              {m.homeTeamId} vs {m.awayTeamId} — {new Date(m.date).toLocaleDateString()}
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
