// src/components/ui/LiveSection.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import Card from "@/components/ui/Card";
import { Match, MatchEvent } from "@/types/LiveSection";

interface Props {
  matches: Match[];
  userRole?: string | null;
  onDeleteMatch?: (id: string) => Promise<void>;
  deletingId?: string | null;
}

// Компонент кастомного Select
const CustomMatchSelect = ({ 
  matches, 
  value, 
  onChange 
}: { 
  matches: Match[]; 
  value: string; 
  onChange: (val: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedMatch = matches.find(m => m.id === value);

  // Форматирование даты в 24-часовом формате
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="custom-match-select" ref={containerRef}>
      <div 
        className="custom-match-select-trigger glass-effect"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>
          {selectedMatch 
            ? `${selectedMatch.homeTeam.name} vs ${selectedMatch.awayTeam.name} — ${formatDate(selectedMatch.date)}`
            : "Выберите матч"}
        </span>
        <span className={`arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </div>
      
      {isOpen && (
        <div className="custom-match-dropdown glass-effect">
          <div 
            className="custom-match-option selected"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
          >
            Выберите матч
          </div>
          {matches.map((match) => (
            <div
              key={match.id}
              className={`custom-match-option ${match.id === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(match.id);
                setIsOpen(false);
              }}
            >
              <div className="match-option-teams">
                <strong>{match.homeTeam.name}</strong> vs <strong>{match.awayTeam.name}</strong>
              </div>
              <div className="match-option-date">{formatDate(match.date)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function LiveSection({ matches, userRole, onDeleteMatch, deletingId }: Props) {
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [newEvent, setNewEvent] = useState({ minute: "", text: "" });
  const [loading, setLoading] = useState(false);

  const canEdit = userRole === "ADMIN" || userRole === "EDITOR";
  const isAdmin = userRole === "ADMIN";

  const loadEvents = async (matchId: string) => {
    try {
      const res = await fetch(`/api/match-events?matchId=${matchId}`);
      if (res.ok) setEvents(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleMatchSelect = (matchId: string) => {
    setSelectedMatchId(matchId);
    setEvents([]);
    if (matchId) loadEvents(matchId);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId || !newEvent.text) return;

    setLoading(true);
    try {
      const res = await fetch("/api/match-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: selectedMatchId,
          minute: newEvent.minute ? parseInt(newEvent.minute) : null,
          text: newEvent.text,
        }),
      });
      if (res.ok) {
        const event = await res.json();
        setEvents([...events, event]);
        setNewEvent({ minute: "", text: "" });
      } else {
        alert("Ошибка добавления события");
      }
    } catch {
      alert("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!selectedMatchId) return;
    if (!confirm("Очистить все события трансляции?")) return;

    try {
      const res = await fetch(`/api/match-events?matchId=${selectedMatchId}`, {
        method: "DELETE",
      });
      if (res.ok) setEvents([]);
      else alert("Ошибка очистки");
    } catch {
      alert("Ошибка сети");
    }
  };

  const activeMatches = matches.filter(
    (m) => m.status === "SCHEDULED" || m.status === "LIVE"
  );

  // Форматирование времени в 24-часовом формате (ЧЧ:ММ:СС)
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div>
      {activeMatches.length === 0 ? (
        <p className="empty-text">Нет активных матчей для трансляции</p>
      ) : (
        <>
          <div className="form-group" style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <CustomMatchSelect
                matches={activeMatches}
                value={selectedMatchId}
                onChange={handleMatchSelect}
              />
            </div>
          </div>

          {selectedMatchId && canEdit && (
            <Card className="form-card glass-effect">
              <form onSubmit={handleAddEvent}>
                <div style={{ display: "flex", gap: 12 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Минута (необязательно)</label>
                    <input
                      type="number"
                      className="glass-effect"
                      value={newEvent.minute}
                      onChange={(e) => setNewEvent({ ...newEvent, minute: e.target.value })}
                      placeholder="45"
                      min="0"
                      max="120"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 3 }}>
                    <label>Текст события</label>
                    <input
                      type="text"
                      className="glass-effect"
                      value={newEvent.text}
                      onChange={(e) => setNewEvent({ ...newEvent, text: e.target.value })}
                      placeholder="Гол! Забивает..."
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary glass-effect" disabled={loading}>
                  {loading ? "Добавление..." : "Добавить событие"}
                </button>
              </form>

              {isAdmin && events.length > 0 && (
                <button className="btn btn-danger glass-effect" onClick={handleClear} style={{ marginTop: 12 }}>
                  Очистить трансляцию
                </button>
              )}
            </Card>
          )}

          {events.length > 0 && (
            <div className="events-list">
              {events.map((event) => (
                <Card key={event.id} className="event-card glass-effect">
                  {event.minute && (
                    <span className="event-minute glass-effect">{event.minute}'</span>
                  )}
                  <span className="event-text">{event.text}</span>
                  <span className="event-time">
                    {formatTime(event.createdAt)}
                  </span>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}