import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/connection';
import { initDb } from '@/db/init';
import { calculateStreak } from '@/lib/streaks';
import { getWeekRange, toDateStr } from '@/lib/date-utils';
import type { Schedule } from '@/lib/types';

function db() {
  const d = getDb();
  initDb(d);
  return d;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const habitId = searchParams.get('habit_id');
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
      let completed = false;
      if (h.type === 'multi_step') {
        const entry = d.prepare('SELECT id FROM entries WHERE habit_id = ? AND date = ?').get(h.id, e.date) as any;
        if (entry) {
          const stepCount = d.prepare('SELECT COUNT(*) as c FROM habit_steps WHERE habit_id = ?').get(h.id) as any;
          const doneCount = d.prepare('SELECT COUNT(*) as c FROM entry_steps WHERE entry_id = ? AND completed = 1').get(entry.id) as any;
          completed = stepCount.c > 0 && doneCount.c >= stepCount.c;
        }
      } else {
        completed = h.type === 'yes_no' ? e.value === 1 : e.value != null && e.value > 0;
      }
      return { date: e.date, completed };
    });

    const currentStreak = calculateStreak(schedule, entryRecords, today);

    const weekEntries = entries.filter((e: any) => e.date >= weekStart && e.date <= weekEnd);
    const weekCompleted = weekEntries.filter((e: any) => {
      if (h.type === 'multi_step') {
        const entry = d.prepare('SELECT id FROM entries WHERE habit_id = ? AND date = ?').get(h.id, e.date) as any;
        if (!entry) return false;
        const stepCount = d.prepare('SELECT COUNT(*) as c FROM habit_steps WHERE habit_id = ?').get(h.id) as any;
        const doneCount = d.prepare('SELECT COUNT(*) as c FROM entry_steps WHERE entry_id = ? AND completed = 1').get(entry.id) as any;
        return stepCount.c > 0 && doneCount.c >= stepCount.c;
      }
      if (h.type === 'yes_no') return e.value === 1;
      return e.value != null && e.value > 0;
    }).length;

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

  return NextResponse.json({ stats, weeklySummary });
}
