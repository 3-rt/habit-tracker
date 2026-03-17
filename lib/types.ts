// Schedule types
export type ScheduleDaily = { type: 'daily' };
export type ScheduleWeekly = { type: 'weekly'; days: string[] };
export type ScheduleInterval = { type: 'interval'; every: number; start: string };
export type ScheduleXPerWeek = { type: 'x_per_week'; times: number };
export type ScheduleXPerMonth = { type: 'x_per_month'; times: number };
export type ScheduleMonthly = { type: 'monthly'; day: number };

export type Schedule =
  | ScheduleDaily
  | ScheduleWeekly
  | ScheduleInterval
  | ScheduleXPerWeek
  | ScheduleXPerMonth
  | ScheduleMonthly;

export type HabitType = 'yes_no' | 'numeric' | 'timed' | 'multi_step';

export interface Habit {
  id: number;
  name: string;
  type: HabitType;
  schedule: Schedule;
  unit: string | null;
  target: number | null;
  sort_order: number;
  created_at: string;
  archived_at: string | null;
}

export interface HabitStep {
  id: number;
  habit_id: number;
  name: string;
  sort_order: number;
}

export interface Entry {
  id: number;
  habit_id: number;
  date: string;
  value: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface EntryStep {
  id: number;
  entry_id: number;
  habit_step_id: number;
  completed: number; // 0 or 1
}

export interface HabitWithSteps extends Habit {
  steps: HabitStep[];
}

export interface EntryWithSteps extends Entry {
  steps: EntryStep[];
}

export interface HabitStats {
  habit_id: number;
  habit_name: string;
  current_streak: number;
  longest_streak: number;
  completion_rate_7d: number;
}

export interface WeeklySummary {
  date: string;
  completed: number;
  total: number;
}
