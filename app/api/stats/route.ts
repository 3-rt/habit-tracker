import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/connection';
import { initDb } from '@/db/init';
import { calculateStreak } from '@/lib/streaks';
import { addDays, getMonthRange, getWeekRange, toDateStr } from '@/lib/date-utils';
import { isVisibleToday } from '@/lib/schedule';
import type { MonthlySummary, MonthlySummaryDay, Schedule } from '@/lib/types';

function db() {
  const d = getDb();
  initDb(d);
  return d;
}

function isHabitCompletedOnDate(d: ReturnType<typeof db>, habit: any, date: string): boolean {
  if (habit.type === 'multi_step') {
    const entry = d.prepare('SELECT id FROM entries WHERE habit_id = ? AND date = ?').get(habit.id, date) as any;
    if (!entry) return false;
    const stepCount = d.prepare('SELECT COUNT(*) as c FROM habit_steps WHERE habit_id = ?').get(habit.id) as any;
    const doneCount = d.prepare('SELECT COUNT(*) as c FROM entry_steps WHERE entry_id = ? AND completed = 1').get(entry.id) as any;
    return stepCount.c > 0 && doneCount.c >= stepCount.c;
  }

  const entry = d.prepare('SELECT value FROM entries WHERE habit_id = ? AND date = ?').get(habit.id, date) as any;
  if (!entry) return false;
  return habit.type === 'yes_no' ? entry.value === 1 : entry.value != null && entry.value > 0;
}

function getPeriodCompletions(d: ReturnType<typeof db>, habit: any, date: string): number {
  const schedule: Schedule = JSON.parse(habit.schedule);
  if (schedule.type === 'x_per_week') {
    const { start, end } = getWeekRange(date);
    const entries = d.prepare('SELECT date FROM entries WHERE habit_id = ? AND date >= ? AND date <= ? ORDER BY date ASC')
      .all(habit.id, start, end) as { date: string }[];
    return entries.filter((entry) => isHabitCompletedOnDate(d, habit, entry.date)).length;
  }

  if (schedule.type === 'x_per_month') {
    const { start, end } = getMonthRange(date);
    const entries = d.prepare('SELECT date FROM entries WHERE habit_id = ? AND date >= ? AND date <= ? ORDER BY date ASC')
      .all(habit.id, start, end) as { date: string }[];
    return entries.filter((entry) => isHabitCompletedOnDate(d, habit, entry.date)).length;
  }

  return 0;
}

function calculateLongestRun(days: MonthlySummaryDay[]): number {
  let longest = 0;
  let current = 0;

  for (const day of days) {
    if (day.fully_completed) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  return longest;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const habitId = searchParams.get('habit_id');
  const monthParam = searchParams.get('month');
  const today = toDateStr(new Date());
  const d = db();

  let habits: any[];
  if (habitId) {
    habits = d.prepare('SELECT * FROM habits WHERE id = ?').all(habitId);
  } else {
    habits = d.prepare('SELECT * FROM habits WHERE archived_at IS NULL').all();
  }

  const { start: weekStart, end: weekEnd } = getWeekRange(today);

    const stats = habits.map((h: any) => {
    const schedule: Schedule = JSON.parse(h.schedule);
    const entries = d.prepare('SELECT date, value FROM entries WHERE habit_id = ? ORDER BY date DESC').all(h.id) as any[];

    const entryRecords = entries.map((e: any) => {
      return { date: e.date, completed: isHabitCompletedOnDate(d, h, e.date) };
    });

    const currentStreak = calculateStreak(schedule, entryRecords, today);

    const weekEntries = entries.filter((e: any) => e.date >= weekStart && e.date <= weekEnd);
    const weekCompleted = weekEntries.filter((e: any) => isHabitCompletedOnDate(d, h, e.date)).length;

    return {
      habit_id: h.id,
      habit_name: h.name,
      current_streak: currentStreak,
      completion_rate_7d: weekEntries.length > 0 ? Math.round((weekCompleted / 7) * 100) : 0,
    };
  });

  const allHabitIds = habits.map((h: any) => h.id);
  const weeklySummary: any[] = [];
  const current = new Date(weekStart);
  const endDate = new Date(weekEnd);
  while (current <= endDate) {
    const dateStr = toDateStr(current);
    const total = allHabitIds.length;
    const nonMultiStepIds = habits.filter((h: any) => h.type !== 'multi_step').map((h: any) => h.id);
    const multiStepIds = habits.filter((h: any) => h.type === 'multi_step').map((h: any) => h.id);
    let completedCount = 0;
    if (nonMultiStepIds.length > 0) {
      const r = d.prepare(`SELECT COUNT(DISTINCT habit_id) as c FROM entries WHERE date = ? AND habit_id IN (${nonMultiStepIds.join(',')}) AND value IS NOT NULL AND value > 0`).get(dateStr) as any;
      completedCount += r?.c || 0;
    }
    for (const msId of multiStepIds) {
      const entry = d.prepare('SELECT id FROM entries WHERE habit_id = ? AND date = ?').get(msId, dateStr) as any;
      if (entry) {
        const stepCount = d.prepare('SELECT COUNT(*) as c FROM habit_steps WHERE habit_id = ?').get(msId) as any;
        const doneCount = d.prepare('SELECT COUNT(*) as c FROM entry_steps WHERE entry_id = ? AND completed = 1').get(entry.id) as any;
        if (stepCount.c > 0 && doneCount.c >= stepCount.c) completedCount++;
      }
    }
    weeklySummary.push({ date: dateStr, completed: completedCount, total });
    current.setDate(current.getDate() + 1);
  }

  const selectedMonth = monthParam ?? today.slice(0, 7);
  const { start: monthStart, end: monthEnd } = getMonthRange(`${selectedMonth}-01`);
  const monthlyDays: MonthlySummaryDay[] = [];
  let monthCursor = monthStart;
  while (monthCursor <= monthEnd) {
    const dayHabits = habits.filter((habit: any) => {
      const schedule: Schedule = JSON.parse(habit.schedule);
      const periodCompletions = getPeriodCompletions(d, habit, monthCursor);
      return isVisibleToday(schedule, monthCursor, periodCompletions);
    });
    const completed = dayHabits.filter((habit: any) => isHabitCompletedOnDate(d, habit, monthCursor)).length;
    const scheduled = dayHabits.length;
    const completionRate = scheduled > 0 ? completed / scheduled : 0;
    monthlyDays.push({
      date: monthCursor,
      scheduled,
      completed,
      completion_rate: completionRate,
      fully_completed: scheduled > 0 && completed === scheduled,
    });
    monthCursor = addDays(monthCursor, 1);
  }

  const scheduledTotal = monthlyDays.reduce((sum, day) => sum + day.scheduled, 0);
  const completedTotal = monthlyDays.reduce((sum, day) => sum + day.completed, 0);
  const monthlySummary: MonthlySummary = {
    month: selectedMonth,
    days: monthlyDays,
    fully_completed_days: monthlyDays.filter((day) => day.fully_completed).length,
    completion_rate: scheduledTotal > 0 ? completedTotal / scheduledTotal : 0,
    longest_streak_in_month: calculateLongestRun(monthlyDays),
  };

  return NextResponse.json({ stats, weeklySummary, monthlySummary });
}
