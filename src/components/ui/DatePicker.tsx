"use client";
import { useState, useEffect, useRef } from "react";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
}

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export default function DatePicker({ 
  value, 
  onChange, 
  label,
  minDate,
  maxDate,
  placeholder = "Выберите дату"
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      return { year: y, month: m - 1 };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');

  useEffect(() => {
    setSelectedDate(value);
    if (value) {
      const [y, m] = value.split('-').map(Number);
      setViewDate({ year: y, month: m - 1 });
    }
  }, [value]);

  // Определяем позицию dropdown
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 350;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const [y, m, d] = selectedDate.split('-').map(Number);
    return y === viewDate.year && m === viewDate.month + 1 && d === day;
  };

  const isToday = (day: number) => {
    const now = new Date();
    return now.getFullYear() === viewDate.year && 
           now.getMonth() === viewDate.month && 
           now.getDate() === day;
  };

  const isDisabled = (day: number) => {
    const dateStr = formatDate(viewDate.year, viewDate.month, day);
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const handleDayClick = (day: number) => {
    if (isDisabled(day)) return;
    const newDate = formatDate(viewDate.year, viewDate.month, day);
    setSelectedDate(newDate);
    onChange(newDate);
    setIsOpen(false);
  };

  const goToPrevMonth = () => {
    if (viewDate.month === 0) {
      setViewDate({ year: viewDate.year - 1, month: 11 });
    } else {
      setViewDate({ ...viewDate, month: viewDate.month - 1 });
    }
  };

  const goToNextMonth = () => {
    if (viewDate.month === 11) {
      setViewDate({ year: viewDate.year + 1, month: 0 });
    } else {
      setViewDate({ ...viewDate, month: viewDate.month + 1 });
    }
  };

  const goToPrevYear = () => {
    setViewDate({ ...viewDate, year: viewDate.year - 1 });
  };

  const goToNextYear = () => {
    setViewDate({ ...viewDate, year: viewDate.year + 1 });
  };

  const goToYear = (year: number) => {
    setViewDate({ ...viewDate, year });
  };

  const goToMonth = (month: number) => {
    setViewDate({ ...viewDate, month });
  };

  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month);
  const firstDay = getFirstDayOfMonth(viewDate.year, viewDate.month);
  
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 101 }, (_, i) => currentYear - 50 + i);

  const displayValue = selectedDate 
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      })
    : placeholder;

  return (
    <div className="datepicker-container" ref={containerRef}>
      {label && <label className="datepicker-label">{label}</label>}
      
      <button 
        type="button"
        className={`datepicker-input glass-effect ${isOpen ? 'active' : ''}`}
        onClick={() => {
          setIsOpen(!isOpen);
          setShowYearPicker(false);
          setShowMonthPicker(false);
        }}
      >
        <span className="datepicker-value">{displayValue}</span>
        <svg className="datepicker-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>

      {isOpen && (
        <div className={`datepicker-dropdown glass-effect ${dropdownPosition === 'top' ? 'dropdown-top' : 'dropdown-bottom'}`}>
          <div className="datepicker-header">
            <button type="button" className="datepicker-nav-btn" onClick={goToPrevYear} title="Предыдущий год">
              «
            </button>
            <button type="button" className="datepicker-nav-btn" onClick={goToPrevMonth} title="Предыдущий месяц">
              ‹
            </button>
            
            <div className="datepicker-month-year">
              <button 
                type="button"
                className="datepicker-month-btn"
                onClick={() => { setShowMonthPicker(!showMonthPicker); setShowYearPicker(false); }}
              >
                {MONTH_NAMES[viewDate.month]}
              </button>
              <button 
                type="button"
                className="datepicker-year-btn"
                onClick={() => { setShowYearPicker(!showYearPicker); setShowMonthPicker(false); }}
              >
                {viewDate.year}
              </button>
            </div>

            <button type="button" className="datepicker-nav-btn" onClick={goToNextMonth} title="Следующий месяц">
              ›
            </button>
            <button type="button" className="datepicker-nav-btn" onClick={goToNextYear} title="Следующий год">
              »
            </button>
          </div>

          {showMonthPicker && (
            <div className="datepicker-month-grid">
              {MONTH_NAMES.map((name, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`datepicker-month-option ${viewDate.month === idx ? 'active' : ''}`}
                  onClick={() => { goToMonth(idx); setShowMonthPicker(false); }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          {showYearPicker && (
            <div className="datepicker-year-grid">
              {years.map(year => (
                <button
                  key={year}
                  type="button"
                  className={`datepicker-year-option ${viewDate.year === year ? 'active' : ''}`}
                  onClick={() => { goToYear(year); setShowYearPicker(false); }}
                >
                  {year}
                </button>
              ))}
            </div>
          )}

          {!showMonthPicker && !showYearPicker && (
            <>
              <div className="datepicker-weekdays">
                {WEEKDAYS.map(day => (
                  <div key={day} className="datepicker-weekday">{day}</div>
                ))}
              </div>
              <div className="datepicker-days">
                {days.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`datepicker-day 
                      ${day === null ? 'empty' : ''} 
                      ${day && isSelected(day) ? 'selected' : ''} 
                      ${day && isToday(day) ? 'today' : ''}
                      ${day && isDisabled(day) ? 'disabled' : ''}
                    `}
                    onClick={() => day && handleDayClick(day)}
                    disabled={day === null || isDisabled(day)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </>
          )}

          {!showMonthPicker && !showYearPicker && (
            <div className="datepicker-footer">
              <button 
                type="button"
                className="datepicker-today-btn"
                onClick={() => {
                  const now = new Date();
                  const today = formatDate(now.getFullYear(), now.getMonth(), now.getDate());
                  if (!isDisabled(now.getDate())) {
                    setSelectedDate(today);
                    onChange(today);
                    setIsOpen(false);
                  }
                }}
              >
                Сегодня
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}