"use client";
import { useState, useEffect } from "react";

interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: { id: string; name: string; logoUrl?: string | null };
  awayTeam: { id: string; name: string; logoUrl?: string | null };
  date: string;
  status: string;
  score?: string | null;
  venue?: string | null;
  stats?: string | null;
}

interface MatchEvent {
  id: string;
  matchId: string;
  minute?: number | null;
  text: string;
  createdAt: string;
}

interface Props {
  matches: Match[];
  userRole: string | null;
  onDeleteMatch?: (id: string) => void;
  deletingId?: string | null;
}

export function LiveSection({ matches, userRole, onDeleteMatch, deletingId }: Props) {
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventText, setEventText] = useState("");
  const [eventMinute, setEventMinute] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canManage = userRole === "ADMIN" || userRole === "EDITOR";

  // Сортировка: LIVE сверху, остальные по дате (новые сверху)
  const sortedMatches = [...matches].sort((a, b) => {
    // LIVE матчи всегда сверху
    if (a.status === "LIVE" && b.status !== "LIVE") return -1;
    if (a.status !== "LIVE" && b.status === "LIVE") return 1;
    
    // Остальные по дате (новые сверху)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  useEffect(() => {
    if (!selectedMatchId) {
      setEvents([]);
      return;
    }

    const loadEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/match-events?matchId=${selectedMatchId}`);
        if (res.ok) {
          const data = await res.json();
          setEvents(Array.isArray(data) ? data : []);
        } else {
          setEvents([]);
        }
      } catch (err) {
        console.error("Ошибка загрузки событий:", err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [selectedMatchId]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId || !eventText.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/match-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: selectedMatchId,
          text: eventText,
          minute: eventMinute ? parseInt(eventMinute) : null,
        }),
      });

      if (res.ok) {
        const newEvent = await res.json();
        setEvents(prev => [newEvent, ...prev]);
        setEventText("");
        setEventMinute("");
        setShowEventForm(false);
      } else {
        const err = await res.json();
        setError(err.error || "Ошибка добавления события");
      }
    } catch (err) {
      setError("Ошибка сети");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Удалить событие?")) return;

    try {
      const res = await fetch(`/api/match-events?eventId=${eventId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== eventId));
      }
    } catch (err) {
      console.error("Ошибка удаления события:", err);
    }
  };

  const selectedMatch = matches.find(m => m.id === selectedMatchId);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "LIVE":
        return <span className="status-badge status-live">LIVE</span>;
      case "SCHEDULED":
        return <span className="status-badge status-scheduled">Запланирован</span>;
      case "FINISHED":
        return <span className="status-badge status-finished">Завершён</span>;
      case "CANCELLED":
        return <span className="status-badge status-cancelled">Отменён</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div className="live-section">
      <div className="section-header">
        <h3 className="section-title" style={{ margin: 0 }}>Текстовая трансляция</h3>
      </div>

      {/* Выбор матча */}
      <div className="match-selector glass-effect" style={{ padding: "16px", marginBottom: "20px" }}>
        <label style={{ 
          display: "block", 
          marginBottom: "8px",
          color: "var(--text-secondary)",
          fontSize: "14px",
          fontWeight: 600
        }}>
          Выберите матч
        </label>
        <select
          className="glass-effect"
          value={selectedMatchId}
          onChange={(e) => setSelectedMatchId(e.target.value)}
          style={{ width: "100%", padding: "12px" }}
        >
          <option value="">-- Выберите матч --</option>
          
          {sortedMatches.map(m => (
            <option key={m.id} value={m.id}>
              {m.status === "LIVE" ? "" : ""}
              {m.homeTeam.name} vs {m.awayTeam.name} — {formatDate(m.date)}
            </option>
          ))}
        </select>
      </div>

      {/* Информация о выбранном матче */}
      {selectedMatch && (
        <div className="glass-effect" style={{ 
          padding: "20px", 
          marginBottom: "20px",
          background: "rgba(59, 130, 246, 0.1)",
          border: "1px solid rgba(59, 130, 246, 0.3)"
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            <div>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "var(--text-primary)" }}>
                {selectedMatch.homeTeam.name} vs {selectedMatch.awayTeam.name}
              </h4>
              <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                {formatDate(selectedMatch.date)}
                {selectedMatch.venue && <> {selectedMatch.venue}</>}
              </div>
              {selectedMatch.score && (
                <div style={{ 
                  fontSize: "24px", 
                  fontWeight: 700, 
                  color: "var(--color-primary)",
                  marginTop: "8px"
                }}>
                  {selectedMatch.score}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {getStatusBadge(selectedMatch.status)}
              {canManage && onDeleteMatch && (
                <button
                  onClick={() => onDeleteMatch(selectedMatch.id)}
                  disabled={deletingId === selectedMatch.id}
                  className="btn btn-danger"
                  style={{ padding: "8px 16px", fontSize: "13px" }}
                >
                  {deletingId === selectedMatch.id ? "Удаление..." : "Удалить"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Кнопка добавления события */}
      {selectedMatch && canManage && (
        <div style={{ marginBottom: "16px" }}>
          <button
            onClick={() => setShowEventForm(!showEventForm)}
            className="btn btn-primary glass-effect"
            style={{ width: "100%", padding: "12px" }}
          >
            {showEventForm ? "✕ Отмена" : "+ Добавить событие"}
          </button>
        </div>
      )}

      {/* Форма добавления события */}
      {showEventForm && selectedMatch && (
        <form onSubmit={handleAddEvent} className="glass-effect" style={{ 
          padding: "20px", 
          marginBottom: "20px" 
        }}>
          {error && (
            <div className="form-error" style={{ marginBottom: "12px" }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Текст события</label>
            <textarea
              value={eventText}
              onChange={(e) => setEventText(e.target.value)}
              placeholder="Гол! Забил Иванов И.И."
              required
              rows={3}
              maxLength={500}
              className="glass-effect"
              style={{ resize: "vertical", minHeight: "80px" }}
            />
            <small style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
              {eventText.length}/500 символов
            </small>
          </div>

          <div className="form-group">
            <label>Минута (необязательно)</label>
            <input
              type="number"
              value={eventMinute}
              onChange={(e) => setEventMinute(e.target.value)}
              placeholder="45"
              min={0}
              max={120}
              className="glass-effect"
            />
          </div>

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => {
                setShowEventForm(false);
                setEventText("");
                setEventMinute("");
                setError("");
              }}
              className="btn btn-secondary glass-effect"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting || !eventText.trim()}
              className="btn btn-primary glass-effect"
            >
              {submitting ? "Добавление..." : "Добавить"}
            </button>
          </div>
        </form>
      )}

      {/* Список событий */}
      {selectedMatch && (
        <div className="events-list">
          {loading ? (
            <p className="empty-text">Загрузка событий...</p>
          ) : events.length === 0 ? (
            <div className="glass-effect" style={{ 
              padding: "40px", 
              textAlign: "center",
              color: "var(--text-tertiary)"
            }}>
              <p style={{ margin: 0 }}>Событий пока нет</p>
              {canManage && (
                <p style={{ margin: "8px 0 0 0", fontSize: "14px" }}>
                  Нажмите "+ Добавить событие" чтобы начать трансляцию
                </p>
              )}
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="event-card glass-effect">
                {event.minute !== null && event.minute !== undefined && (
                  <div className="event-minute">
                    {event.minute}'
                  </div>
                )}
                <div className="event-text">
                  {event.text}
                </div>
                <div className="event-time">
                  {new Date(event.createdAt).toLocaleTimeString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {canManage && (
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="btn-icon glass-effect"
                    title="Удалить"
                    style={{ 
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: 'var(--color-danger)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      marginLeft: "8px"
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {!selectedMatch && (
        <div className="glass-effect" style={{ 
          padding: "60px 20px", 
          textAlign: "center",
          color: "var(--text-tertiary)"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}></div>
          <h4 style={{ margin: "0 0 8px 0", color: "var(--text-secondary)" }}>
            Выберите матч
          </h4>
          <p style={{ margin: 0 }}>
            Выберите матч из списка выше, чтобы увидеть текстовую трансляцию
          </p>
        </div>
      )}

      <style jsx>{`
        .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          display: inline-block;
        }
        .status-live {
          background: rgba(239, 68, 68, 0.2);
          color: var(--color-danger);
          border: 1px solid rgba(239, 68, 68, 0.3);
          animation: pulse 2s infinite;
        }
        .status-scheduled {
          background: rgba(59, 130, 246, 0.2);
          color: var(--color-primary);
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
        .status-finished {
          background: rgba(16, 185, 129, 0.2);
          color: var(--color-success);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .status-cancelled {
          background: rgba(107, 114, 128, 0.2);
          color: var(--text-tertiary);
          border: 1px solid rgba(107, 114, 128, 0.3);
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}