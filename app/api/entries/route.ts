import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/connection';
import { initDb } from '@/db/init';

function db() {
  const d = getDb();
  initDb(d);
  return d;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const habitId = searchParams.get('habit_id');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const date = searchParams.get('date');
  const d = db();

  let query = 'SELECT * FROM entries WHERE 1=1';
  const params: any[] = [];
  if (habitId) { query += ' AND habit_id = ?'; params.push(habitId); }
  if (date) { query += ' AND date = ?'; params.push(date); }
  if (startDate) { query += ' AND date >= ?'; params.push(startDate); }
  if (endDate) { query += ' AND date <= ?'; params.push(endDate); }
  query += ' ORDER BY date DESC';

  const entries = d.prepare(query).all(...params) as any[];
  const stepsStmt = d.prepare('SELECT * FROM entry_steps WHERE entry_id = ?');
  const result = entries.map((e) => ({ ...e, steps: stepsStmt.all(e.id) }));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { habit_id, date, value, note, steps } = body;
  const now = new Date().toISOString();
  const d = db();
  const result = d.prepare('INSERT INTO entries (habit_id, date, value, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(habit_id, date, value ?? null, note || null, now, now);
  const entryId = result.lastInsertRowid;
  if (steps?.length) {
    const insert = d.prepare('INSERT INTO entry_steps (entry_id, habit_step_id, completed) VALUES (?, ?, ?)');
    for (const s of steps) { insert.run(entryId, s.habit_step_id, s.completed ? 1 : 0); }
  }
  const entry = d.prepare('SELECT * FROM entries WHERE id = ?').get(entryId);
  const entrySteps = d.prepare('SELECT * FROM entry_steps WHERE entry_id = ?').all(entryId);
  return NextResponse.json({ ...entry as any, steps: entrySteps }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { habit_id, date, value, note, steps } = body;
  const now = new Date().toISOString();
  const d = db();
  const existing = d.prepare('SELECT * FROM entries WHERE habit_id = ? AND date = ?').get(habit_id, date) as any;
  if (!existing) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  if (value !== undefined) d.prepare('UPDATE entries SET value = ?, updated_at = ? WHERE id = ?').run(value, now, existing.id);
  if (note !== undefined) d.prepare('UPDATE entries SET note = ?, updated_at = ? WHERE id = ?').run(note, now, existing.id);
  if (steps?.length) {
    d.prepare('DELETE FROM entry_steps WHERE entry_id = ?').run(existing.id);
    const insert = d.prepare('INSERT INTO entry_steps (entry_id, habit_step_id, completed) VALUES (?, ?, ?)');
    for (const s of steps) { insert.run(existing.id, s.habit_step_id, s.completed ? 1 : 0); }
  }
  const updated = d.prepare('SELECT * FROM entries WHERE id = ?').get(existing.id);
  const updatedSteps = d.prepare('SELECT * FROM entry_steps WHERE entry_id = ?').all(existing.id);
  return NextResponse.json({ ...updated as any, steps: updatedSteps });
}
