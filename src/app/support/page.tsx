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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null); // ✅ Роль пользователя
  
  const [formData, setFormData] = useState({ subject: "", text: "" });
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [isNewTicketMode, setIsNewTicketMode] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Инициализация: получаем сессию и загружаем тикеты
  useEffect(() => {
    const init = async () => {
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const session = await sessionRes.json();
          setCurrentUserId(session?.user?.id);
          setUserRole(session?.user?.role); // ✅ Сохраняем роль для проверки прав
        }
      } catch {}
      loadTickets();
    };
    init();
  }, []);

  const loadTickets = async () => {
    try {
      const res = await fetch("/api/support/tickets");
      if (res.ok) setTickets(await res.json());
    } catch {}
  };

  const loadMessages = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/messages`);
      if (res.ok) {
        const data = await res.json();
        let msgs = Array.isArray(data) ? data : (data.messages || []);
        setActiveTicket((prev: any) => prev ? { ...prev, messages: msgs } : null);
      }
    } catch {}
  };

  // Автообновление сообщений каждые 3 секунды
  useEffect(() => {
    if (!activeTicket?.id) return;
    const interval = setInterval(() => loadMessages(activeTicket.id), 3000);
    return () => clearInterval(interval);
  }, [activeTicket?.id]);

  // Прокрутка вниз при новых сообщениях
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
      if (res.ok) {
        setToast({ msg: "Обращение создано!", type: "success" });
        setFormData({ subject: "", text: "" });
        setIsNewTicketMode(false);
        await loadTickets();
      } else {
        const err = await res.json();
        setToast({ msg: err.error, type: "error" });
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

  // Изменение статуса тикета
  const handleChangeStatus = async (newStatus: string) => {
    if (!activeTicket) return;
    try {
      const res = await fetch(`/api/support/tickets/${activeTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setActiveTicket((prev: any) => ({ ...prev, status: newStatus }));
        await loadTickets();
        setToast({ msg: `Статус изменен на: ${newStatus === 'IN_PROGRESS' ? 'В работе' : 'Закрыт'}`, type: "success" });
      } else {
        const err = await res.json();
        setToast({ msg: err.error || "Ошибка изменения статуса", type: "error" });
      }
    } catch {
      setToast({ msg: "Ошибка сети", type: "error" });
    }
  };

  // Вспомогательная функция для стилей статуса
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'OPEN': return { bg: '#dbeafe', text: '#2563eb', label: 'Открыт' };
      case 'IN_PROGRESS': return { bg: '#d1fae5', text: '#059669', label: 'В работе' };
      case 'CLOSED': return { bg: '#fee2e2', text: '#dc2626', label: 'Закрыт' };
      default: return { bg: '#f3f4f6', text: '#6b7280', label: status };
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1200px', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      
      <h1 className="home-title" style={{ marginBottom: '20px' }}>Центр поддержки</h1>

      {/* Основной контейнер с двумя колонками */}
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px', flex: 1, minHeight: 0 }}>
        
        {/* ЛЕВАЯ КОЛОНКА: Список тикетов */}
        <Card style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Мои обращения</h3>
            {/* Кнопка создания тикета скрыта для админов */}
            {userRole !== 'ADMIN' && (
              <button onClick={() => setIsNewTicketMode(!isNewTicketMode)} className="btn btn-primary" style={{ fontSize: '12px', padding: '4px 8px' }}>
                {isNewTicketMode ? "Назад" : "+ Новое"}
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
            {isNewTicketMode ? (
              <form onSubmit={handleCreateTicket} style={{ padding: '16px' }}>
                <div className="form-group">
                  <label>Тема</label>
                  <input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required minLength={5} maxLength={100} />
                </div>
                <div className="form-group">
                  <label>Описание</label>
                  <textarea value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})} required minLength={10} rows={4} />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={sending}>Создать</button>
              </form>
            ) : (
              tickets.length > 0 ? (
                tickets.map((t: any) => {
                  const statusStyle = getStatusColor(t.status);
                  return (
                    <div 
                      key={t.id} 
                      onClick={() => { setActiveTicket(t); loadMessages(t.id); }} 
                      className={`support-ticket-item ${activeTicket?.id === t.id ? 'active' : ''}`}
                      style={{ padding: '16px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', background: activeTicket?.id === t.id ? '#f0f9ff' : 'transparent' }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{t.subject}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.messages && t.messages[0] ? t.messages[0].text?.substring(0, 40) + '...' : 'Нет сообщений'}
                      </div>
                      <div style={{ fontSize: "11px", color: "#9ca3af", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{new Date(t.updatedAt).toLocaleDateString()}</span>
                        <span style={{ 
                          background: statusStyle.bg, 
                          color: statusStyle.text, 
                          padding: '2px 8px', borderRadius: '12px', fontWeight: 500 
                        }}>
                          {statusStyle.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>Нет обращений</div>
              )
            )}
          </div>
        </Card>

        {/* ПРАВАЯ КОЛОНКА: Чат */}
        <Card style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', height: '100%' }}>
          {activeTicket ? (
            <>
              {/* Шапка чата */}
              <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '18px' }}>{activeTicket.subject}</strong>
                  <span style={{ marginLeft: "12px", fontSize: "12px", padding: "4px 10px", borderRadius: "12px", ...getStatusColor(activeTicket.status) }}>
                    {getStatusColor(activeTicket.status).label}
                  </span>
                </div>
                
                {/* ✅ УПРАВЛЕНИЕ СТАТУСОМ (ТОЛЬКО ДЛЯ АДМИНОВ) */}
                {userRole === 'ADMIN' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {activeTicket.status === 'OPEN' && (
                      <button onClick={() => handleChangeStatus('IN_PROGRESS')} className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 12px' }}>
                        Взять в работу
                      </button>
                    )}
                    {activeTicket.status !== 'CLOSED' && (
                      <button onClick={() => handleChangeStatus('CLOSED')} className="btn btn-danger" style={{ fontSize: '12px', padding: '4px 12px' }}>
                        Закрыть тикет
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Область сообщений с независимой прокруткой */}
              <div style={{ 
                flex: 1, 
                padding: '20px', 
                overflowY: 'auto', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px', 
                background: '#fff',
                minHeight: 0 
              }}>
                {Array.isArray(activeTicket.messages) && activeTicket.messages.map((msg: any, idx: number) => {
                  // Твои сообщения справа (синие), чужие слева (серые)
                  const isMe = msg.senderId === currentUserId;
                  
                  return (
                    <div key={msg.id || idx} style={{ 
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      background: isMe ? '#0160ce' : '#f3f4f6',
                      color: isMe ? 'white' : '#1a1a1a',
                      borderBottomRightRadius: isMe ? '4px' : '16px',
                      borderBottomLeftRadius: isMe ? '16px' : '4px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                      <p style={{ margin: "0 0 4px", fontSize: "14px", lineHeight: '1.4', wordBreak: 'break-word' }}>
                        {msg.text || msg.content}
                      </p>
                      <small style={{ opacity: 0.7, fontSize: "11px", display: 'block', textAlign: 'right' }}>
                        {msg.sender?.fullName || "Пользователь"} • {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </small>
                    </div>
                  );
                })}
                
                {(!activeTicket.messages || activeTicket.messages.length === 0) && (
                  <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '40px' }}>
                    История сообщений пуста
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Форма отправки */}
              <form onSubmit={handleSendReply} style={{ padding: '16px', borderTop: '1px solid #e5e7eb', display: "flex", gap: "12px", background: '#f9fafb' }}>
                <input 
                  value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder="Написать сообщение..." required
                  style={{ flex: 1, padding: "12px 16px", borderRadius: "24px", border: "1px solid #e5e7eb", outline: 'none', fontSize: '14px' }}
                />
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '24px', padding: '0 24px', fontWeight: 600 }} disabled={sending}>
                  {sending ? "..." : "Отправить"}
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '64px' }}>💬</span>
              <p style={{ fontSize: '18px', fontWeight: 500 }}>Выберите обращение слева</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}