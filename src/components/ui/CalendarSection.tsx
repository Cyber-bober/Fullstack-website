// src/components/ui/CalendarSection.tsx
import { useState } from "react";

type Match = {
  id: string;
  date: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  venue?: string;
  status: string;
};

type Props = {
  matches: Match[];
};

export function CalendarSection({ matches }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const matchesInMonth = matches.filter((m) => {
    const d = new Date(m.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const getMatchesForDay = (day: number) => {
    return matchesInMonth.filter((m) => new Date(m.date).getDate() === day);
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dayMatches = getMatchesForDay(day);
    days.push(
      <div key={day} className="calendar-day">
        <span className="day-number">{day}</span>
        {dayMatches.map((m) => (
          <div
            key={m.id}
            className="match-event"
            onClick={() => setSelectedMatch(m)}
          >
            {m.homeTeam.name} vs {m.awayTeam.name}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2 className="section-title">Календарь событий</h2>

      <div className="calendar-header">
        <button className="btn" onClick={prevMonth}>←</button>
        <h3>{monthNames[month]} {year}</h3>
        <button className="btn" onClick={nextMonth}>→</button>
      </div>

      <div className="calendar-grid">
        <div className="calendar-day-header">Пн</div>
        <div className="calendar-day-header">Вт</div>
        <div className="calendar-day-header">Ср</div>
        <div className="calendar-day-header">Чт</div>
        <div className="calendar-day-header">Пт</div>
        <div className="calendar-day-header">Сб</div>
        <div className="calendar-day-header">Вс</div>
        {days}
      </div>

      {selectedMatch && (
        <div className="modal-overlay" onClick={() => setSelectedMatch(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Детали матча</h3>
            <p><strong>{selectedMatch.homeTeam.name}</strong> vs <strong>{selectedMatch.awayTeam.name}</strong></p>
            <p>Дата: {new Date(selectedMatch.date).toLocaleString()}</p>
            {selectedMatch.venue && <p>Место: {selectedMatch.venue}</p>}
            <p>Статус: {selectedMatch.status}</p>
            <button className="btn btn-primary" onClick={() => setSelectedMatch(null)}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}