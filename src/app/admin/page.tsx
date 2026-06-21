// src/app/admin/page.tsx
"use client";
import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";

type User = { id: string; username: string; fullName: string; role: string; createdAt: string };
type Team = { id: string; name: string; logoUrl?: string | null; rating?: number };

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"roles" | "users" | "rating">("users");
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  
  const [liveSearchQuery, setLiveSearchQuery] = useState("");
  const [liveSearchResults, setLiveSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);

  const [userTableSearch, setUserTableSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [tempPasswordVisible, setTempPasswordVisible] = useState(false);

  const [teams, setTeams] = useState<Team[]>([]);
  const [editedRatings, setEditedRatings] = useState<{[key: string]: number}>({});
  const [savingRatings, setSavingRatings] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (activeTab === "rating") {
      loadTeams();
    }
  }, [activeTab]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (liveSearchQuery.trim().length >= 2) {
        setSearchLoading(true);
        try {
          const res = await fetch(`/api/users/search?q=${encodeURIComponent(liveSearchQuery)}`);
          if (res.ok) setLiveSearchResults(await res.json());
        } catch {} finally { setSearchLoading(false); }
      } else { setLiveSearchResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [liveSearchQuery]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && liveSearchResults.length > 0) {
      setFoundUser(liveSearchResults[0]);
      setLiveSearchResults([]);
      setLiveSearchQuery("");
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setToast({ msg: "Пароль скопирован!", type: "success" });
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers(await res.json());
    } catch (err) { console.error(err); } finally { setLoadingUsers(false); }
  };

  const loadTeams = async () => {
    try {
      const res = await fetch("/api/teams?limit=100");
      if (res.ok) {
        const data = await res.json();
        const teamsList = Array.isArray(data) ? data : (data.data || []);
        setTeams(teamsList);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRole = async (newRole: string) => {
    if (!foundUser) return;
    setUpdatingRole(true);
    try {
      const res = await fetch(`/api/users/${foundUser.id}/role`, { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ role: newRole }) 
      });
      if (res.ok) {
        setToast({ msg: `Роль изменена на ${newRole}`, type: "success" });
        setFoundUser({ ...foundUser, role: newRole }); 
        loadUsers();
      } else { setToast({ msg: "Не удалось изменить роль", type: "error" }); }
    } catch { setToast({ msg: "Ошибка сети", type: "error" }); } finally { setUpdatingRole(false); }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm("Сбросить пароль?")) return;
    setResettingId(userId); setTempPassword(null); setTempPasswordVisible(false);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: "POST" });
      const data = await res.json();
      if (res.ok) { setTempPassword(data.tempPassword); setToast({ msg: "Пароль сброшен!", type: "success" }); }
      else { setToast({ msg: data.error || "Ошибка сброса", type: "error" }); }
    } catch { setToast({ msg: "Ошибка сети", type: "error" }); } finally { setResettingId(null); }
  };

  const updateTeamRating = (teamId: string, rating: number) => {
    setEditedRatings(prev => ({
      ...prev,
      [teamId]: rating
    }));
  };

  const saveAllRatings = async () => {
    if (Object.keys(editedRatings).length === 0) {
      setToast({ msg: "Измените хотя бы один рейтинг", type: "error" });
      return;
    }

    setSavingRatings(true);
    try {
      const res = await fetch("/api/admin/update-team-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratings: editedRatings })
      });

      if (res.ok) {
        setToast({ msg: "Рейтинги обновлены!", type: "success" });
        setEditedRatings({});
        loadTeams();
      } else {
        const err = await res.json();
        setToast({ msg: err.error || "Ошибка сохранения", type: "error" });
      }
    } catch {
      setToast({ msg: "Ошибка сети", type: "error" });
    } finally {
      setSavingRatings(false);
    }
  };

  const getRoleClass = (role: string) => {
    switch(role) {
      case "ADMIN": return "role-badge role-admin";
      case "EDITOR": return "role-badge role-editor";
      default: return "role-badge role-user";
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userTableSearch.toLowerCase()) || 
    u.fullName.toLowerCase().includes(userTableSearch.toLowerCase())
  );

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(teamSearchQuery.toLowerCase())
  );

  return (
    <div className="container">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <h1 className="home-title">Панель администратора</h1>
      
      <div className="tabs">
        <button className={`tab glass-btn ${activeTab === "roles" ? "active" : ""}`} onClick={() => setActiveTab("roles")}>Роли</button>
        <button className={`tab glass-btn ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>Пользователи</button>
        <button className={`tab glass-btn ${activeTab === "rating" ? "active" : ""}`} onClick={() => setActiveTab("rating")}>Рейтинг команд</button>
      </div>

      {activeTab === "roles" && (
        <Card className="glass-effect roles">
          <h2 className="section-title">Поиск и назначение ролей</h2>
          <div className="form-group" style={{ position: "relative" }}>
            <label className="text">Поиск пользователя</label>
            <input type="text" placeholder="Начните вводить имя или логин..." value={liveSearchQuery} onChange={e => setLiveSearchQuery(e.target.value)} onKeyDown={handleSearchKeyDown} className="search-input glass-effect" />
            {searchLoading && <small className="text-gray">Поиск...</small>}
            
            {liveSearchResults.length > 0 && (
              <ul className="glass-effect search-dropdown">
                {liveSearchResults.map(u => (
                  <li key={u.id} className="search-dropdown-item" onClick={() => { setFoundUser(u); setLiveSearchResults([]); setLiveSearchQuery(""); }}>
                    <strong>{u.fullName}</strong> <span className="text-gray">@{u.username}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {foundUser && (
            <div className="glass-effect" style={{ padding: "16px", marginTop: "16px" }}>
              <p><strong>{foundUser.fullName}</strong> (@{foundUser.username})</p>
              <p>Текущая роль: {foundUser.role}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => handleUpdateRole("EDITOR")} disabled={updatingRole || foundUser.role === "EDITOR"} className="btn btn-primary glass-effect">Сделать редактором</button>
                <button onClick={() => handleUpdateRole("USER")} disabled={updatingRole || foundUser.role === "USER"} className="btn btn-additional glass-effect">Снять права</button>
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTab === "users" && (
        <Card className="glass-effect">
          <h2 className="section-title">Управление пользователями</h2>
          
          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label>Поиск в списке</label>
            <input 
              type="text" 
              placeholder="Введите имя или логин..." 
              value={userTableSearch} 
              onChange={e => setUserTableSearch(e.target.value)} 
              className="search-input glass-effect" 
            />
          </div>

          {tempPassword && (
            <div className="temp-password-box">
              <p style={{ margin: 0, color: "#065f46", fontWeight: "bold" }}>Временный пароль:</p>
              <div className="temp-password-code">
                <code className="temp-password-value">
                  {tempPasswordVisible ? tempPassword : "••••••••••"}
                </code>
                <button onClick={() => setTempPasswordVisible(!tempPasswordVisible)} className="btn" title="Показать/скрыть">{tempPasswordVisible ? "🙈" : "👁️"}</button>
                <button onClick={() => copyToClipboard(tempPassword)} className="btn" title="Копировать">📋</button>
              </div>
              <p className="temp-password-hint">Сообщите этот пароль пользователю.</p>
              <button onClick={() => { setTempPassword(null); setTempPasswordVisible(false); }} className="btn" style={{ marginTop: "8px", fontSize: "12px" }}>Закрыть</button>
            </div>
          )}

          {loadingUsers ? <p>Загрузка...</p> : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Логин</th>
                    <th>Имя</th>
                    <th>Роль</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td>{user.username}</td>
                        <td>{user.fullName}</td>
                        <td><span className={getRoleClass(user.role)}>{user.role}</span></td>
                        <td>
                          <button 
                            onClick={() => handleResetPassword(user.id)} 
                            disabled={resettingId === user.id} 
                            className="btn btn-reset-pass glass-effect"
                          >
                            {resettingId === user.id ? "Сброс..." : "Сбросить пароль"}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
                        Пользователи не найдены
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === "rating" && (
        <Card className="glass-effect">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <h2 className="section-title" style={{ margin: 0 }}>Рейтинг команд</h2>
            <button 
              className="btn btn-primary glass-effect" 
              onClick={saveAllRatings}
              disabled={savingRatings || Object.keys(editedRatings).length === 0}
              style={{ minWidth: "200px", padding: "10px 20px" }}
            >
              {savingRatings ? "Сохранение..." : `Сохранить (${Object.keys(editedRatings).length})`}
            </button>
          </div>

          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label>Поиск команды</label>
            <input 
              type="text" 
              placeholder="Введите название команды..." 
              value={teamSearchQuery} 
              onChange={e => setTeamSearchQuery(e.target.value)} 
              className="search-input glass-effect" 
            />
          </div>

          <div className="form-group">
            <label>Управление рейтингом команд</label>
            <div className="teams-rating-list">
              {filteredTeams.length === 0 ? (
                <div className="no-teams">
                  {teams.length === 0 ? "Команды не найдены" : "Команды не найдены по запросу"}
                </div>
              ) : (
                filteredTeams.map(team => {
                  const currentRating = editedRatings[team.id] ?? (team.rating || 1500);
                  const isChanged = editedRatings[team.id] !== undefined;
                  
                  return (
                    <div key={team.id} className="team-rating-item glass-effect">
                      <div className="team-info">
                        {team.logoUrl ? (
                          <img src={team.logoUrl} alt={team.name} className="team-logo-small" />
                        ) : (
                          <div className="team-logo-placeholder">
                            {team.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="team-name-text">{team.name}</span>
                      </div>
                      
                      <div className="rating-control">
                        {/* Кнопка МИНУС */}
                        <button 
                          type="button"
                          className="rating-btn rating-btn-minus"
                          onClick={() => updateTeamRating(team.id, currentRating - 1)}
                          title="Уменьшить на 1"
                        >
                          −
                        </button>
                        
                        {/* Поле ввода и бейдж "Изменено" */}
                        <div className="rating-value-wrapper">
                          <input 
                            type="number"
                            value={currentRating}
                            onChange={(e) => updateTeamRating(team.id, Number(e.target.value))}
                            className={`rating-input glass-effect ${isChanged ? 'changed' : ''}`}
                            placeholder="1500"
                          />
                          {isChanged && (
                            <span className="rating-changed-badge">Изменено</span>
                          )}
                        </div>
                        
                        {/* Кнопка ПЛЮС */}
                        <button 
                          type="button"
                          className="rating-btn rating-btn-plus"
                          onClick={() => updateTeamRating(team.id, currentRating + 1)}
                          title="Увеличить на 1"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}