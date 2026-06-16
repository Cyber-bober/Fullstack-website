// src/components/ui/CalendarSection.tsx
"use client";
import { useState, useMemo } from "react";
import { Match } from "@/types/CalendarSection";

interface Props {
  matches: Match[];
  onDeleteMatch?: (id: string) => Promise<void>;
  deletingId?: string | null;
}

const formatTime = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export function CalendarSection({ matches, onDeleteMatch, deletingId }: Props) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  
  const years = useMemo(() => {
    const y = [];
    for (let i = now.getFullYear() - 5; i <= now.getFullYear() + 5; i++) y.push(i);
    return y;
  }, []);

  const firstDay = useMemo(() => {
    let d = new Date(selectedYear, selectedMonth, 1).getDay();
    return d === 0 ? 6 : d - 1;
  }, [selectedYear, selectedMonth]);

  const daysInMonth = useMemo(() => new Date(selectedYear, selectedMonth + 1, 0).getDate(), [selectedYear, selectedMonth]);

  const matchesInMonth = useMemo(() => {
    return matches.filter((m) => {
      const d = new Date(m.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [matches, selectedYear, selectedMonth]);

  const getMatchesForDay = (day: number) => {
    return matchesInMonth.filter((m) => new Date(m.date).getDate() === day);
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  for (let day = 1; day <= daysInMonth; day++) {
    const dayMatches = getMatchesForDay(day);
    days.push(
      <div key={day} className="calendar-day glass-effect">
        <span className="day-number">{day}</span>
        {dayMatches.map((m) => (
          <div 
            key={m.id} 
            className="match-event glass-effect" 
            title={`${m.homeTeam.name} vs ${m.awayTeam.name} (${formatTime(m.date)})`} 
            onClick={() => setSelectedMatch(m)}
          >
            {formatTime(m.date)}
          </div>
        ))}
      </div>
    );
  }
  const remainder = (firstDay + daysInMonth) % 7;
  if (remainder !== 0) for (let i = 0; i < 7 - remainder; i++) days.push(<div key={`end-${i}`} className="calendar-day empty"></div>);

  return (
    <div>
      <div className="calendar-header">
        <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="btn calendar-btn glass-effect" style={{ minWidth: "140px" }}>
          {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="btn calendar-btn glass-effect" style={{ minWidth: "100px" }}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="calendar-grid glass-effect">
        {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(d => <div key={d} className="calendar-day-header day-header-glass">{d}</div>)}
        {days}
      </div>

      {selectedMatch && (
        <div className="modal-overlay" onClick={() => setSelectedMatch(null)}>
          <div className="modal-content glass-effect" onClick={e => e.stopPropagation()}>
            <h3>Детали матча</h3>
            <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              {selectedMatch.homeTeam.name} vs {selectedMatch.awayTeam.name}
            </p>
            <p><strong>Дата:</strong> {new Date(selectedMatch.date).toLocaleString()}</p>
            {selectedMatch.venue && <p><strong>Место:</strong> {selectedMatch.venue}</p>}
                        
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: '24px' }}>
              {onDeleteMatch && (
                <button 
                  className="btn btn-secondary glass-effect" 
                  style={{ color: 'white' }}
                  onClick={() => {
                    onDeleteMatch(selectedMatch.id);
                    setSelectedMatch(null);
                  }}
                  disabled={deletingId === selectedMatch.id}
                >
                  {deletingId === selectedMatch.id ? "Удаление..." : "Удалить"}
                </button>
              )}
              <button className="btn btn-primary glass-effect" onClick={() => setSelectedMatch(null)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}