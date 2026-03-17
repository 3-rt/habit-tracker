import type { Schedule } from './types';
import { getDayOfWeek, daysBetween, parseDate, getMonthRange } from './date-utils';

export function isScheduledOn(schedule: Schedule, dateStr: string): boolean {
  switch (schedule.type) {
    case 'daily':
      return true;
    case 'weekly':
      return schedule.days.includes(getDayOfWeek(dateStr));
    case 'interval': {
      const diff = daysBetween(schedule.start, dateStr);
      return diff >= 0 && diff % schedule.every === 0;
    }
    case 'monthly': {
      const d = parseDate(dateStr);
      const { end } = getMonthRange(dateStr);
      const lastDay = parseInt(end.split('-')[2], 10);
      const targetDay = Math.min(schedule.day, lastDay);
      return d.getDate() === targetDay;
    }
    case 'x_per_week':
    case 'x_per_month':
      return true;
  }
}

export function isVisibleToday(schedule: Schedule, dateStr: string, periodCompletions: number): boolean {
  switch (schedule.type) {
    case 'x_per_week':
      return periodCompletions < schedule.times;
    case 'x_per_month':
      return periodCompletions < schedule.times;
    default:
      return isScheduledOn(schedule, dateStr);
  }
}
