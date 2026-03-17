import type { Schedule } from './types';
import { isScheduledOn } from './schedule';
import { addDays, getWeekRange, parseDate, toDateStr } from './date-utils';

interface EntryRecord {
  date: string;
  completed: boolean;
}

export function calculateStreak(schedule: Schedule, entries: EntryRecord[], asOfDate: string): number {
  const completedSet = new Set(entries.filter((e) => e.completed).map((e) => e.date));

  switch (schedule.type) {
    case 'daily':
    case 'weekly':
    case 'monthly':
    case 'interval':
      return calcScheduledStreak(schedule, completedSet, asOfDate);
    case 'x_per_week':
      return calcXPerWeekStreak(schedule.times, entries, asOfDate);
    case 'x_per_month':
      return calcXPerMonthStreak(schedule.times, entries, asOfDate);
  }
}

function calcScheduledStreak(schedule: Schedule, completedDates: Set<string>, asOfDate: string): number {
  let streak = 0;
  let current = asOfDate;
  for (let i = 0; i < 1000; i++) {
    if (isScheduledOn(schedule, current)) {
      if (completedDates.has(current)) {
        streak++;
      } else {
        break;
      }
    }
    current = addDays(current, -1);
  }
  return streak;
}

function calcXPerWeekStreak(times: number, entries: EntryRecord[], asOfDate: string): number {
  let streak = 0;
  let { start } = getWeekRange(asOfDate);
  for (let w = 0; w < 200; w++) {
    const weekStart = start;
    const weekEnd = addDays(weekStart, 6);
    const count = entries.filter((e) => e.completed && e.date >= weekStart && e.date <= weekEnd).length;
    if (count >= times) {
      streak++;
    } else {
      break;
    }
    start = addDays(weekStart, -7);
  }
  return streak;
}

function calcXPerMonthStreak(times: number, entries: EntryRecord[], asOfDate: string): number {
  let streak = 0;
  const d = parseDate(asOfDate);
  let year = d.getFullYear();
  let month = d.getMonth();
  for (let m = 0; m < 120; m++) {
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const count = entries.filter((e) => e.completed && e.date.startsWith(monthStr)).length;
    if (count >= times) {
      streak++;
    } else {
      break;
    }
    month--;
    if (month < 0) { month = 11; year--; }
  }
  return streak;
}
