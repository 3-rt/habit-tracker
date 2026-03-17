import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { calculateStreak } from '@/lib/streaks';
import type { Schedule } from '@/lib/types';

const TEST_DB = path.join(__dirname, 'test-stats-api.db');
let db: Database.Database;

beforeEach(() => {
  db = new Database(TEST_DB);
  db.pragma('foreign_keys = ON');
  const schema = fs.readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf-8');
  db.exec(schema);
});

afterEach(() => {
  db.close();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

describe('stats data operations', () => {
  it('calculates streak correctly for a daily habit with consecutive completions', () => {
    const schedule: Schedule = { type: 'daily' };
    const entries = [
      { date: '2026-03-17', completed: true },
      { date: '2026-03-16', completed: true },
      { date: '2026-03-15', completed: true },
      { date: '2026-03-14', completed: false },
    ];
    const streak = calculateStreak(schedule, entries, '2026-03-17');
    expect(streak).toBe(3);
  });

  it('returns streak of 0 when today is not completed', () => {
    const schedule: Schedule = { type: 'daily' };
    const entries = [
      { date: '2026-03-17', completed: false },
      { date: '2026-03-16', completed: true },
    ];
    const streak = calculateStreak(schedule, entries, '2026-03-17');
    expect(streak).toBe(0);
  });

  it('counts weekly completions correctly', () => {
    db.prepare("INSERT INTO habits (name, type, schedule, created_at) VALUES (?, ?, ?, ?)").run('Run', 'yes_no', '{"type":"daily"}', '2026-03-17T00:00:00Z');
    db.prepare("INSERT INTO habits (name, type, schedule, created_at) VALUES (?, ?, ?, ?)").run('Read', 'yes_no', '{"type":"daily"}', '2026-03-17T00:00:00Z');
    const now = '2026-03-17T10:00:00Z';
    // Week of 2026-03-16 (Mon) to 2026-03-22 (Sun)
    db.prepare("INSERT INTO entries (habit_id, date, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(1, '2026-03-16', 1, now, now);
    db.prepare("INSERT INTO entries (habit_id, date, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(1, '2026-03-17', 1, now, now);
    db.prepare("INSERT INTO entries (habit_id, date, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(2, '2026-03-17', 1, now, now);

    const weekEntries = db.prepare(
      "SELECT * FROM entries WHERE date >= ? AND date <= ?"
    ).all('2026-03-16', '2026-03-22') as any[];
    expect(weekEntries).toHaveLength(3);

    const completedEntries = weekEntries.filter((e: any) => e.value === 1);
    expect(completedEntries).toHaveLength(3);
  });

  it('calculates completion rate over a week window', () => {
    db.prepare("INSERT INTO habits (name, type, schedule, created_at) VALUES (?, ?, ?, ?)").run('Exercise', 'yes_no', '{"type":"daily"}', '2026-03-17T00:00:00Z');
    const now = '2026-03-17T10:00:00Z';
    // 5 out of 7 days completed
    for (const date of ['2026-03-11', '2026-03-12', '2026-03-13', '2026-03-14', '2026-03-15']) {
      db.prepare("INSERT INTO entries (habit_id, date, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(1, date, 1, now, now);
    }
    const weekEntries = db.prepare(
      "SELECT * FROM entries WHERE habit_id = ? AND date >= ? AND date <= ?"
    ).all(1, '2026-03-11', '2026-03-17') as any[];
    expect(weekEntries).toHaveLength(5);
    const completedCount = weekEntries.filter((e: any) => e.value === 1).length;
    const rate = Math.round((completedCount / 7) * 100);
    expect(rate).toBe(71);
  });

  it('handles multi-step habit completion check via entry_steps', () => {
    db.prepare("INSERT INTO habits (name, type, schedule, created_at) VALUES (?, ?, ?, ?)").run('Morning Routine', 'multi_step', '{"type":"daily"}', '2026-03-17T00:00:00Z');
    db.prepare("INSERT INTO habit_steps (habit_id, name, sort_order) VALUES (?, ?, ?)").run(1, 'Step 1', 1);
    db.prepare("INSERT INTO habit_steps (habit_id, name, sort_order) VALUES (?, ?, ?)").run(1, 'Step 2', 2);
    const now = '2026-03-17T10:00:00Z';
    const result = db.prepare("INSERT INTO entries (habit_id, date, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(1, '2026-03-17', null, now, now);
    const entryId = result.lastInsertRowid;
    // Complete both steps
    db.prepare("INSERT INTO entry_steps (entry_id, habit_step_id, completed) VALUES (?, ?, ?)").run(entryId, 1, 1);
    db.prepare("INSERT INTO entry_steps (entry_id, habit_step_id, completed) VALUES (?, ?, ?)").run(entryId, 2, 1);

    const stepCount = db.prepare("SELECT COUNT(*) as c FROM habit_steps WHERE habit_id = ?").get(1) as any;
    const doneCount = db.prepare("SELECT COUNT(*) as c FROM entry_steps WHERE entry_id = ? AND completed = 1").get(entryId) as any;
    const isComplete = stepCount.c > 0 && doneCount.c >= stepCount.c;
    expect(isComplete).toBe(true);
  });
});
