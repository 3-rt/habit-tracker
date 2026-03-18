'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Habit, EntryWithSteps, HabitStep } from '@/lib/types';
import { isScheduledOn } from '@/lib/schedule';
import { toDateStr } from '@/lib/date-utils';
import DateNavigator from './DateNavigator';
import HabitChecklistItem from './HabitChecklistItem';

export default function HabitChecklist() {
  const [date, setDate] = useState(() => toDateStr(new Date()));
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<EntryWithSteps[]>([]);
  const [stepsMap, setStepsMap] = useState<Record<number, HabitStep[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [habitsRes, entriesRes] = await Promise.all([
        fetch('/api/habits'),
        fetch(`/api/entries?date=${date}`),
      ]);
      const habitsData: Habit[] = await habitsRes.json();
      const entriesData: EntryWithSteps[] = await entriesRes.json();

      setHabits(habitsData);
      setEntries(entriesData);

      // Fetch steps for multi_step habits
      const multiStepHabits = habitsData.filter((h) => h.type === 'multi_step');
      if (multiStepHabits.length > 0) {
        const stepsResults = await Promise.all(
          multiStepHabits.map(async (h) => {
            const res = await fetch(`/api/habits/${h.id}`);
            const data = await res.json();
            return { habitId: h.id, steps: data.steps as HabitStep[] };
          })
        );
        const map: Record<number, HabitStep[]> = {};
        stepsResults.forEach((r) => { map[r.habitId] = r.steps; });
        setStepsMap(map);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getEntryForHabit = (habitId: number) =>
    entries.find((e) => e.habit_id === habitId) ?? null;

  const visibleHabits = habits.filter((habit) => isScheduledOn(habit.schedule, date));

  return (
    <div className="flex-[1.2]">
      <div className="bg-surface rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Today&apos;s Habits</h2>
          <DateNavigator date={date} onDateChange={setDate} />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-surface-light rounded-lg animate-pulse" />
            ))}
          </div>
        ) : visibleHabits.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No habits scheduled for this date.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleHabits.map((habit) => (
              <HabitChecklistItem
                key={habit.id}
                habit={habit}
                entry={getEntryForHabit(habit.id)}
                date={date}
                onUpdate={fetchData}
                steps={stepsMap[habit.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
