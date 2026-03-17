'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { HabitWithSteps, Entry } from '@/lib/types';
import CalendarView from '@/components/detail/CalendarView';
import TrendChart from '@/components/detail/TrendChart';
import EntryHistory from '@/components/detail/EntryHistory';

export default function HabitDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [habit, setHabit] = useState<HabitWithSteps | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [habitRes, entriesRes] = await Promise.all([
        fetch(`/api/habits/${id}`),
        fetch(`/api/entries?habit_id=${id}`),
      ]);
      if (habitRes.ok) {
        const habitData = await habitRes.json();
        setHabit(habitData);
      }
      if (entriesRes.ok) {
        const entriesData = await entriesRes.json();
        setEntries(entriesData);
      }
    } catch (err) {
      console.error('Failed to fetch habit detail:', err);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-surface-light rounded animate-pulse" />
          <div className="h-64 bg-surface-light rounded-xl animate-pulse" />
        </div>
      </main>
    );
  }

  if (!habit) {
    return (
      <main className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
        <p className="text-gray-400">Habit not found.</p>
        <a href="/" className="text-info text-sm hover:underline mt-2 inline-block">
          Back to Dashboard
        </a>
      </main>
    );
  }

  const showTrend = habit.type === 'numeric' || habit.type === 'timed';

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <a
            href="/"
            className="text-xs text-info hover:underline transition-colors"
          >
            &larr; Dashboard
          </a>
          <h1 className="text-2xl font-bold mt-1">{habit.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {habit.type.replace('_', ' ')} &middot;{' '}
            {habit.schedule.type === 'daily'
              ? 'Daily'
              : habit.schedule.type === 'weekly'
              ? `Weekly (${habit.schedule.days.join(', ')})`
              : habit.schedule.type === 'interval'
              ? `Every ${habit.schedule.every} days`
              : habit.schedule.type === 'x_per_week'
              ? `${habit.schedule.times}x/week`
              : habit.schedule.type === 'x_per_month'
              ? `${habit.schedule.times}x/month`
              : `Monthly (day ${habit.schedule.day})`}
            {habit.target != null && ` &middot; Target: ${habit.target}${habit.unit ? ` ${habit.unit}` : ''}`}
          </p>
        </div>
        <a
          href="/manage"
          className="text-sm text-info hover:underline transition-colors"
        >
          Manage
        </a>
      </header>

      <div className="space-y-6">
        <CalendarView
          entries={entries}
          month={month}
          schedule={habit.schedule}
          onMonthChange={setMonth}
        />

        {showTrend && (
          <TrendChart entries={entries} target={habit.target} unit={habit.unit} />
        )}

        <EntryHistory entries={entries} unit={habit.unit} />
      </div>
    </main>
  );
}
