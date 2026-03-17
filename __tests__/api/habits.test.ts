import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

vi.mock('@/db/connection', () => ({
  getDb: () => db,
}));

const TEST_DB = path.join(__dirname, 'test-habits-api.db');
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

function insertHabit(name: string, sortOrder: number, createdAt: string, archivedAt: string | null = null) {
  db.prepare(
    'INSERT INTO habits (name, type, schedule, created_at, sort_order, archived_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, 'yes_no', '{"type":"daily"}', createdAt, sortOrder, archivedAt);
}

describe('habits data operations', () => {
  it('creates a habit and retrieves it', () => {
    const result = db.prepare(
      'INSERT INTO habits (name, type, schedule, created_at, sort_order) VALUES (?, ?, ?, ?, ?)'
    ).run('Meditate', 'yes_no', '{"type":"daily"}', '2026-03-17T00:00:00Z', 1);
    const habit = db.prepare("SELECT * FROM habits WHERE id = ?").get(result.lastInsertRowid);
    expect(habit).toBeDefined();
    expect((habit as any).name).toBe('Meditate');
  });

  it('lists only non-archived habits in saved order', async () => {
    insertHabit('Gym', 2, '2026-03-17T00:00:00Z');
    insertHabit('Skincare', 1, '2026-03-16T00:00:00Z');
    insertHabit('Archived', 3, '2026-03-15T00:00:00Z', '2026-03-18T00:00:00Z');

    const { GET } = await import('@/app/api/habits/route');
    const res = await GET(new NextRequest('http://localhost/api/habits'));
    const habits = await res.json();

    expect(habits).toHaveLength(2);
    expect(habits.map((habit: any) => habit.name)).toEqual(['Skincare', 'Gym']);
  });

  it('creates a multi-step habit with steps', () => {
    const result = db.prepare('INSERT INTO habits (name, type, schedule, created_at, sort_order) VALUES (?, ?, ?, ?, ?)').run('Morning Routine', 'multi_step', '{"type":"daily"}', '2026-03-17T00:00:00Z', 1);
    const habitId = result.lastInsertRowid;
    db.prepare("INSERT INTO habit_steps (habit_id, name, sort_order) VALUES (?, ?, ?)").run(habitId, 'Shower', 1);
    db.prepare("INSERT INTO habit_steps (habit_id, name, sort_order) VALUES (?, ?, ?)").run(habitId, 'Brush teeth', 2);
    const steps = db.prepare("SELECT * FROM habit_steps WHERE habit_id = ? ORDER BY sort_order").all(habitId);
    expect(steps).toHaveLength(2);
  });

  it('archives a habit by setting archived_at', () => {
    db.prepare('INSERT INTO habits (name, type, schedule, created_at, sort_order) VALUES (?, ?, ?, ?, ?)').run('Run', 'yes_no', '{"type":"daily"}', '2026-03-17T00:00:00Z', 1);
    db.prepare("UPDATE habits SET archived_at = ? WHERE id = ?").run('2026-03-17T12:00:00Z', 1);
    const habit = db.prepare("SELECT * FROM habits WHERE id = 1").get() as any;
    expect(habit.archived_at).toBe('2026-03-17T12:00:00Z');
  });

  it('appends new habits to the end of the active list', async () => {
    insertHabit('Skincare', 1, '2026-03-17T00:00:00Z');
    insertHabit('Gym', 2, '2026-03-18T00:00:00Z');
    insertHabit('Archived', 99, '2026-03-19T00:00:00Z', '2026-03-20T00:00:00Z');

    const { POST } = await import('@/app/api/habits/route');
    const req = new NextRequest('http://localhost/api/habits', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Read',
        type: 'yes_no',
        schedule: { type: 'daily' },
      }),
    });

    const res = await POST(req);
    const habit = await res.json();

    expect(habit.sort_order).toBe(3);
  });
});
