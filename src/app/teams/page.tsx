import { prisma } from "@/lib/prisma";
import Card from "@/components/Card";

export default async function TeamsPage() {
  const teams = await prisma.team.findMany({ include: { _count: { select: { players: true } } } });
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Команды</h1>
      {teams.map(t => (
        <Card key={t.id} className="mb-2">
          <h2 className="font-bold">{t.name}</h2>
          <p className="text-sm text-gray-500">Игроков: {t._count.players}</p>
        </Card>
      ))}
    </div>
  );
}
