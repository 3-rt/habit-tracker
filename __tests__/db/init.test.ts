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
    db.close();
  });

  it('enforces unique constraint on entries (habit_id, date)', () => {
    const db = getDb(TEST_DB);
    initDb(db);

    db.prepare(
      "INSERT INTO habits (name, type, schedule, created_at) VALUES ('Test', 'yes_no', '{\"type\":\"daily\"}', '2026-03-17T00:00:00Z')"
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
