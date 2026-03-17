import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getDb } from '@/db/connection';
import { initDb } from '@/db/init';

const TEST_DB = path.join(__dirname, 'test-habits.db');

afterEach(() => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

describe('Database initialization', () => {
  it('creates all tables', () => {
    const db = getDb(TEST_DB);
    initDb(db);

    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all() as { name: string }[];

    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain('habits');
    expect(tableNames).toContain('habit_steps');
    expect(tableNames).toContain('entries');
    expect(tableNames).toContain('entry_steps');
    const columns = db.prepare("PRAGMA table_info(habits)").all() as { name: string; notnull: number }[];
    const sortOrderColumn = columns.find((column) => column.name === 'sort_order');
    expect(sortOrderColumn).toBeDefined();
    expect(sortOrderColumn?.notnull).toBe(1);
    db.close();
  });

  it('backfills sort order for legacy habits in previous display order', () => {
    const db = getDb(TEST_DB);
    db.exec(`
      CREATE TABLE habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('yes_no', 'numeric', 'timed', 'multi_step')),
        schedule TEXT NOT NULL,
        unit TEXT,
        target REAL,
        created_at TEXT NOT NULL,
        archived_at TEXT
      );
    `);

    db.prepare(
      "INSERT INTO habits (name, type, schedule, created_at) VALUES (?, ?, ?, ?)"
    ).run('Oldest', 'yes_no', '{"type":"daily"}', '2026-03-15T00:00:00Z');
    db.prepare(
      "INSERT INTO habits (name, type, schedule, created_at) VALUES (?, ?, ?, ?)"
    ).run('Middle', 'yes_no', '{"type":"daily"}', '2026-03-16T00:00:00Z');
    db.prepare(
      "INSERT INTO habits (name, type, schedule, created_at) VALUES (?, ?, ?, ?)"
    ).run('Newest', 'yes_no', '{"type":"daily"}', '2026-03-17T00:00:00Z');

    initDb(db);

    const rows = db.prepare(
      "SELECT name, sort_order FROM habits ORDER BY sort_order ASC"
    ).all() as { name: string; sort_order: number }[];

    expect(rows.map((row) => row.name)).toEqual(['Newest', 'Middle', 'Oldest']);
    expect(rows.map((row) => row.sort_order)).toEqual([1, 2, 3]);
    db.close();
  });

  it('enforces unique constraint on entries (habit_id, date)', () => {
    const db = getDb(TEST_DB);
    initDb(db);

    db.prepare(
      "INSERT INTO habits (name, type, schedule, created_at, sort_order) VALUES ('Test', 'yes_no', '{\"type\":\"daily\"}', '2026-03-17T00:00:00Z', 1)"
    ).run();
    db.prepare(
      "INSERT INTO entries (habit_id, date, value, created_at, updated_at) VALUES (1, '2026-03-17', 1, '2026-03-17T00:00:00Z', '2026-03-17T00:00:00Z')"
    ).run();

    expect(() => {
      db.prepare(
        "INSERT INTO entries (habit_id, date, value, created_at, updated_at) VALUES (1, '2026-03-17', 0, '2026-03-17T00:00:00Z', '2026-03-17T00:00:00Z')"
      ).run();
    }).toThrow();
    db.close();
  });
});
