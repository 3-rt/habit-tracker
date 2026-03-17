import { describe, it, expect } from 'vitest';
import { toDateStr, getWeekRange, getMonthRange, getDayOfWeek, daysBetween } from '@/lib/date-utils';

describe('date-utils', () => {
  it('toDateStr formats a Date to YYYY-MM-DD', () => {
    expect(toDateStr(new Date('2026-03-17'))).toBe('2026-03-17');
  });
  it('getWeekRange returns Mon-Sun for a given date', () => {
    const { start, end } = getWeekRange('2026-03-17');
    expect(start).toBe('2026-03-16');
    expect(end).toBe('2026-03-22');
  });
  it('getMonthRange returns first and last day', () => {
    const { start, end } = getMonthRange('2026-02-15');
    expect(start).toBe('2026-02-01');
    expect(end).toBe('2026-02-28');
  });
  it('getDayOfWeek returns lowercase day name', () => {
    expect(getDayOfWeek('2026-03-17')).toBe('tue');
  });
  it('daysBetween computes correct difference', () => {
    expect(daysBetween('2026-03-10', '2026-03-17')).toBe(7);
  });
});
