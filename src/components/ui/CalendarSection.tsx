// src/components/ui/CalendarSection.tsx

"use client";
import { useState } from "react";
import { Match, Props } from "@/types/CalendarSection";

export function CalendarSection({ matches }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Получаем день недели первого числа (0 - Вс, 1 - Пн...)
  // Корректируем, чтобы неделя начиналась с Понедельника
  let firstDay = new Date(year, month, 1).getDay();
  firstDay = firstDay === 0 ? 6 : firstDay - 1; 

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
  
  // Пустые ячейки до начала месяца
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }

  // Дни месяца
  for (let day = 1; day <= daysInMonth; day++) {
    const dayMatches = getMatchesForDay(day);
    days.push(
      <div key={day} className="calendar-day">
        <span className="day-number">{day}</span>
        {dayMatches.map((m) => (
          <div
            key={m.id}
            className="match-event"
            title={`${m.homeTeam.name} vs ${m.awayTeam.name}`} // Всплывающая подсказка
            onClick={() => setSelectedMatch(m)}
          >
            {/* Сокращенное отображение для верстки */}
            {m.homeTeam.name.split(' ').pop()} vs {m.awayTeam.name.split(' ').pop()}
          </div>
        ))}
      </div>
    );
  }

  // ДОЗАПОЛНЕНИЕ: Добавляем пустые ячейки в конец, чтобы сетка была прямоугольной
  const totalCells = firstDay + daysInMonth;
  const remainder = totalCells % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      days.push(<div key={`end-empty-${i}`} className="calendar-day empty"></div>);
    }
  }

  return (
    <div>
      <div className="calendar-header">
        <button className="btn" onClick={prevMonth}>← Назад</button>
        <h3 className="calendar-month-title">{monthNames[month]} {year}</h3>
        <button className="btn" onClick={nextMonth}>Вперед →</button>
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