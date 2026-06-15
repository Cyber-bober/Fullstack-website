// src/app/support/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  
  const [formData, setFormData] = useState({ subject: "", text: "" });
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [isNewTicketMode, setIsNewTicketMode] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Загрузка списка тикетов
  const loadTickets = async () => {
    try {
      const res = await fetch("/api/support/tickets");
      if (res.ok) {
        const data = await res.json();
        console.log("📥 Список тикетов:", data);
        setTickets(data);
      }
    } catch (e) { console.error(e); }
  };

  // Загрузка сообщений конкретного тикета
  const loadMessages = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/messages`);
      if (res.ok) {
        const data = await res.json();
        console.log(`📥 Сообщения для тикета ${ticketId}:`, data);
        
        // Обработка разных форматов ответа от API
        let msgs = [];
        if (Array.isArray(data)) {
          msgs = data;
        } else if (data.messages && Array.isArray(data.messages)) {
          msgs = data.messages;
        }
        
        setActiveTicket((prev: any) => prev ? { ...prev, messages: msgs } : null);
      }
    } catch (e) { console.error(e); }
  };

  // Инициализация
  useEffect(() => {
    loadTickets();
  }, []);

  // Автообновление сообщений (Polling) каждые 3 секунды
  useEffect(() => {
    if (!activeTicket?.id) return;
    
    const interval = setInterval(() => {
      loadMessages(activeTicket.id);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeTicket?.id]);

  // Прокрутка вниз
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeTicket?.messages?.length]);

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
        setIsNewTicketMode(false);
        await loadTickets();
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
        await loadMessages(activeTicket.id); 
      } else {
        const err = await res.json();
        setToast({ msg: err.error || "Ошибка отправки", type: "error" });
      }
    } catch {
      setToast({ msg: "Ошибка сети", type: "error" });
    } finally { 
      setSending(false); 
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      
      <h1 className="home-title">Центр поддержки</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', minHeight: '600px' }}>
        {/* Левая колонка: Список тикетов */}
        <Card style={{ padding: 0, overflow: 'hidden', height: 'fit-content' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Мои обращения</h3>
            <button onClick={() => setIsNewTicketMode(!isNewTicketMode)} className="btn btn-primary" style={{ fontSize: '12px', padding: '4px 8px' }}>
              {isNewTicketMode ? "Назад" : "+ Новое"}
            </button>
          </div>

          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {isNewTicketMode ? (
              <form onSubmit={handleCreateTicket} style={{ padding: '16px' }}>
                <div className="form-group">
                  <label>Тема</label>
                  <input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required minLength={5} maxLength={100} />
                </div>
                <div className="form-group">
                  <label>Описание (мин. 50 симв.)</label>
                  <textarea value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})} required minLength={50} maxLength={2000} rows={4} />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={sending}>
                  {sending ? "Отправка..." : "Создать"}
                </button>
              </form>
            ) : (
              tickets.length > 0 ? (
                tickets.map((t: any) => (
                  <div 
                    key={t.id} 
                    onClick={() => { setActiveTicket(t); loadMessages(t.id); }} 
                    className={`support-ticket-item ${activeTicket?.id === t.id ? 'active' : ''}`}
                    style={{ padding: '16px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{t.subject}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: '4px' }}>
                      {t.messages && t.messages[0] ? t.messages[0].text?.substring(0, 40) + '...' : 'Нет сообщений'}
                    </div>
                    <div style={{ fontSize: "11px", color: "#9ca3af", display: 'flex', justifyContent: 'space-between' }}>
                      <span>{new Date(t.updatedAt).toLocaleDateString()}</span>
                      <span style={{ background: t.status === 'OPEN' ? '#dbeafe' : '#d1fae5', color: t.status === 'OPEN' ? '#2563eb' : '#059669', padding: '2px 6px', borderRadius: '8px' }}>
                        {t.status === 'OPEN' ? 'Открыт' : 'В работе'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
                  Нет обращений
                </div>
              )
            )}
          </div>
        </Card>

        {/* Правая колонка: Чат */}
        <Card style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          {activeTicket ? (
            <>
              <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <strong style={{ fontSize: '18px' }}>{activeTicket.subject}</strong>
                <span style={{ marginLeft: "12px", fontSize: "12px", padding: "4px 10px", borderRadius: "12px", background: activeTicket.status === "OPEN" ? "#dbeafe" : "#d1fae5", color: activeTicket.status === "OPEN" ? "#2563eb" : "#059669" }}>
                  {activeTicket.status === "OPEN" ? "Открыт" : "В работе"}
                </span>
              </div>
              
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: '#fff' }}>
                {/* ✅ БЕЗОПАСНЫЙ РЕНДЕР СООБЩЕНИЙ */}
                {Array.isArray(activeTicket.messages) && activeTicket.messages.length > 0 ? (
                  activeTicket.messages.map((msg: any, idx: number) => {
                    // Проверка структуры сообщения
                    const isMe = msg.senderId === "me" || msg.isAdmin === false; 
                    
                    return (
                      <div key={msg.id || idx} style={{ 
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                        padding: '12px 16px',
                        borderRadius: '16px',
                        background: isMe ? '#0160ce' : '#f3f4f6',
                        color: isMe ? 'white' : '#1a1a1a',
                        borderBottomRightRadius: isMe ? '4px' : '16px',
                        borderBottomLeftRadius: isMe ? '16px' : '4px'
                      }}>
                        <p style={{ margin: "0 0 4px", fontSize: "14px", lineHeight: '1.4' }}>{msg.text || msg.content}</p>
                        <small style={{ opacity: 0.7, fontSize: "11px", display: 'block', textAlign: 'right' }}>
                          {msg.sender?.fullName || msg.author?.fullName || "Пользователь"} • {new Date(msg.createdAt || msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </small>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '20px' }}>
                    История сообщений пуста
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendReply} style={{ padding: '16px', borderTop: '1px solid #e5e7eb', display: "flex", gap: "12px", background: '#f9fafb' }}>
                <input 
                  value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder="Написать сообщение..." required
                  style={{ flex: 1, padding: "12px", borderRadius: "24px", border: "1px solid #e5e7eb", outline: 'none' }}
                />
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '24px', padding: '0 24px' }} disabled={sending}>
                  {sending ? "..." : "Отправить"}
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '48px' }}>💬</span>
              <p>Выберите обращение слева или создайте новое</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}