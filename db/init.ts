import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

function ensureHabitSortOrder(db: Database.Database): void {
  const columns = db.prepare('PRAGMA table_info(habits)').all() as { name: string }[];
  const hasSortOrder = columns.some((column) => column.name === 'sort_order');

  if (!hasSortOrder) {
    db.exec('ALTER TABLE habits ADD COLUMN sort_order INTEGER');
  }

  const rows = db.prepare(
    'SELECT id FROM habits WHERE sort_order IS NULL ORDER BY created_at DESC, id DESC'
  ).all() as { id: number }[];

  if (rows.length === 0) return;

  const nextSortOrder = db.prepare(
    'SELECT COALESCE(MAX(sort_order), 0) AS maxSortOrder FROM habits'
  ).get() as { maxSortOrder: number };
  const update = db.prepare('UPDATE habits SET sort_order = ? WHERE id = ?');

  const backfill = db.transaction((habitRows: { id: number }[]) => {
    habitRows.forEach((row, index) => {
      update.run(nextSortOrder.maxSortOrder + index + 1, row.id);
    });
  });

  backfill(rows);
}

export function initDb(db: Database.Database): void {
  const schemaPath = path.join(process.cwd(), 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  ensureHabitSortOrder(db);
}
