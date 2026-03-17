import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/connection';
import { initDb } from '@/db/init';

function db() {
  const d = getDb();
  initDb(d);
  return d;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const d = db();
  const habit = d.prepare('SELECT * FROM habits WHERE id = ?').get(params.id) as any;
  if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const steps = d.prepare('SELECT * FROM habit_steps WHERE habit_id = ? ORDER BY sort_order').all(params.id);
  return NextResponse.json({ ...habit, schedule: JSON.parse(habit.schedule), steps });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const d = db();
  const existing = d.prepare('SELECT * FROM habits WHERE id = ?').get(params.id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { name, schedule, unit, target, archived_at, steps } = body;
  if (name !== undefined) d.prepare('UPDATE habits SET name = ? WHERE id = ?').run(name, params.id);
  if (schedule !== undefined) d.prepare('UPDATE habits SET schedule = ? WHERE id = ?').run(JSON.stringify(schedule), params.id);
  if (unit !== undefined) d.prepare('UPDATE habits SET unit = ? WHERE id = ?').run(unit, params.id);
  if (target !== undefined) d.prepare('UPDATE habits SET target = ? WHERE id = ?').run(target, params.id);
  if (archived_at !== undefined) d.prepare('UPDATE habits SET archived_at = ? WHERE id = ?').run(archived_at, params.id);
  if (steps !== undefined) {
    d.prepare('DELETE FROM habit_steps WHERE habit_id = ?').run(params.id);
    const insert = d.prepare('INSERT INTO habit_steps (habit_id, name, sort_order) VALUES (?, ?, ?)');
    steps.forEach((s: { name: string }, i: number) => { insert.run(params.id, s.name, i + 1); });
  }
  const updated = d.prepare('SELECT * FROM habits WHERE id = ?').get(params.id) as any;
  const updatedSteps = d.prepare('SELECT * FROM habit_steps WHERE habit_id = ? ORDER BY sort_order').all(params.id);
  return NextResponse.json({ ...updated, schedule: JSON.parse(updated.schedule), steps: updatedSteps });
}
