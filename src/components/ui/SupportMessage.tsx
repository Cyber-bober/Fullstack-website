// src/components/ui/SupportWidget.tsx
"use client";
import { useState, useEffect } from "react";
import Toast from "@/components/ui/Toast";

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  
  const [formData, setFormData] = useState({ subject: "", text: "" });
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen && !activeTicket) loadTickets();
  }, [isOpen, activeTicket]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support/tickets");
      if (res.ok) setTickets(await res.json());
    } catch {} finally { setLoading(false); }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ msg: "Обращение создано!", type: "success" });
        setFormData({ subject: "", text: "" });
        loadTickets();
      } else {
        setToast({ msg: data.error, type: "error" });
      }
    } catch {
      setToast({ msg: "Ошибка сети", type: "error" });
    } finally { setSending(false); }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/support/tickets/${activeTicket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText }),
      });
      if (res.ok) {
        setReplyText("");
        const tRes = await fetch(`/api/support/tickets/${activeTicket.id}`);
        if (tRes.ok) setActiveTicket(await tRes.json());
      }
    } catch {} finally { setSending(false); }
  };

  if (!isOpen) {
    return (
      <button className="support-widget-btn" onClick={() => setIsOpen(true)} title="Поддержка">
        💬
      </button>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="support-widget-panel">
        <div className="support-header">
          <h3 style={{ margin: 0 }}>{activeTicket ? "Чат поддержки" : "Поддержка"}</h3>
          <button onClick={() => { setIsOpen(false); setActiveTicket(null); }} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>×</button>
        </div>

        <div className="support-body">
          {loading ? <p>Загрузка...</p> : activeTicket ? (
            <>
              <div style={{ marginBottom: "16px", padding: "12px", background: "#f9fafb", borderRadius: "8px" }}>
                <strong>{activeTicket.subject}</strong>
                <span style={{ marginLeft: "8px", fontSize: "12px", padding: "2px 8px", borderRadius: "12px", background: activeTicket.status === "OPEN" ? "#dbeafe" : "#d1fae5", color: activeTicket.status === "OPEN" ? "#2563eb" : "#059669" }}>
                  {activeTicket.status === "OPEN" ? "Открыт" : "В работе"}
                </span>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", marginBottom: "16px" }}>
                {activeTicket.messages?.map((msg: any) => (
                  <div key={msg.id} className={`support-message ${msg.senderId === activeTicket.userId ? "support-message-user" : "support-message-admin"}`}>
                    <p style={{ margin: "0 0 4px", fontSize: "13px" }}>{msg.text}</p>
                    <small style={{ opacity: 0.7, fontSize: "11px" }}>{msg.sender.fullName} • {new Date(msg.createdAt).toLocaleTimeString()}</small>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendReply} style={{ display: "flex", gap: "8px" }}>
                <input 
                  value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder="Написать ответ..." required
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                />
                <button type="submit" className="btn btn-primary" disabled={sending}>➤</button>
              </form>
            </>
          ) : (
            tickets.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {tickets.map((t: any) => (
                  <div key={t.id} onClick={() => setActiveTicket(t)} className="support-ticket-item" style={{ border: "1px solid #e5e7eb" }}>
                    <div style={{ fontWeight: 600 }}>{t.subject}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                      {t.messages[0]?.text?.substring(0, 50)}...
                    </div>
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
                      {new Date(t.updatedAt).toLocaleDateString()} • {t._count.messages} сообщ.
                    </div>
                  </div>
                ))}
                <button onClick={() => setActiveTicket({ isNew: true })} className="btn btn-primary" style={{ marginTop: "8px" }}>
                  + Новое обращение
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateTicket}>
                <div className="form-group">
                  <label>Тема</label>
                  <input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required minLength={5} maxLength={100} />
                </div>
                <div className="form-group">
                  <label>Описание проблемы (мин. 50 симв.)</label>
                  <textarea value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})} required minLength={50} maxLength={2000} rows={4} />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={sending}>
                  {sending ? "Отправка..." : "Отправить"}
                </button>
              </form>
            )
          )}
        </div>
      </div>
    </>
  );
}