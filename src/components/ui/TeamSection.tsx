// src/components/ui/TeamSection.tsx
import Link from "next/link";

type Player = {
  id: string;
  username: string;
  fullName: string;
  position?: string;
  photos: string[];
};

type Team = {
  id: string;
  name: string;
  captainId?: string;
  players: Player[];
};

type Props = {
  teams: Team[];
};

export function TeamSection({ teams }: Props) {
  if (teams.length === 0) {
    return <p className="empty-text">Команды не найдены</p>;
  }

  return (
    <div>
      <h2 className="section-title">Команды</h2>

      {teams.map((team) => (
        <div key={team.id} className="team-section">
          <h3 className="team-name">{team.name}</h3>
          <div className="team-players">
            {team.players.map((player) => {
              const isCaptain = player.id === team.captainId;
              return (
                <Link
                  key={player.id}
                  href={`/profile/${player.id}`}
                  className="team-player-card"
                >
                  <div className="player-avatar">
                    {player.photos[0] ? (
                      <img src={player.photos[0]} alt={player.fullName} />
                    ) : (
                      <div className="player-avatar-placeholder" />
                    )}
                    {isCaptain && <span className="captain-badge">⭐</span>}
                  </div>
                  <div className="player-info">
                    <div className="player-name">
                      {player.fullName}
                      {isCaptain && <span className="captain-label">Капитан</span>}
                    </div>
                    <div className="player-position">{player.position || "Не указана"}</div>
                    <div className="player-username">@{player.username}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}