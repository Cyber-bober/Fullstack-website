// src/components/ui/CalendarSection.tsx
"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { Match } from "@/types/CalendarSection";

interface Props {
  matches: Match[];
  onDeleteMatch?: (id: string) => void;
  deletingId?: string | null;
};

const formatTime = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const CustomSelect = ({ 
  value, 
  onChange, 
  options, 
  width 
}: { 
  value: number | string; 
  onChange: (val: any) => void; 
  options: { value: any; label: string }[];
  width?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value);

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
    <div className="custom-select" ref={containerRef} style={{ width: width || '140px' }}>
      <div 
        className="custom-select-trigger glass-effect"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption?.label}</span>
        <span className={`arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </div>
      
      {isOpen && (
        <div className="custom-select-dropdown glass-effect">
          {options.map((option) => (
            <div
              key={option.value}
              className={`custom-select-option ${option.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function CalendarSection({ matches, onDeleteMatch, deletingId }: Props) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedDayMatches, setSelectedDayMatches] = useState<Match[] | null>(null);

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
    const maxVisibleMatches = 4;
    const visibleMatches = dayMatches.slice(0, maxVisibleMatches);
    const hasMoreMatches = dayMatches.length > maxVisibleMatches;

    days.push(
      <div key={day} className="calendar-day glass-effect" onClick={() => {
        if (dayMatches.length > 0) setSelectedDayMatches(dayMatches);
      }}>
        <span className="day-number">{day}</span>
        
        {dayMatches.length > 0 ? (
          <div className="matches-container">
            {dayMatches.length <= 3 ? (
              dayMatches.map((m) => (
                <div 
                  key={m.id} 
                  className="match-event glass-effect" 
                  title={`${m.homeTeam.name} vs ${m.awayTeam.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMatch(m);
                  }}
                >
                  {formatTime(m.date)}
                </div>
              ))
            ) : (
              <div className="matches-grid">
                {visibleMatches.map((m) => (
                  <div 
                    key={m.id} 
                    className="match-dot glass-effect" 
                    title={`${m.homeTeam.name} vs ${m.awayTeam.name} — ${formatTime(m.date)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMatch(m);
                    }}
                  >
                    {formatTime(m.date)}
                  </div>
                ))}
                {hasMoreMatches && (
                  <div 
                    className="match-more"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDayMatches(dayMatches);
                    }}
                  >
                    +{dayMatches.length - maxVisibleMatches}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  }
  const remainder = (firstDay + daysInMonth) % 7;
  if (remainder !== 0) for (let i = 0; i < 7 - remainder; i++) days.push(<div key={`end-${i}`} className="calendar-day empty"></div>);

  return (
    <div>
      <div className="calendar-header">
        <CustomSelect
          value={selectedMonth}
          onChange={setSelectedMonth}
          options={monthNames.map((m, i) => ({ value: i, label: m }))}
          width="140px"
        />
        <CustomSelect
          value={selectedYear}
          onChange={setSelectedYear}
          options={years.map(y => ({ value: y, label: String(y) }))}
          width="100px"
        />
      </div>

      <div className="calendar-grid glass-effect">
        {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(d => <div key={d} className="calendar-day-header day-header-glass">{d}</div>)}
        {days}
      </div>

      {selectedMatch && (
        <div className="modal-overlay" onClick={() => setSelectedMatch(null)}>
          <div className="modal-content glass-effect" onClick={e => e.stopPropagation()}>
            <h3>Детали матча</h3>
            <p><strong>{selectedMatch.homeTeam.name}</strong> vs <strong>{selectedMatch.awayTeam.name}</strong></p>
            {/* ✅ ИСПРАВЛЕНО: 24-часовой формат */}
            <p>Дата: {formatDateTime(selectedMatch.date)}</p>
            {selectedMatch.venue && <p>Место: {selectedMatch.venue}</p>}
            
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
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

      {selectedDayMatches && (
        <div className="modal-overlay" onClick={() => setSelectedDayMatches(null)}>
          <div className="modal-content glass-effect" onClick={e => e.stopPropagation()}>
            {/* ✅ ИСПРАВЛЕНО: Правильная дата из первого матча */}
            <h3>Матчи {selectedDayMatches.length > 0 ? new Date(selectedDayMatches[0].date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : ''}</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {selectedDayMatches.map((m) => (
                <div 
                  key={m.id} 
                  className="match-list-item"
                  onClick={() => {
                    setSelectedDayMatches(null);
                    setSelectedMatch(m);
                  }}
                >
                  <div className="match-list-time">{formatTime(m.date)}</div>
                  <div className="match-list-teams">
                    <strong>{m.homeTeam.name}</strong> vs <strong>{m.awayTeam.name}</strong>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-primary glass-effect w-full" onClick={() => setSelectedDayMatches(null)} style={{ marginTop: 16 }}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}