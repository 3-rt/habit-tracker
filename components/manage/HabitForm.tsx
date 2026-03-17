'use client';

import { useState, useEffect } from 'react';
import type { HabitType, Schedule, HabitWithSteps } from '@/lib/types';
import StepEditor from './StepEditor';

interface HabitFormProps {
  habit?: HabitWithSteps;
  onSave: () => void;
  onCancel?: () => void;
}

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS: Record<string, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

export default function HabitForm({ habit, onSave, onCancel }: HabitFormProps) {
  const isEdit = !!habit;

  const [name, setName] = useState(habit?.name ?? '');
  const [type, setType] = useState<HabitType>(habit?.type ?? 'yes_no');
  const [unit, setUnit] = useState(habit?.unit ?? '');
  const [target, setTarget] = useState<string>(habit?.target?.toString() ?? '');
  const [steps, setSteps] = useState<{ name: string }[]>(
    habit?.steps?.map((s) => ({ name: s.name })) ?? []
  );

  // Schedule state
  const [scheduleType, setScheduleType] = useState<Schedule['type']>(habit?.schedule?.type ?? 'daily');
  const [weeklyDays, setWeeklyDays] = useState<string[]>(
    habit?.schedule?.type === 'weekly' ? habit.schedule.days : ['mon', 'wed', 'fri']
  );
  const [intervalEvery, setIntervalEvery] = useState<string>(
    habit?.schedule?.type === 'interval' ? habit.schedule.every.toString() : '2'
  );
  const [intervalStart, setIntervalStart] = useState<string>(
    habit?.schedule?.type === 'interval' ? habit.schedule.start : new Date().toISOString().split('T')[0]
  );
  const [xPerWeekTimes, setXPerWeekTimes] = useState<string>(
    habit?.schedule?.type === 'x_per_week' ? habit.schedule.times.toString() : '3'
  );
  const [xPerMonthTimes, setXPerMonthTimes] = useState<string>(
    habit?.schedule?.type === 'x_per_month' ? habit.schedule.times.toString() : '10'
  );
  const [monthlyDay, setMonthlyDay] = useState<string>(
    habit?.schedule?.type === 'monthly' ? habit.schedule.day.toString() : '1'
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset steps when switching away from multi_step
  useEffect(() => {
    if (type !== 'multi_step') {
      setSteps([]);
    }
  }, [type]);

  const buildSchedule = (): Schedule => {
    switch (scheduleType) {
      case 'daily':
        return { type: 'daily' };
      case 'weekly':
        return { type: 'weekly', days: weeklyDays };
      case 'interval':
        return { type: 'interval', every: parseInt(intervalEvery) || 2, start: intervalStart };
      case 'x_per_week':
        return { type: 'x_per_week', times: parseInt(xPerWeekTimes) || 3 };
      case 'x_per_month':
        return { type: 'x_per_month', times: parseInt(xPerMonthTimes) || 10 };
      case 'monthly':
        return { type: 'monthly', day: parseInt(monthlyDay) || 1 };
    }
  };

  const toggleDay = (day: string) => {
    setWeeklyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (type === 'multi_step' && steps.length === 0) {
      setError('Multi-step habits need at least one step');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        schedule: buildSchedule(),
      };

      if (!isEdit) {
        payload.type = type;
      }

      if (type === 'numeric' || type === 'timed') {
        payload.unit = unit || null;
        payload.target = target ? parseFloat(target) : null;
      }

      if (type === 'multi_step') {
        payload.steps = steps;
      }

      const url = isEdit ? `/api/habits/${habit!.id}` : '/api/habits';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to save habit');
      }

      setName('');
      setType('yes_no');
      setUnit('');
      setTarget('');
      setSteps([]);
      setScheduleType('daily');
      onSave();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-xl p-5 space-y-4">
      <h2 className="text-lg font-semibold">{isEdit ? 'Edit Habit' : 'Create Habit'}</h2>

      {error && (
        <div className="text-pending text-sm bg-pending/10 rounded px-3 py-2">{error}</div>
      )}

      <div>
        <label htmlFor="habit-name" className="block text-sm font-medium text-gray-300 mb-1">
          Name
        </label>
        <input
          id="habit-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-surface-light border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-info"
          placeholder="e.g. Meditate"
        />
      </div>

      <div>
        <label htmlFor="habit-type" className="block text-sm font-medium text-gray-300 mb-1">
          Type
        </label>
        <select
          id="habit-type"
          value={type}
          onChange={(e) => setType(e.target.value as HabitType)}
          disabled={isEdit}
          className="w-full bg-surface-light border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-info disabled:opacity-50"
        >
          <option value="yes_no">Yes / No</option>
          <option value="numeric">Numeric</option>
          <option value="timed">Timed</option>
          <option value="multi_step">Multi-Step</option>
        </select>
      </div>

      {/* Schedule */}
      <div>
        <label htmlFor="schedule-type" className="block text-sm font-medium text-gray-300 mb-1">
          Schedule
        </label>
        <select
          id="schedule-type"
          value={scheduleType}
          onChange={(e) => setScheduleType(e.target.value as Schedule['type'])}
          className="w-full bg-surface-light border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-info mb-2"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly (specific days)</option>
          <option value="interval">Every N days</option>
          <option value="x_per_week">X times per week</option>
          <option value="x_per_month">X times per month</option>
          <option value="monthly">Monthly (specific day)</option>
        </select>

        {scheduleType === 'weekly' && (
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  weeklyDays.includes(day)
                    ? 'bg-info text-white'
                    : 'bg-surface-light text-gray-400 hover:text-white'
                }`}
              >
                {DAY_LABELS[day]}
              </button>
            ))}
          </div>
        )}

        {scheduleType === 'interval' && (
          <div className="flex gap-3 items-center">
            <label className="text-sm text-gray-400">Every</label>
            <input
              type="number"
              min="2"
              value={intervalEvery}
              onChange={(e) => setIntervalEvery(e.target.value)}
              className="w-20 bg-surface-light border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-info"
            />
            <label className="text-sm text-gray-400">days, starting</label>
            <input
              type="date"
              value={intervalStart}
              onChange={(e) => setIntervalStart(e.target.value)}
              className="bg-surface-light border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-info"
            />
          </div>
        )}

        {scheduleType === 'x_per_week' && (
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="1"
              max="7"
              value={xPerWeekTimes}
              onChange={(e) => setXPerWeekTimes(e.target.value)}
              className="w-20 bg-surface-light border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-info"
            />
            <span className="text-sm text-gray-400">times per week</span>
          </div>
        )}

        {scheduleType === 'x_per_month' && (
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="1"
              max="31"
              value={xPerMonthTimes}
              onChange={(e) => setXPerMonthTimes(e.target.value)}
              className="w-20 bg-surface-light border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-info"
            />
            <span className="text-sm text-gray-400">times per month</span>
          </div>
        )}

        {scheduleType === 'monthly' && (
          <div className="flex gap-2 items-center">
            <label className="text-sm text-gray-400">Day of month:</label>
            <input
              type="number"
              min="1"
              max="31"
              value={monthlyDay}
              onChange={(e) => setMonthlyDay(e.target.value)}
              className="w-20 bg-surface-light border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-info"
            />
          </div>
        )}
      </div>

      {/* Unit/Target for numeric & timed */}
      {(type === 'numeric' || type === 'timed') && (
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="habit-unit" className="block text-sm font-medium text-gray-300 mb-1">
              Unit
            </label>
            <input
              id="habit-unit"
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder={type === 'timed' ? 'e.g. minutes' : 'e.g. pages'}
              className="w-full bg-surface-light border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-info"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="habit-target" className="block text-sm font-medium text-gray-300 mb-1">
              Target
            </label>
            <input
              id="habit-target"
              type="number"
              min="0"
              step="any"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. 30"
              className="w-full bg-surface-light border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-info"
            />
          </div>
        </div>
      )}

      {/* Steps for multi_step */}
      {type === 'multi_step' && (
        <StepEditor steps={steps} onChange={setSteps} />
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-info text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-info/80 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : isEdit ? 'Update Habit' : 'Create Habit'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
