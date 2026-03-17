'use client';

import { useState, useEffect, useCallback } from 'react';
import type { HabitWithSteps } from '@/lib/types';

interface HabitListProps {
  onEdit: (habit: HabitWithSteps) => void;
  refreshKey: number;
}

export default function HabitList({ onEdit, refreshKey }: HabitListProps) {
  const [habits, setHabits] = useState<HabitWithSteps[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedHabitId, setDraggedHabitId] = useState<number | null>(null);

  const fetchHabits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/habits?include_archived=true');
      const data = await res.json();

      // Fetch steps for multi_step habits
      const enriched: HabitWithSteps[] = await Promise.all(
        data.map(async (h: HabitWithSteps) => {
          if (h.type === 'multi_step') {
            const detailRes = await fetch(`/api/habits/${h.id}`);
            const detail = await detailRes.json();
            return { ...h, steps: detail.steps ?? [] };
          }
          return { ...h, steps: [] };
        })
      );
      setHabits(enriched);
    } catch (err) {
      console.error('Failed to fetch habits:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits, refreshKey]);

  const toggleArchive = async (habit: HabitWithSteps) => {
    const archived_at = habit.archived_at ? null : new Date().toISOString();
    try {
      await fetch(`/api/habits/${habit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived_at }),
      });
      fetchHabits();
    } catch (err) {
      console.error('Failed to toggle archive:', err);
    }
  };

  const active = habits.filter((h) => !h.archived_at);
  const archived = habits.filter((h) => h.archived_at);

  const reorderActiveHabits = async (sourceHabitId: number, targetHabitId: number) => {
    if (sourceHabitId === targetHabitId) return;

    const sourceIndex = active.findIndex((habit) => habit.id === sourceHabitId);
    const targetIndex = active.findIndex((habit) => habit.id === targetHabitId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const reorderedActive = [...active];
    const [movedHabit] = reorderedActive.splice(sourceIndex, 1);
    reorderedActive.splice(targetIndex, 0, movedHabit);

    const previousHabits = habits;
    const nextHabits = [...reorderedActive, ...archived];
    setHabits(nextHabits);

    try {
      const res = await fetch('/api/habits/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitIds: reorderedActive.map((habit) => habit.id) }),
      });

      if (!res.ok) {
        throw new Error('Failed to persist habit order');
      }
    } catch (err) {
      console.error('Failed to reorder habits:', err);
      setHabits(previousHabits);
    }
  };

  const scheduleLabel = (habit: HabitWithSteps): string => {
    const s = habit.schedule;
    switch (s.type) {
      case 'daily': return 'Daily';
      case 'weekly': return `Weekly (${s.days.join(', ')})`;
      case 'interval': return `Every ${s.every} days`;
      case 'x_per_week': return `${s.times}x per week`;
      case 'x_per_month': return `${s.times}x per month`;
      case 'monthly': return `Monthly (day ${s.day})`;
    }
  };

  const typeLabel = (type: string): string => {
    switch (type) {
      case 'yes_no': return 'Yes/No';
      case 'numeric': return 'Numeric';
      case 'timed': return 'Timed';
      case 'multi_step': return 'Multi-Step';
      default: return type;
    }
  };

  const renderHabitCard = (habit: HabitWithSteps, dimmed = false) => (
    <div
      key={habit.id}
      onDragOver={(event) => {
        if (!dimmed) event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        if (dimmed || draggedHabitId === null) return;
        void reorderActiveHabits(draggedHabitId, habit.id);
        setDraggedHabitId(null);
      }}
      className={`bg-surface-light rounded-lg p-4 flex items-center justify-between ${
        dimmed ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {!dimmed && (
          <button
            type="button"
            draggable
            onDragStart={() => setDraggedHabitId(habit.id)}
            onDragEnd={() => setDraggedHabitId(null)}
            aria-label={`Drag ${habit.name}`}
            className="text-gray-400 hover:text-white cursor-grab active:cursor-grabbing"
          >
            ≡
          </button>
        )}
        <a
          href={`/habits/${habit.id}`}
          className="font-medium text-sm hover:text-info transition-colors"
        >
          {habit.name}
        </a>
        <div className="text-xs text-gray-400 mt-0.5">
          {typeLabel(habit.type)} &middot; {scheduleLabel(habit)}
          {habit.target != null && ` &middot; Target: ${habit.target}${habit.unit ? ` ${habit.unit}` : ''}`}
        </div>
      </div>
      <div className="flex gap-2 ml-3 shrink-0">
        <button
          onClick={() => onEdit(habit)}
          className="text-xs text-info hover:text-blue-300 transition-colors px-2 py-1 rounded bg-info/10"
        >
          Edit
        </button>
        <button
          onClick={() => toggleArchive(habit)}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            habit.archived_at
              ? 'text-done hover:text-green-300 bg-done/10'
              : 'text-partial hover:text-yellow-300 bg-partial/10'
          }`}
        >
          {habit.archived_at ? 'Unarchive' : 'Archive'}
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-surface rounded-xl p-5 space-y-3">
        <h2 className="text-lg font-semibold">All Habits</h2>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-surface-light rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-5">
      <h2 className="text-lg font-semibold mb-4">Active Habits</h2>
      {active.length === 0 ? (
        <p className="text-gray-400 text-sm">No active habits. Create one above.</p>
      ) : (
        <div className="space-y-2 mb-6">
          {active.map((h) => renderHabitCard(h))}
        </div>
      )}

      {archived.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-3 text-gray-400">Archived</h2>
          <div className="space-y-2">
            {archived.map((h) => renderHabitCard(h, true))}
          </div>
        </>
      )}
    </div>
  );
}
