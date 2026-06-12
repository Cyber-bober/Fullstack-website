//src/app/teams/[id]/page.tsx

"use client";
import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import TeamHeader from "@/components/ui/TeamHeader";
import PlayerCard from "@/components/ui/PlayerCard";
import AddPlayerForm from "@/components/ui/AddPlayerForm";
import { Player, Team } from "@/types/teamid"

export default function TeamPage({ params }: { params: { id: string } }) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [addingPlayer, setAddingPlayer] = useState(false);

  useEffect(() => {
    loadTeam();
    loadSession();
  }, [params.id]);

  const loadSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const session = await res.json();
        setCurrentUserId(session?.user?.id);
        setUserRole(session?.user?.role || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadTeam = async () => {
    try {
      const res = await fetch(`/api/teams/${params.id}`);
      if (res.ok) {
        const data: Team = await res.json();
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

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "photo"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const res = await fetch(`/api/teams/${params.id}/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        await loadTeam();
      } else {
        const data = await res.json();
        alert(data.error || "Ошибка загрузки");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (url: string, type: "logo" | "photo") => {
    if (!confirm("Удалить фото?")) return;

    try {
      const res = await fetch(`/api/teams/${params.id}/upload`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, type }),
      });

      if (res.ok) {
        await loadTeam();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPlayer = async (userId: string) => {
    setAddingPlayer(true);
    try {
      const res = await fetch(`/api/teams/${params.id}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        setShowAddPlayer(false);
        await loadTeam();
      } else {
        const error = await res.json();
        alert(error.error || "Ошибка добавления игрока");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети");
    } finally {
      setAddingPlayer(false);
    }
  };

  const handleRemovePlayer = async (userId: string) => {
    if (!confirm("Удалить игрока из команды?")) return;

    try {
      const res = await fetch(`/api/teams/${params.id}/players`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        await loadTeam();
      } else {
        const error = await res.json();
        alert(error.error || "Ошибка удаления игрока");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети");
    }
  };

  const handleSetCaptain = async (userId: string) => {
    if (!confirm("Назначить этого игрока капитаном?")) return;

    try {
      const res = await fetch(`/api/teams/${params.id}/captain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        await loadTeam();
      } else {
        const error = await res.json();
        alert(error.error || "Ошибка назначения капитана");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети");
    }
  };

  const canManageTeam = userRole === "ADMIN" || (team && team.captainId === currentUserId);

  if (loading) return <p className="empty-text">Загрузка...</p>;
  if (!team) return <p className="empty-text">Команда не найдена</p>;

  return (
    <div className="container">
      <TeamHeader
        team={team}
        canManage={canManageTeam || false}
        uploading={uploading}
        onUploadLogo={(e) => handleUpload(e, "logo")}
        onUploadPhoto={(e) => handleUpload(e, "photo")}
        onRemoveLogo={() => team.logoUrl && handleRemove(team.logoUrl, "logo")}
        onRemovePhoto={(url) => handleRemove(url, "photo")}
        onAddPlayer={() => setShowAddPlayer(!showAddPlayer)}
      />

      {showAddPlayer && canManageTeam && (
        <AddPlayerForm
          onAddPlayer={handleAddPlayer}
          addingPlayer={addingPlayer}
        />
      )}

      <h2 className="section-title">Состав</h2>
      <div className="team-players">
        {team.players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            canManage={canManageTeam || false}
            isAdmin={userRole === "ADMIN"}
            onSetCaptain={handleSetCaptain}
            onRemovePlayer={handleRemovePlayer}
          />
        ))}
      </div>
    </div>
  );
}