import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

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

describe('habits data operations', () => {
  it('creates a habit and retrieves it', () => {
    const result = db.prepare(
      "INSERT INTO habits (name, type, schedule, created_at) VALUES (?, ?, ?, ?)"
    ).run('Meditate', 'yes_no', '{"type":"daily"}', '2026-03-17T00:00:00Z');
    const habit = db.prepare("SELECT * FROM habits WHERE id = ?").get(result.lastInsertRowid);
    expect(habit).toBeDefined();
    expect((habit as any).name).toBe('Meditate');
  });

  it('lists only non-archived habits', () => {
    db.prepare("INSERT INTO habits (name, type, schedule, created_at) VALUES (?, ?, ?, ?)").run('Active', 'yes_no', '{"type":"daily"}', '2026-03-17T00:00:00Z');
    db.prepare("INSERT INTO habits (name, type, schedule, created_at, archived_at) VALUES (?, ?, ?, ?, ?)").run('Archived', 'yes_no', '{"type":"daily"}', '2026-03-17T00:00:00Z', '2026-03-17T00:00:00Z');
    const active = db.prepare("SELECT * FROM habits WHERE archived_at IS NULL").all();
    expect(active).toHaveLength(1);
    expect((active[0] as any).name).toBe('Active');
  });

  it('creates a multi-step habit with steps', () => {
    const result = db.prepare("INSERT INTO habits (name, type, schedule, created_at) VALUES (?, ?, ?, ?)").run('Morning Routine', 'multi_step', '{"type":"daily"}', '2026-03-17T00:00:00Z');
    const habitId = result.lastInsertRowid;
    db.prepare("INSERT INTO habit_steps (habit_id, name, sort_order) VALUES (?, ?, ?)").run(habitId, 'Shower', 1);
    db.prepare("INSERT INTO habit_steps (habit_id, name, sort_order) VALUES (?, ?, ?)").run(habitId, 'Brush teeth', 2);
    const steps = db.prepare("SELECT * FROM habit_steps WHERE habit_id = ? ORDER BY sort_order").all(habitId);
    expect(steps).toHaveLength(2);
  });

  it('archives a habit by setting archived_at', () => {
    db.prepare("INSERT INTO habits (name, type, schedule, created_at) VALUES (?, ?, ?, ?)").run('Run', 'yes_no', '{"type":"daily"}', '2026-03-17T00:00:00Z');
    db.prepare("UPDATE habits SET archived_at = ? WHERE id = ?").run('2026-03-17T12:00:00Z', 1);
    const habit = db.prepare("SELECT * FROM habits WHERE id = 1").get() as any;
    expect(habit.archived_at).toBe('2026-03-17T12:00:00Z');
  });
});
