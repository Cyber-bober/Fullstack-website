// src/components/admin/UserManagementPanel.tsx
"use client";
import { useState, useEffect } from "react";
import Toast from "@/components/ui/Toast";

type User = { id: string; username: string; fullName: string; role: string; createdAt: string };

export default function UserManagementPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(() => setToast({ msg: "Ошибка загрузки", type: "error" }))
      .finally(() => setLoading(false));
  }, []);

  const handleResetPassword = async (userId: string, username: string) => {
    if (!confirm(`Сбросить пароль для ${username}? Ему будет отправлено письмо.`)) return;
    setResettingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: "POST" });
      if (res.ok) {
        setToast({ msg: `Инструкция отправлена на ${username}`, type: "success" });
      } else {
        setToast({ msg: "Ошибка сброса", type: "error" });
      }
    } catch {
      setToast({ msg: "Ошибка сети", type: "error" });
    } finally {
      setResettingId(null);
    }
  };

  if (loading) return <p>Загрузка...</p>;

  return (
    <>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
            <th style={{ textAlign: "left", padding: "8px" }}>Username</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Имя</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Роль</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={{ padding: "8px" }}>{user.username}</td>
              <td style={{ padding: "8px" }}>{user.fullName}</td>
              <td style={{ padding: "8px" }}>
                <span style={{ 
                  padding: "2px 8px", 
                  borderRadius: "12px", 
                  fontSize: "12px",
                  background: user.role === "ADMIN" ? "#fee2e2" : user.role === "EDITOR" ? "#dbeafe" : "#f3f4f6",
                  color: user.role === "ADMIN" ? "#dc2626" : user.role === "EDITOR" ? "#2563eb" : "#4b5563"
                }}>
                  {user.role}
                </span>
              </td>
              <td style={{ padding: "8px" }}>
                <button 
                  onClick={() => handleResetPassword(user.id, user.username)}
                  disabled={resettingId === user.id}
                  className="btn"
                  style={{ fontSize: "12px", padding: "4px 8px" }}
                >
                  {resettingId === user.id ? "..." : "Сбросить пароль"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}