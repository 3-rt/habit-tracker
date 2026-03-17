import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const TEST_DB = path.join(__dirname, 'test-entries-api.db');
let db: Database.Database;

beforeEach(() => {
  db = new Database(TEST_DB);
  db.pragma('foreign_keys = ON');
  const schema = fs.readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf-8');
  db.exec(schema);
  db.prepare("INSERT INTO habits (name, type, schedule, created_at, sort_order) VALUES (?, ?, ?, ?, ?)").run('Run', 'yes_no', '{"type":"daily"}', '2026-03-17T00:00:00Z', 1);
});

afterEach(() => {
  db.close();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

describe('entries data operations', () => {
  it('creates an entry', () => {
    const now = '2026-03-17T10:00:00Z';
    db.prepare("INSERT INTO entries (habit_id, date, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(1, '2026-03-17', 1, now, now);
    const entry = db.prepare("SELECT * FROM entries WHERE habit_id = 1 AND date = '2026-03-17'").get();
    expect(entry).toBeDefined();
    expect((entry as any).value).toBe(1);
  });

  it('updates an entry value', () => {
    const now = '2026-03-17T10:00:00Z';
    db.prepare("INSERT INTO entries (habit_id, date, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(1, '2026-03-17', 1, now, now);
    db.prepare("UPDATE entries SET value = ?, updated_at = ? WHERE habit_id = ? AND date = ?").run(0, '2026-03-17T12:00:00Z', 1, '2026-03-17');
    const entry = db.prepare("SELECT * FROM entries WHERE habit_id = 1 AND date = '2026-03-17'").get() as any;
    expect(entry.value).toBe(0);
  });

  it('filters entries by date range', () => {
    const now = '2026-03-17T10:00:00Z';
    db.prepare("INSERT INTO entries (habit_id, date, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(1, '2026-03-15', 1, now, now);
    db.prepare("INSERT INTO entries (habit_id, date, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(1, '2026-03-16', 1, now, now);
    db.prepare("INSERT INTO entries (habit_id, date, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(1, '2026-03-17', 1, now, now);
    const entries = db.prepare("SELECT * FROM entries WHERE habit_id = ? AND date >= ? AND date <= ?").all(1, '2026-03-16', '2026-03-17');
    expect(entries).toHaveLength(2);
  });

  it('handles multi-step entry with entry_steps', () => {
    db.prepare("INSERT INTO habits (name, type, schedule, created_at, sort_order) VALUES (?, ?, ?, ?, ?)").run('Morning', 'multi_step', '{"type":"daily"}', '2026-03-17T00:00:00Z', 2);
    const habitId = 2;
    db.prepare("INSERT INTO habit_steps (habit_id, name, sort_order) VALUES (?, ?, ?)").run(habitId, 'Step 1', 1);
    db.prepare("INSERT INTO habit_steps (habit_id, name, sort_order) VALUES (?, ?, ?)").run(habitId, 'Step 2', 2);
    const now = '2026-03-17T10:00:00Z';
    const result = db.prepare("INSERT INTO entries (habit_id, date, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(habitId, '2026-03-17', null, now, now);
    const entryId = result.lastInsertRowid;
    db.prepare("INSERT INTO entry_steps (entry_id, habit_step_id, completed) VALUES (?, ?, ?)").run(entryId, 1, 1);
    db.prepare("INSERT INTO entry_steps (entry_id, habit_step_id, completed) VALUES (?, ?, ?)").run(entryId, 2, 0);
    const steps = db.prepare("SELECT * FROM entry_steps WHERE entry_id = ?").all(entryId);
    expect(steps).toHaveLength(2);
  });
});
