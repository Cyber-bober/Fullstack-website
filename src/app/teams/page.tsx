"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";

type Team = {
  id: string;
  name: string;
  logoUrl?: string;
  playersCount: number;
  captain?: {
    fullName: string;
  } | null;
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTeams();
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const session = await res.json();
        setUserRole(session?.user?.role || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadTeams = async () => {
    try {
      const res = await fetch("/api/teams");
      if (res.ok) {
        const data = await res.json();
        const teamsWithCount: Team[] = data.map((t: any) => ({
          id: t.id,
          name: t.name,
          logoUrl: t.logoUrl,
          playersCount: t._count?.players || 0,
          captain: t.captain || null,
        }));
        setTeams(teamsWithCount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/teams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName }),
      });

      if (res.ok) {
        setNewTeamName("");
        setShowCreateForm(false);
        await loadTeams();
      } else {
        const error = await res.json();
        alert(error.error || "Ошибка создания команды");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <p className="empty-text">Загрузка...</p>;

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 className="home-title" style={{ margin: 0 }}>Команды</h1>
        {userRole === "ADMIN" && (
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? "Отмена" : "+ Создать команду"}
          </button>
        )}
      </div>

      {showCreateForm && (
        <Card className="form-card">
          <form onSubmit={handleCreateTeam}>
            <div className="form-group">
              <label>Название команды</label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Введите название команды"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? "Создание..." : "Создать"}
            </button>
          </form>
        </Card>
      )}

      {teams.length === 0 ? (
        <p className="empty-text">Команды не найдены</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="block"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Card>
                <div className="font-bold text-lg">{team.name}</div>
                <div className="text-gray">Игроков: {team.playersCount}</div>
                {team.captain && (
                  <div className="text-gray" style={{ fontSize: "12px", marginTop: "4px" }}>
                    Капитан: {team.captain.fullName}
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}