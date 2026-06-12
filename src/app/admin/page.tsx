// src/app/admin/page.tsx

"use client";
import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"matches" | "roles">("matches");
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  
  // Состояния для матчей
  const [homeTeams, setHomeTeams] = useState<any[]>([]);
  const [awayTeams, setAwayTeams] = useState<any[]>([]);
  const [matchData, setMatchData] = useState({ 
    homeTeamId: "", 
    awayTeamId: "", 
    date: "", 
    venue: "" 
  });
  const [creating, setCreating] = useState(false);

  // Состояния для ролей
  const [searchUser, setSearchUser] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [updatingRole, setUpdatingRole] = useState(false);

  useEffect(() => {
    fetch("/api/teams")
      .then(res => res.json())
      .then(data => {
        setHomeTeams(data.data || []);
        setAwayTeams(data.data || []);
      });
  }, []);

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchData.homeTeamId || !matchData.awayTeamId || !matchData.date) {
      setToast({ msg: "Заполните все обязательные поля", type: "error" });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(matchData),
      });
      if (res.ok) {
        setToast({ msg: "Матч успешно добавлен в календарь!", type: "success" });
        setMatchData({ homeTeamId: "", awayTeamId: "", date: "", venue: "" });
      } else {
        const err = await res.json();
        setToast({ msg: err.error || "Ошибка создания", type: "error" });
      }
    } catch {
      setToast({ msg: "Ошибка сети", type: "error" });
    } finally {
      setCreating(false);
    }
  };

  const handleSearchUser = async () => {
    if (!searchUser.trim()) return;
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchUser)}`);
      if (res.ok) {
        const users = await res.json();
        setFoundUser(users[0] || null);
        // ИСПРАВЛЕНИЕ: тип "info" заменен на "error"
        if (!users.length) setToast({ msg: "Пользователь не найден", type: "error" });
      }
    } catch {
      setToast({ msg: "Ошибка поиска", type: "error" });
    }
  };

  const handleUpdateRole = async (newRole: string) => {
    if (!foundUser) return;
    setUpdatingRole(true);
    try {
      const res = await fetch(`/api/users/${foundUser.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setToast({ msg: `Роль изменена на ${newRole}`, type: "success" });
        setFoundUser({ ...foundUser, role: newRole });
      } else {
        setToast({ msg: "Не удалось изменить роль", type: "error" });
      }
    } catch {
      setToast({ msg: "Ошибка сети", type: "error" });
    } finally {
      setUpdatingRole(false);
    }
  };

  return (
    <div className="container">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      
      <h1 className="home-title">Панель администратора</h1>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === "matches" ? "active" : ""}`} 
          onClick={() => setActiveTab("matches")}
        >
          Управление матчами
        </button>
        <button 
          className={`tab ${activeTab === "roles" ? "active" : ""}`} 
          onClick={() => setActiveTab("roles")}
        >
          Назначение ролей
        </button>
      </div>

      {activeTab === "matches" && (
        <Card>
          <h2 className="section-title">Добавить новый матч</h2>
          <form onSubmit={handleCreateMatch} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label>Хозяева</label>
                <select 
                  value={matchData.homeTeamId} 
                  onChange={e => setMatchData({...matchData, homeTeamId: e.target.value})}
                  required
                >
                  <option value="">Выберите команду</option>
                  {homeTeams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Гости</label>
                <select 
                  value={matchData.awayTeamId} 
                  onChange={e => setMatchData({...matchData, awayTeamId: e.target.value})}
                  required
                >
                  <option value="">Выберите команду</option>
                  {awayTeams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>Дата и время</label>
              <input 
                type="datetime-local" 
                value={matchData.date}
                onChange={e => setMatchData({...matchData, date: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Место проведения (необязательно)</label>
              <input 
                type="text" 
                value={matchData.venue}
                onChange={e => setMatchData({...matchData, venue: e.target.value})}
                placeholder="Название стадиона"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? "Создание..." : "Добавить в календарь"}
            </button>
          </form>
        </Card>
      )}

      {activeTab === "roles" && (
        <Card>
          <h2 className="section-title">Поиск и назначение ролей</h2>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Введите username или имя..." 
              value={searchUser}
              onChange={e => setSearchUser(e.target.value)}
              className="search-input"
            />
            <button onClick={handleSearchUser} className="btn btn-primary">Найти</button>
          </div>

          {foundUser && (
            <div style={{ padding: "16px", background: "#f9fafb", borderRadius: "8px" }}>
              <p><strong>{foundUser.fullName}</strong> (@{foundUser.username})</p>
              <p>Текущая роль: <span style={{ color: foundUser.role === "ADMIN" ? "#ef4444" : "#3b82f6" }}>{foundUser.role}</span></p>
              
              <div className="flex gap-2 mt-3">
                <button 
                  onClick={() => handleUpdateRole("EDITOR")} 
                  disabled={updatingRole || foundUser.role === "EDITOR"}
                  className="btn"
                  style={{ background: "#3b82f6", color: "white" }}
                >
                  Сделать редактором
                </button>
                <button 
                  onClick={() => handleUpdateRole("USER")} 
                  disabled={updatingRole || foundUser.role === "USER"}
                  className="btn"
                  style={{ background: "#6b7280", color: "white" }}
                >
                  Снять права
                </button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}