// src/app/admin/page.tsx

"use client";
import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";

type User = { id: string; username: string; fullName: string; role: string; createdAt: string };

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"roles" | "users">("users");
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  
  // Живой поиск для ролей
  const [liveSearchQuery, setLiveSearchQuery] = useState("");
  const [liveSearchResults, setLiveSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);

  // Поиск для таблицы пользователей
  const [userTableSearch, setUserTableSearch] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [tempPasswordVisible, setTempPasswordVisible] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  // Debounce для поиска ролей
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

  const getRoleClass = (role: string) => {
    switch(role) {
      case "ADMIN": return "role-badge role-admin";
      case "EDITOR": return "role-badge role-editor";
      default: return "role-badge role-user";
    }
  };

  // Фильтрация пользователей для таблицы
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userTableSearch.toLowerCase()) || 
    u.fullName.toLowerCase().includes(userTableSearch.toLowerCase())
  );

  return (
    <div className="container">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <h1 className="home-title">Панель администратора</h1>
      
      <div className="tabs">
        <button className={`tab glass-btn ${activeTab === "roles" ? "active" : ""}`} onClick={() => setActiveTab("roles")}>Роли</button>
        <button className={`tab glass-btn ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>Пользователи</button>
      </div>

      {activeTab === "roles" && (
        <Card className="glass-effect">
          <h2 className="section-title">Поиск и назначение ролей</h2>
          <div className="form-group" style={{ position: "relative" }}>
            <label className="text">Поиск пользователя</label>
            <input type="text" placeholder="Начните вводить имя или логин..." value={liveSearchQuery} onChange={e => setLiveSearchQuery(e.target.value)} onKeyDown={handleSearchKeyDown} className="search-input glass-effect" />
            {searchLoading && <small className="text-gray">Поиск...</small>}
            
            {liveSearchResults.length > 0 && (
              <ul className="search-dropdown">
                {liveSearchResults.map(u => (
                  <li key={u.id} className="search-dropdown-item" onClick={() => { setFoundUser(u); setLiveSearchResults([]); setLiveSearchQuery(""); }}>
                    <strong>{u.fullName}</strong> <span className="text-gray">@{u.username}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {foundUser && (
            <div style={{ padding: "16px", background: "#f9fafb", borderRadius: "8px", marginTop: "16px" }}>
              <p><strong>{foundUser.fullName}</strong> (@{foundUser.username})</p>
              <p>Текущая роль: {foundUser.role}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => handleUpdateRole("EDITOR")} disabled={updatingRole || foundUser.role === "EDITOR"} className="btn" style={{ background: "#3b82f6", color: "white" }}>Сделать редактором</button>
                <button onClick={() => handleUpdateRole("USER")} disabled={updatingRole || foundUser.role === "USER"} className="btn" style={{ background: "#6b7280", color: "white" }}>Снять права</button>
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
                            className="btn btn-reset-pass"
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
    </div>
  );
}