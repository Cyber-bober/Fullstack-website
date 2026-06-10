// src/app/teams/[id]/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";

type Player = {
  id: string;
  fullName: string;
  position?: string;
  username: string;
  isCaptain?: boolean;
};

type Team = {
  id: string;
  name: string;
  captainId?: string;
  players: Player[];
};

export default function TeamPage({ params }: { params: { id: string } }) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const res = await fetch(`/api/teams/${params.id}`);
        if (res.ok) {
          const data: Team = await res.json();
          // Добавим isCaptain
          data.players = data.players.map((p) => ({
            ...p,
            isCaptain: p.id === data.captainId,
          }));
          setTeam(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadTeam();
  }, [params.id]);

  if (loading) return <p className="p-4">Загрузка...</p>;
  if (!team) return <p className="empty-text">Команда не найдена</p>;

  return (
    <div className="container">
      <Card className="text-center">
        <h1 className="home-title">{team.name}</h1>
        <p className="text-gray">Игроков: {team.players.length}</p>
      </Card>

      <h2 className="section-title">Состав</h2>
      <div className="team-players">
        {team.players.map((player) => (
          <Link
            key={player.id}
            href={`/profile/${player.id}`}
            className="team-player-card"
          >
            <div className="player-info">
              <div className="player-name">
                {player.fullName}
                {player.isCaptain && <span className="captain-label">⭐ Капитан</span>}
              </div>
              <div className="player-position">{player.position || "Не указана"}</div>
              <div className="player-username">@{player.username}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}