import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Card from "@/components/ui/Card";

export default async function MatchesPage() {
  const matches = await prisma.match.findMany({
    orderBy: { date: "asc" },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  });

  return (
    <div className="container">
      <h1 className="home-title">Все матчи</h1>
      {matches.map((m) => (
        <Link key={m.id} href={`/matches/${m.id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <Card>
            <strong>{m.homeTeam.name}</strong> vs <strong>{m.awayTeam.name}</strong>
            <span className="text-gray" style={{ marginLeft: "0.5rem" }}>
              — {new Date(m.date).toLocaleDateString()}
            </span>
          </Card>
        </Link>
      ))}
    </div>
  );
}