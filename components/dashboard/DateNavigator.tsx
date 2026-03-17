'use client';

import { useState } from 'react';

interface DateNavigatorProps {
  date: string;
  onDateChange: (date: string) => void;
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === yesterday.getTime()) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function DateNavigator({ date, onDateChange }: DateNavigatorProps) {
  const today = new Date().toISOString().split('T')[0];
  const isToday = date === today;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onDateChange(addDays(date, -1))}
        className="p-2 rounded-lg bg-surface-light hover:bg-surface-light/80 transition-colors"
        aria-label="Previous day"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <span className="text-sm font-medium min-w-[120px] text-center">
        {formatDisplayDate(date)}
      </span>
      <button
        onClick={() => !isToday && onDateChange(addDays(date, 1))}
        className={`p-2 rounded-lg transition-colors ${
          isToday ? 'opacity-30 cursor-not-allowed' : 'bg-surface-light hover:bg-surface-light/80'
        }`}
        disabled={isToday}
        aria-label="Next day"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}
