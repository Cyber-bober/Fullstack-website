// src/components/ui/AddPlayerForm.tsx
"use client";
import { useState } from "react";
import { SearchUser, AddPlayerFormProps } from "@/types/addPlayer";

export default function AddPlayerForm({ onAddPlayer, addingPlayer, teamId }: AddPlayerFormProps & { teamId?: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&excludeTeamId=${teamId || ''}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card">
      <h3 className="section-title">Поиск игрока</h3>
      <input
        type="text"
        placeholder="Введите имя, username или ID..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
      />

      {searchResults.length > 0 && (
        <div className="search-results-list">
          {searchResults.map((user) => {
            const isInCurrentTeam = user.teamId === teamId;
            const isInOtherTeam = user.teamId && user.teamId !== teamId;

            return (
              <div key={user.id} className="search-result-item">
                <div className="search-result-info">
                  <div className="search-result-avatar">
                    {user.photos?.[0] && <img src={user.photos[0]} alt="" />}
                  </div>
                  <div>
                    <div className="search-result-name">{user.fullName}</div>
                    <div className="search-result-username">@{user.username}</div>
                    
                    {isInCurrentTeam && (
                      <div className="search-result-warning" style={{ color: '#0160ce' }}>
                        Уже в этой команде
                      </div>
                    )}
                    {isInOtherTeam && (
                      <div className="search-result-warning">
                        В другой команде
                      </div>
                    )}
                  </div>
                </div>

                {!isInCurrentTeam && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onAddPlayer(user.id)}
                    disabled={addingPlayer}
                    title={isInOtherTeam ? "Игрок будет переведен из другой команды" : "Добавить игрока"}
                  >
                    {addingPlayer ? "..." : isInOtherTeam ? "Перевести" : "Добавить"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}