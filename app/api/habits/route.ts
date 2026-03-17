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
  const includeArchived = searchParams.get('include_archived') === 'true';
  const query = includeArchived
    ? 'SELECT * FROM habits ORDER BY created_at DESC'
    : 'SELECT * FROM habits WHERE archived_at IS NULL ORDER BY created_at DESC';
  const habits = db().prepare(query).all();
  return NextResponse.json(habits.map((h: any) => ({ ...h, schedule: JSON.parse(h.schedule) })));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, type, schedule, unit, target, steps } = body;
  const now = new Date().toISOString();
  const d = db();
  const result = d.prepare('INSERT INTO habits (name, type, schedule, unit, target, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(name, type, JSON.stringify(schedule), unit || null, target || null, now);
  const habitId = result.lastInsertRowid;
  if (type === 'multi_step' && steps?.length) {
    const insert = d.prepare('INSERT INTO habit_steps (habit_id, name, sort_order) VALUES (?, ?, ?)');
    steps.forEach((s: { name: string }, i: number) => { insert.run(habitId, s.name, i + 1); });
  }
  const habit = d.prepare('SELECT * FROM habits WHERE id = ?').get(habitId);
  return NextResponse.json({ ...habit as any, schedule: JSON.parse((habit as any).schedule) }, { status: 201 });
}
