'use client';

import { useState } from 'react';
import type { Habit, EntryWithSteps, HabitStep } from '@/lib/types';
import NumericInput from '@/components/ui/NumericInput';
import NoteEditor from '@/components/ui/NoteEditor';

interface HabitChecklistItemProps {
  habit: Habit;
  entry: EntryWithSteps | null;
  date: string;
  onUpdate: () => void | Promise<void>;
  steps?: HabitStep[];
}

function getStatus(habit: Habit, entry: EntryWithSteps | null): 'done' | 'partial' | 'pending' {
  if (!entry) return 'pending';
  if (habit.type === 'yes_no') return entry.value === 1 ? 'done' : 'pending';
  if (habit.type === 'numeric' || habit.type === 'timed') {
    if (entry.value === null) return 'pending';
    if (habit.target && entry.value >= habit.target) return 'done';
    if (entry.value > 0) return 'partial';
    return 'pending';
  }
  if (habit.type === 'multi_step') {
    if (!entry.steps?.length) return 'pending';
    const completedCount = entry.steps.filter((s) => s.completed).length;
    if (completedCount === entry.steps.length) return 'done';
    if (completedCount > 0) return 'partial';
    return 'pending';
  }
  return 'pending';
}

const borderColors = {
  done: 'border-done',
  partial: 'border-partial',
  pending: 'border-pending',
};

async function saveEntry(habit: Habit, date: string, data: Record<string, unknown>, hasEntry: boolean) {
  const method = hasEntry ? 'PUT' : 'POST';
  const res = await fetch('/api/entries', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ habit_id: habit.id, date, ...data }),
  });
  return res.json();
}

export default function HabitChecklistItem({ habit, entry, date, onUpdate, steps }: HabitChecklistItemProps) {
  const [showInput, setShowInput] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const status = getStatus(habit, entry);
  const hasEntry = entry !== null;

  const handleYesNoToggle = async () => {
    if (saving) return;
    try {
      setSaving(true);
      const newValue = entry?.value === 1 ? 0 : 1;
      await saveEntry(habit, date, { value: newValue }, hasEntry);
      await onUpdate();
    } finally {
      setSaving(false);
    }
  };

  const handleNumericSave = async (value: number) => {
    try {
      setSaving(true);
      await saveEntry(habit, date, { value }, hasEntry);
      setShowInput(false);
      await onUpdate();
    } finally {
      setSaving(false);
    }
  };

  const handleStepToggle = async (stepId: number) => {
    if (saving || !steps) return;
    try {
      setSaving(true);
      const currentSteps = entry?.steps?.length
        ? entry.steps
        : steps.map((s) => ({ habit_step_id: s.id, completed: 0 }));
      const updatedSteps = currentSteps.map((s) => {
        const sid = s.habit_step_id;
        return {
          habit_step_id: sid,
          completed: sid === stepId ? (s.completed ? 0 : 1) : (s.completed ? 1 : 0),
        };
      });
      await saveEntry(habit, date, { steps: updatedSteps }, hasEntry);
      await onUpdate();
    } finally {
      setSaving(false);
    }
  };

  const handleNoteSave = async (note: string) => {
    try {
      setSaving(true);
      await saveEntry(habit, date, { note }, hasEntry);
      setShowNote(false);
      await onUpdate();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`border-l-4 ${borderColors[status]} bg-surface rounded-lg p-3 transition-colors`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {habit.type === 'yes_no' && (
            <button
              type="button"
              onClick={handleYesNoToggle}
              disabled={saving}
              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                entry?.value === 1
                  ? 'bg-done border-done text-background'
                  : 'border-gray-500 hover:border-done'
              }`}
            >
              {entry?.value === 1 && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          )}

          {(habit.type === 'numeric' || habit.type === 'timed') && (
            <button
              type="button"
              onClick={() => setShowInput(!showInput)}
              className="text-sm px-2 py-0.5 rounded bg-surface-light text-gray-300 hover:text-white transition-colors min-w-[60px]"
            >
              {entry?.value !== null && entry?.value !== undefined
                ? `${entry.value}${habit.unit ? ` ${habit.unit}` : ''}`
                : 'Log'}
            </button>
          )}

          {habit.type === 'multi_step' && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
              >
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          <span className="text-sm font-medium">{habit.name}</span>

          {habit.type === 'multi_step' && (
            <span className="text-xs text-gray-400">
              {(entry?.steps?.filter((s) => s.completed).length ?? 0)}/{steps?.length ?? entry?.steps?.length ?? 0}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowNote(!showNote)}
          className={`p-1 rounded transition-colors ${
            entry?.note ? 'text-info' : 'text-gray-500 hover:text-gray-300'
          }`}
          title={entry?.note ? 'Edit note' : 'Add note'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 2L14 3L8 9L6 10L7 8L13 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 4H2V14H12V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {showInput && (habit.type === 'numeric' || habit.type === 'timed') && (
        <NumericInput
          initialValue={entry?.value ?? null}
          unit={habit.unit}
          target={habit.target}
          onSave={handleNumericSave}
          onCancel={() => setShowInput(false)}
        />
      )}

      {expanded && habit.type === 'multi_step' && steps && (
        <div className="mt-2 ml-6 space-y-1">
          {steps.map((step) => {
            const entryStep = entry?.steps?.find((es) => es.habit_step_id === step.id);
            const isCompleted = entryStep?.completed ? true : false;
            const inputId = `habit-${habit.id}-step-${step.id}`;
            return (
              <label key={step.id} htmlFor={inputId} className="flex items-center gap-2 cursor-pointer group">
                <input
                  id={inputId}
                  type="checkbox"
                  checked={isCompleted}
                  onChange={() => handleStepToggle(step.id)}
                  disabled={saving}
                  className={`h-5 w-5 rounded border bg-transparent accent-[var(--color-done)] transition-colors ${
                    isCompleted
                      ? 'border-done'
                      : 'border-gray-500 group-hover:border-done'
                  }`}
                />
                <span className={`text-xs ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-300'}`}>
                  {step.name}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {showNote && (
        <NoteEditor
          initialNote={entry?.note ?? null}
          onSave={handleNoteSave}
          onCancel={() => setShowNote(false)}
        />
      )}
    </div>
  );
}
