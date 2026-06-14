// src/app/matches/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";

// Вспомогательная функция для перевода статуса
const getStatusText = (status: string) => {
  switch (status) {
    case "SCHEDULED": return "Запланирован";
    case "LIVE": return "Идет сейчас";
    case "FINISHED": return "Завершен";
    case "CANCELLED": return "Отменен";
    default: return status;
  }
};

export default async function MatchPage({ params }: { params: { id: string } }) {
  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      homeTeam: { select: { name: true, logoUrl: true } },
      awayTeam: { select: { name: true, logoUrl: true } },
    },
  });

  if (!match) return <p style={{ padding: 40 }}>Матч не найден</p>;

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <Card>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 12 }}>
            <div style={{ textAlign: 'center' }}>
              {match.homeTeam.logoUrl && <img src={match.homeTeam.logoUrl} style={{ width: 48, height: 48, borderRadius: 8 }} />}
              <p style={{ fontWeight: 600 }}>{match.homeTeam.name}</p>
            </div>
            <span style={{ fontSize: 28, fontWeight: 700 }}>vs</span>
            <div style={{ textAlign: 'center' }}>
              {match.awayTeam.logoUrl && <img src={match.awayTeam.logoUrl} style={{ width: 48, height: 48, borderRadius: 8 }} />}
              <p style={{ fontWeight: 600 }}>{match.awayTeam.name}</p>
            </div>
          </div>

          {match.score ? (
            <h2 style={{ fontSize: 40, margin: '12px 0' }}>{match.score}</h2>
          ) : (
            <p style={{ color: '#888' }}>Матч ещё не начался</p>
          )}

          <p>️ {new Date(match.date).toLocaleDateString()}</p>
          <p> {match.venue || "Стадион не указан"}</p>
          
          {/* СТАТУС */}
          <p style={{ marginTop: 10, fontWeight: 500 }}>Статус: {getStatusText(match.status)}</p>
        </div>
      </Card>
    </div>
  );
}