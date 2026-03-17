import { describe, it, expect } from 'vitest';
import { isScheduledOn, isVisibleToday } from '@/lib/schedule';
import type { Schedule } from '@/lib/types';

describe('isScheduledOn', () => {
  it('daily — always true', () => {
    expect(isScheduledOn({ type: 'daily' }, '2026-03-17')).toBe(true);
  });
  it('weekly — true on matching day', () => {
    expect(isScheduledOn({ type: 'weekly', days: ['tue'] }, '2026-03-17')).toBe(true);
    expect(isScheduledOn({ type: 'weekly', days: ['mon'] }, '2026-03-17')).toBe(false);
  });
  it('interval — true on interval days', () => {
    const sched: Schedule = { type: 'interval', every: 3, start: '2026-03-14' };
    expect(isScheduledOn(sched, '2026-03-14')).toBe(true);
    expect(isScheduledOn(sched, '2026-03-15')).toBe(false);
    expect(isScheduledOn(sched, '2026-03-17')).toBe(true);
  });
  it('monthly — true on matching day', () => {
    expect(isScheduledOn({ type: 'monthly', day: 17 }, '2026-03-17')).toBe(true);
    expect(isScheduledOn({ type: 'monthly', day: 17 }, '2026-03-18')).toBe(false);
  });
  it('monthly — clamps to last day of month', () => {
    expect(isScheduledOn({ type: 'monthly', day: 31 }, '2026-02-28')).toBe(true);
  });
  it('x_per_week — always returns true', () => {
    expect(isScheduledOn({ type: 'x_per_week', times: 3 }, '2026-03-17')).toBe(true);
  });
  it('x_per_month — always returns true', () => {
    expect(isScheduledOn({ type: 'x_per_month', times: 5 }, '2026-03-17')).toBe(true);
  });
});

describe('isVisibleToday', () => {
  it('daily habit with no completions — visible', () => {
    expect(isVisibleToday({ type: 'daily' }, '2026-03-17', 0)).toBe(true);
  });
  it('x_per_week — hidden when quota met', () => {
    expect(isVisibleToday({ type: 'x_per_week', times: 3 }, '2026-03-17', 2)).toBe(true);
    expect(isVisibleToday({ type: 'x_per_week', times: 3 }, '2026-03-17', 3)).toBe(false);
  });
  it('x_per_month — hidden when quota met', () => {
    expect(isVisibleToday({ type: 'x_per_month', times: 5 }, '2026-03-17', 5)).toBe(false);
    expect(isVisibleToday({ type: 'x_per_month', times: 5 }, '2026-03-17', 4)).toBe(true);
  });
});
