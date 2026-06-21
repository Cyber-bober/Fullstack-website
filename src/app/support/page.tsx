"use client";
import { useState, useEffect, useRef } from "react";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ subject: "", text: "" });
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [isNewTicketMode, setIsNewTicketMode] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const session = await sessionRes.json();
          setCurrentUserId(session?.user?.id);
          setUserRole(session?.user?.role);
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

  useEffect(() => {
    if (!activeTicket?.id) return;
    const interval = setInterval(() => loadMessages(activeTicket.id), 3000);
    return () => clearInterval(interval);
  }, [activeTicket?.id]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setToast({ msg: "Обращение создано!", type: "success" });
        setFormData({ subject: "", text: "" });
        setIsNewTicketMode(false);
        await loadTickets();
      } else {
        setToast({ msg: (await res.json()).error, type: "error" });
      }
    } catch { setToast({ msg: "Ошибка сети", type: "error" }); }
    finally { setSending(false); }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/support/tickets/${activeTicket.id}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText }),
      });
      if (res.ok) {
        setReplyText("");
        await loadMessages(activeTicket.id);
      } else {
        setToast({ msg: (await res.json()).error || "Ошибка", type: "error" });
      }
    } catch { setToast({ msg: "Ошибка сети", type: "error" }); }
    finally { setSending(false); }
  };

  const handleChangeStatus = async (newStatus: string) => {
    if (!activeTicket) return;
    try {
      const res = await fetch(`/api/support/tickets/${activeTicket.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setActiveTicket((prev: any) => ({ ...prev, status: newStatus }));
        await loadTickets();
        setToast({ msg: "Статус изменен", type: "success" });
      } else {
        setToast({ msg: (await res.json()).error || "Ошибка", type: "error" });
      }
    } catch { setToast({ msg: "Ошибка сети", type: "error" }); }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'OPEN': return { bg: '#dbeafe', text: '#2563eb', label: 'Открыт' };
      case 'IN_PROGRESS': return { bg: '#d1fae5', text: '#059669', label: 'В работе' };
      case 'CLOSED': return { bg: '#fee2e2', text: '#dc2626', label: 'Закрыт' };
      default: return { bg: '#f3f4f6', text: '#6b7280', label: status };
    }
  };

  return (
    <div className="container support">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="support-main">
        <Card className="support-left">
          <div className="support-left-header glass-effect">
            <h3 style={{ margin: 0 }}>{userRole === 'ADMIN' ? 'Обращения в поддержку' : 'Мои обращения'}</h3>
            {userRole !== 'ADMIN' && (
              <button onClick={() => setIsNewTicketMode(!isNewTicketMode)} className="btn btn-primary glass-effect" style={{ padding: '4px 8px' }}>
                {isNewTicketMode ? "Назад" : "Новое"}
              </button>
            )}
          </div>

          <div className="glass-effect support-ticket-list">
            {isNewTicketMode ? (
              <form onSubmit={handleCreateTicket} style={{ padding: '16px' }}>
                <div className="form-group"><label>Тема</label><input className="glass-effect" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required /></div>
                <div className="form-group"><label>Описание</label><textarea className="glass-effect" value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})} required rows={4} /></div>
                <button type="submit" className="btn btn-primary glass-effect w-full" disabled={sending}>Создать</button>
              </form>
            ) : tickets.length > 0 ? (
              tickets.map((t: any) => {
                const s = getStatusColor(t.status);
                return (
                  <div key={t.id} onClick={() => { setActiveTicket(t); loadMessages(t.id); }}
                    className={`support-ticket-item glass-effect ${activeTicket?.id === t.id ? 'active' : ''}`}
                    style={{ padding: '16px', cursor: 'pointer' }}>
                    <div style={{ fontWeight: 600 }}>{t.subject}</div>
                    <div className="support-text">{t.messages?.[0]?.text?.substring(0, 40) || '—'}</div>
                    <div className="support-ticket-item-bottom">
                      <span>{new Date(t.updatedAt).toLocaleDateString()}</span>
                      <span style={{ background: s.bg, color: s.text, padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>{s.label}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Нет обращений</div>
            )}
          </div>
        </Card>

        <Card className="support-right">
          {activeTicket ? (
            <>
              <div className="support-chat-header glass-effect">
                <div>
                  <strong>{activeTicket.subject}</strong>
                  <span style={{ marginLeft: 12, fontSize: 12, padding: '4px 10px', borderRadius: 12, ...getStatusColor(activeTicket.status) }}>
                    {getStatusColor(activeTicket.status).label}
                  </span>
                </div>
                {userRole === 'ADMIN' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {activeTicket.status === 'OPEN' && (
                      <button onClick={() => handleChangeStatus('IN_PROGRESS')} className="btn btn-ticket glass-effect" style={{ fontSize: 12, padding: '4px 12px' }}>Взять в работу</button>
                    )}
                    {activeTicket.status !== 'CLOSED' && (
                      <button onClick={() => handleChangeStatus('CLOSED')} className="btn btn-secondary glass-effect" style={{ fontSize: 12, padding: '4px 12px' }}>Закрыть тикет</button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="support-chat-main glass-effect" ref={chatContainerRef}>
                {(activeTicket.messages || []).map((msg: any, idx: number) => {
                  const isMe = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id || idx} className="support-chat-message" style={{ 
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      background: isMe ? '#0160ce' : '#f3f4f6',
                      color: isMe ? '#fff' : '#1a1a1a',
                      borderRadius: '16px',
                      borderBottomRightRadius: isMe ? 4 : 16,
                      borderBottomLeftRadius: isMe ? 16 : 4,
                      maxWidth: '80%',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-all',
                    }}>
                      <p style={{ margin: 0, fontSize: 14, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{msg.text || msg.content}</p>
                      <small style={{ opacity: 0.7, fontSize: 11, display: 'block', textAlign: 'right' }}>
                        {msg.sender?.fullName || '—'} • {new Date(msg.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </small>
                    </div>
                  );
                })}
                {(!activeTicket.messages || activeTicket.messages.length === 0) && (
                  <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: 40 }}>Нет сообщений</div>
                )}
              </div>

              <form onSubmit={handleSendReply} style={{ display: 'flex', gap: 12 }}>
                <input className="glass-effect" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Сообщение..." required
                  style={{ flex: 1, padding: '12px 16px', fontSize: 14 }} />
                <button type="submit" className="btn btn-primary glass-effect" style={{ padding: '0 24px' }} disabled={sending}>
                  {sending ? '...' : '→'}
                </button>
              </form>
            </>
          ) : (
            <div className="support-placeholder"><p>Выберите обращение слева</p></div>
          )}
        </Card>
      </div>
    </div>
  );
}
