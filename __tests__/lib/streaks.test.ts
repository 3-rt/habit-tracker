import { describe, it, expect } from 'vitest';
import { calculateStreak } from '@/lib/streaks';
import type { Schedule } from '@/lib/types';

describe('calculateStreak', () => {
  it('daily — counts consecutive completed days backward from today', () => {
    const entries = [
      { date: '2026-03-17', completed: true },
      { date: '2026-03-16', completed: true },
      { date: '2026-03-15', completed: true },
      { date: '2026-03-14', completed: false },
    ];
    expect(calculateStreak({ type: 'daily' }, entries, '2026-03-17')).toBe(3);
  });
  it('daily — zero if today not completed', () => {
    const entries = [
      { date: '2026-03-17', completed: false },
      { date: '2026-03-16', completed: true },
    ];
    expect(calculateStreak({ type: 'daily' }, entries, '2026-03-17')).toBe(0);
  });
  it('weekly — counts consecutive scheduled days', () => {
    const schedule: Schedule = { type: 'weekly', days: ['mon', 'wed', 'fri'] };
    const entries = [
      { date: '2026-03-16', completed: true },
      { date: '2026-03-13', completed: true },
      { date: '2026-03-11', completed: true },
      { date: '2026-03-09', completed: false },
    ];
    expect(calculateStreak(schedule, entries, '2026-03-16')).toBe(3);
  });
  it('x_per_week — counts consecutive weeks quota met', () => {
    const schedule: Schedule = { type: 'x_per_week', times: 3 };
    const entries = [
      { date: '2026-03-17', completed: true },
      { date: '2026-03-18', completed: true },
      { date: '2026-03-19', completed: true },
      { date: '2026-03-10', completed: true },
      { date: '2026-03-11', completed: true },
      { date: '2026-03-12', completed: true },
      { date: '2026-03-03', completed: true },
      { date: '2026-03-04', completed: true },
    ];
    expect(calculateStreak(schedule, entries, '2026-03-19')).toBe(2);
  });
});
