// src/components/ui/LiveSection.tsx
import { useState } from "react";
import Card from "@/components/ui/Card";

type Match = {
  id: string;
  date: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  venue?: string;
  status: string;
};

type MatchEvent = {
  id: string;
  minute?: number;
  text: string;
  createdAt: string;
};

type Props = {
  matches: Match[];
  userRole: string | null;
};

export function LiveSection({ matches, userRole }: Props) {
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

  return (
    <div>
      <h2 className="section-title">Текстовая трансляция</h2>

      {activeMatches.length === 0 ? (
        <p className="empty-text">Нет активных матчей для трансляции</p>
      ) : (
        <>
          <div className="form-group">
            <label>Выберите матч</label>
            <select
              value={selectedMatchId}
              onChange={(e) => handleMatchSelect(e.target.value)}
            >
              <option value="">-- Выберите матч --</option>
              {activeMatches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.homeTeam.name} vs {m.awayTeam.name} — {new Date(m.date).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {selectedMatchId && canEdit && (
            <Card className="form-card">
              <form onSubmit={handleAddEvent}>
                <div style={{ display: "flex", gap: 12 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Минута (необязательно)</label>
                    <input
                      type="number"
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
                      value={newEvent.text}
                      onChange={(e) => setNewEvent({ ...newEvent, text: e.target.value })}
                      placeholder="Гол! Забивает..."
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Добавление..." : "Добавить событие"}
                </button>
              </form>

              {isAdmin && events.length > 0 && (
                <button className="btn btn-danger" onClick={handleClear} style={{ marginTop: 12 }}>
                  Очистить трансляцию
                </button>
              )}
            </Card>
          )}

          {events.length > 0 && (
            <div className="events-list">
              {events.map((event) => (
                <Card key={event.id} className="event-card">
                  {event.minute && <span className="event-minute">{event.minute}'</span>}
                  <span className="event-text">{event.text}</span>
                  <span className="event-time">
                    {new Date(event.createdAt).toLocaleTimeString()}
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