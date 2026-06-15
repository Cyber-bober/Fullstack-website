// src/app/admin/page.tsx

"use client";
import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";

type User = { id: string; username: string; fullName: string; role: string; createdAt: string };

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"roles" | "users" | "support">("users");
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

  // Поддержка
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [adminReply, setAdminReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (activeTab === "support") loadSupportTickets();
  }, [activeTab]);

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

  const loadSupportTickets = async () => {
    try {
      const res = await fetch("/api/support/tickets");
      if (res.ok) setSupportTickets(await res.json());
    } catch {}
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

  const handleAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !adminReply.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: adminReply }),
      });
      if (res.ok) {
        setAdminReply("");
        const tRes = await fetch(`/api/support/tickets/${selectedTicket.id}`);
        if (tRes.ok) setSelectedTicket(await tRes.json());
        loadSupportTickets();
        setToast({ msg: "Ответ отправлен!", type: "success" });
      } else {
        const err = await res.json();
        setToast({ msg: err.error || "Ошибка отправки", type: "error" });
      }
    } catch {
      setToast({ msg: "Ошибка сети", type: "error" });
    } finally { setSendingReply(false); }
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
        <button className={`tab glass-btn ${activeTab === "support" ? "active" : ""}`} onClick={() => setActiveTab("support")}>
          Поддержка ({supportTickets.filter(t => t.status === "OPEN").length})
        </button>
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

      {activeTab === "support" && (
        <Card className="glass-effect">
          <h2 className="section-title">Обращения в поддержку</h2>
          <div className="support-layout">
            {/* Список тикетов */}
            <div className="support-ticket-list">
              {supportTickets.map((t: any) => (
                <div 
                  key={t.id} 
                  onClick={() => setSelectedTicket(t)}
                  className={`support-ticket-item ${selectedTicket?.id === t.id ? "active" : ""}`}
                  style={{ border: `1px solid ${t.status === "OPEN" ? "#bfdbfe" : "#e5e7eb"}` }}
                >
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>{t.subject}</div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>{t.user.fullName} (@{t.user.username})</div>
                  <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
                    {new Date(t.updatedAt).toLocaleString()} • {t._count.messages} сообщ.
                  </div>
                </div>
              ))}
              {supportTickets.length === 0 && <p className="text-gray">Нет обращений</p>}
            </div>

            {/* Детали тикета */}
            {selectedTicket ? (
              <div className="support-chat-area">
                <div style={{ padding: "12px", background: "#f9fafb", borderRadius: "8px", marginBottom: "16px" }}>
                  <strong>{selectedTicket.subject}</strong>
                  <span style={{ marginLeft: "8px", fontSize: "12px", padding: "2px 8px", borderRadius: "12px", background: selectedTicket.status === "OPEN" ? "#dbeafe" : "#d1fae5", color: selectedTicket.status === "OPEN" ? "#2563eb" : "#059669" }}>
                    {selectedTicket.status === "OPEN" ? "Открыт" : "В работе"}
                  </span>
                </div>

                <div className="support-messages-container">
                  {selectedTicket.messages?.map((msg: any) => (
                    <div key={msg.id} className={`support-message ${msg.isAdmin ? "support-message-admin" : "support-message-user"}`}>
                      <p style={{ margin: "0 0 4px", fontSize: "13px" }}>{msg.text}</p>
                      <small style={{ opacity: 0.7, fontSize: "11px" }}>{msg.sender.fullName} • {new Date(msg.createdAt).toLocaleTimeString()}</small>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAdminReply} style={{ display: "flex", gap: "8px" }}>
                  <input 
                    value={adminReply} onChange={e => setAdminReply(e.target.value)}
                    placeholder="Ответить пользователю..." required
                    style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                  />
                  <button type="submit" className="btn btn-primary" disabled={sendingReply}>
                    {sendingReply ? "..." : "Отправить"}
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                Выберите обращение слева
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}