import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/connection';
import { initDb } from '@/db/init';

function db() {
  const d = getDb();
  initDb(d);
  return d;
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const habitIds = Array.isArray(body?.habitIds) ? body.habitIds : null;

  if (!habitIds || habitIds.some((id) => !Number.isInteger(id))) {
    return NextResponse.json({ error: 'habitIds must be an array of integers' }, { status: 400 });
  }

  const d = db();
  const activeHabits = d.prepare(
    'SELECT id FROM habits WHERE archived_at IS NULL ORDER BY sort_order ASC, id DESC'
  ).all() as { id: number }[];
  const activeIds = activeHabits.map((habit) => habit.id);

  if (habitIds.length !== activeIds.length) {
    return NextResponse.json({ error: 'habitIds must include every active habit exactly once' }, { status: 400 });
  }

  const requestedIds = [...habitIds].sort((a, b) => a - b);
  const expectedIds = [...activeIds].sort((a, b) => a - b);
  const isValid = requestedIds.every((id, index) => id === expectedIds[index]);

  if (!isValid) {
    return NextResponse.json({ error: 'habitIds must include every active habit exactly once' }, { status: 400 });
  }

  const update = d.prepare('UPDATE habits SET sort_order = ? WHERE id = ?');
  const reorder = d.transaction((ids: number[]) => {
    ids.forEach((id, index) => {
      update.run(index + 1, id);
    });
  });

  reorder(habitIds);

  const reordered = d.prepare(
    'SELECT * FROM habits WHERE archived_at IS NULL ORDER BY sort_order ASC, id DESC'
  ).all() as any[];

  return NextResponse.json(reordered.map((habit) => ({
    ...habit,
    schedule: JSON.parse(habit.schedule),
  })));
}
