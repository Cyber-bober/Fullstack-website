// src/components/ui/CalendarSection.tsx

"use client";
import { useState, useMemo } from "react";
import { Match, Props } from "@/types/CalendarSection";

export function CalendarSection({ matches }: Props) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  
  // Генерируем список годов (текущий ± 5 лет)
  const years = useMemo(() => {
    const y = [];
    for (let i = now.getFullYear() - 5; i <= now.getFullYear() + 5; i++) y.push(i);
    return y;
  }, []);

  const firstDay = useMemo(() => {
    let d = new Date(selectedYear, selectedMonth, 1).getDay();
    return d === 0 ? 6 : d - 1; // Корректировка под Пн-Вс
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
      <div key={day} className="calendar-day">
        <span className="day-number">{day}</span>
        {dayMatches.map((m) => (
          <div key={m.id} className="match-event" title={`${m.homeTeam.name} vs ${m.awayTeam.name}`} onClick={() => setSelectedMatch(m)}>
            {m.homeTeam.name.split(' ').pop()} vs {m.awayTeam.name.split(' ').pop()}
          </div>
        ))}
      </div>
    );
  }
  // Дозаполнение сетки
  const remainder = (firstDay + daysInMonth) % 7;
  if (remainder !== 0) for (let i = 0; i < 7 - remainder; i++) days.push(<div key={`end-${i}`} className="calendar-day empty"></div>);

  return (
    <div>
      {/* Панель выбора даты */}
      <div className="calendar-header">
        <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="btn" style={{ minWidth: "140px" }}>
          {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="btn" style={{ minWidth: "100px" }}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="calendar-grid">
        {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(d => <div key={d} className="calendar-day-header">{d}</div>)}
        {days}
      </div>

      {selectedMatch && (
        <div className="modal-overlay" onClick={() => setSelectedMatch(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Детали матча</h3>
            <p><strong>{selectedMatch.homeTeam.name}</strong> vs <strong>{selectedMatch.awayTeam.name}</strong></p>
            <p>Дата: {new Date(selectedMatch.date).toLocaleString()}</p>
            {selectedMatch.venue && <p>Место: {selectedMatch.venue}</p>}
            <p>Статус: {selectedMatch.status}</p>
            <button className="btn btn-primary" onClick={() => setSelectedMatch(null)}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}