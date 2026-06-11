"use client";
import Link from "next/link";

type PlayerCardProps = {
  player: {
    id: string;
    fullName: string;
    position?: string;
    username: string;
    photos: string[];
    isCaptain?: boolean;
  };
  canManage: boolean;
  isAdmin: boolean;
  onSetCaptain: (userId: string) => void;
  onRemovePlayer: (userId: string) => void;
};

export default function PlayerCard({
  player,
  canManage,
  isAdmin,
  onSetCaptain,
  onRemovePlayer,
}: PlayerCardProps) {
  return (
    <div className="team-player-card" style={{ position: "relative" }}>
      <Link
        href={`/profile/${player.id}`}
        className="player-link"
      >
        <div className="player-avatar">
          {player.photos[0] ? (
            <img src={player.photos[0]} alt={player.fullName} />
          ) : (
            <div className="player-avatar-placeholder" />
          )}
          {player.isCaptain && <span className="captain-badge">⭐</span>}
        </div>
        <div className="player-info">
          <div className="player-name">
            {player.fullName}
            {player.isCaptain && <span className="captain-label">Капитан</span>}
          </div>
          <div className="player-position">{player.position || "Не указана"}</div>
          <div className="player-username">@{player.username}</div>
        </div>
      </Link>

      {canManage && !player.isCaptain && (
        <div className="player-actions">
          {isAdmin && (
            <button
              onClick={() => onSetCaptain(player.id)}
              className="btn btn-success btn-sm"
              title="Назначить капитаном"
            >
              ⭐
            </button>
          )}
          <button
            onClick={() => onRemovePlayer(player.id)}
            className="btn btn-danger btn-sm"
            title="Удалить из команды"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}