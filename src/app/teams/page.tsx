// src/app/teams/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";

type Team = {
  id: string;
  name: string;
  playersCount: number;
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const res = await fetch("/api/teams");
        if (res.ok) {
          const data = await res.json();
          // Преобразуем для совместимости
          const teamsWithCount: Team[] = data.map((t: any) => ({
            id: t.id,
            name: t.name,
            playersCount: t._count?.players || 0,
          }));
          setTeams(teamsWithCount);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadTeams();
  }, []);

  if (loading) return <p className="p-4">Загрузка...</p>;
  if (teams.length === 0) return <p className="empty-text">Команды не найдены</p>;

  return (
    <div className="container">
      <h1 className="home-title">Команды</h1>

      <div className="grid grid-cols-2 gap-4">
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/teams/${team.id}`}
            className="block"
          >
            <Card>
              <div className="font-bold text-lg">{team.name}</div>
              <div className="text-gray">Игроков: {team.playersCount}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}