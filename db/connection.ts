import Database from 'better-sqlite3';
import path from 'path';

const DEFAULT_DB_PATH = path.join(process.cwd(), 'habits.db');

let _db: Database.Database | null = null;

export function getDb(dbPath: string = DEFAULT_DB_PATH): Database.Database {
  if (_db && dbPath === DEFAULT_DB_PATH) return _db;
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  if (dbPath === DEFAULT_DB_PATH) _db = db;
  return db;
}
