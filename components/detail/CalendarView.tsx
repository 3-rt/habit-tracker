'use client';

import { useState, useMemo } from 'react';
import type { Entry, Schedule } from '@/lib/types';

interface CalendarViewProps {
  entries: Entry[];
  month: string; // "YYYY-MM"
  schedule: Schedule;
  onMonthChange?: (month: string) => void;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  // 0=Sun, convert to Mon=0
  const d = new Date(year, month - 1, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function isScheduledOn(schedule: Schedule, dateStr: string): boolean {
  switch (schedule.type) {
    case 'daily':
      return true;
    case 'weekly': {
      const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const d = new Date(dateStr + 'T12:00:00');
      return schedule.days.includes(dayNames[d.getDay()]);
    }
    case 'interval': {
      const start = new Date(schedule.start + 'T12:00:00');
      const current = new Date(dateStr + 'T12:00:00');
      const diff = Math.round((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff % schedule.every === 0;
    }
    case 'monthly': {
      const day = parseInt(dateStr.split('-')[2], 10);
      const year = parseInt(dateStr.split('-')[0], 10);
      const month = parseInt(dateStr.split('-')[1], 10);
      const daysInMonth = getDaysInMonth(year, month);
      const targetDay = Math.min(schedule.day, daysInMonth);
      return day === targetDay;
    }
    case 'x_per_week':
    case 'x_per_month':
      return true;
  }
}

function formatMonth(month: string): string {
  const [year, m] = month.split('-').map(Number);
  const d = new Date(year, m - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split('-').map(Number);
  const d = new Date(year, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function CalendarView({ entries, month, schedule, onMonthChange }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(month);

  const displayMonth = onMonthChange ? month : currentMonth;

  const navigate = (delta: number) => {
    const next = shiftMonth(displayMonth, delta);
    if (onMonthChange) {
      onMonthChange(next);
    } else {
      setCurrentMonth(next);
    }
  };

  const entryMap = useMemo(() => {
    const map = new Map<string, Entry>();
    entries.forEach((e) => map.set(e.date, e));
    return map;
  }, [entries]);

  const [year, monthNum] = displayMonth.split('-').map(Number);
  const daysInMonth = getDaysInMonth(year, monthNum);
  const firstDay = getFirstDayOfWeek(year, monthNum);
  const today = new Date().toISOString().split('T')[0];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to complete rows
  while (cells.length % 7 !== 0) cells.push(null);

  const getColor = (day: number): string => {
    const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const entry = entryMap.get(dateStr);
    const scheduled = isScheduledOn(schedule, dateStr);
    const isFuture = dateStr > today;

    if (isFuture) return 'bg-surface-light text-gray-500';
    if (entry && (entry.value !== null && entry.value > 0)) return 'bg-done/20 text-done';
    if (scheduled && !isFuture) return 'bg-pending/20 text-pending';
    return 'bg-surface-light text-gray-500';
  };

  return (
    <div className="bg-surface rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white px-2 py-1 text-sm transition-colors"
          aria-label="Previous month"
        >
          &larr; Prev
        </button>
        <h3 className="text-sm font-semibold">{formatMonth(displayMonth)}</h3>
        <button
          onClick={() => navigate(1)}
          className="text-gray-400 hover:text-white px-2 py-1 text-sm transition-colors"
          aria-label="Next month"
        >
          Next &rarr;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="text-gray-400 py-1 font-medium">
            {d}
          </div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={`aspect-square flex items-center justify-center rounded text-xs ${
              day ? getColor(day) : ''
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-3 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-done/20 inline-block" /> Done
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-pending/20 inline-block" /> Missed
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-surface-light inline-block" /> Not scheduled
        </div>
      </div>
    </div>
  );
}
