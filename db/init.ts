import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export function initDb(db: Database.Database): void {
  const schemaPath = path.join(process.cwd(), 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
}
