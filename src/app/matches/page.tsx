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
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Все матчи</h1>
      {matches.map((m) => (
        <Link key={m.id} href={`/matches/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <Card className="hover-highlight">
            <strong>{m.homeTeam.name}</strong> vs <strong>{m.awayTeam.name}</strong>
            <span style={{ color: '#888', marginLeft: 8 }}>— {new Date(m.date).toLocaleDateString()}</span>
          </Card>
        </Link>
      ))}
    </div>
  );
}
