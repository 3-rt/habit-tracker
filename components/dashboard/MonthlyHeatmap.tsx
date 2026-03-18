'use client';

import type { MonthlySummaryDay } from '@/lib/types';

interface MonthlyHeatmapProps {
  month: string;
  days: MonthlySummaryDay[];
}

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getColor(completionRate: number, scheduled: number): string {
  if (scheduled === 0) return 'bg-surface-light text-gray-500';
  if (completionRate >= 1) return 'bg-done text-background';
  if (completionRate >= 0.75) return 'bg-done/75 text-white';
  if (completionRate >= 0.5) return 'bg-done/50 text-white';
  if (completionRate > 0) return 'bg-done/25 text-white';
  return 'bg-surface-light text-gray-400';
}

function getDaysInMonth(month: string): number {
  const [year, monthNum] = month.split('-').map(Number);
  return new Date(year, monthNum, 0).getDate();
}

function getFirstDayOffset(month: string): number {
  const [year, monthNum] = month.split('-').map(Number);
  const day = new Date(year, monthNum - 1, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export default function MonthlyHeatmap({ month, days }: MonthlyHeatmapProps) {
  const dayMap = new Map(days.map((day) => [day.date, day]));
  const [year, monthNum] = month.split('-').map(Number);
  const daysInMonth = getDaysInMonth(month);
  const offset = getFirstDayOffset(month);
  const cells: Array<number | null> = [];

  for (let i = 0; i < offset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="grid grid-cols-7 gap-2">
      {dayLabels.map((label) => (
        <div key={label} className="text-center text-xs text-gray-500">
          {label}
        </div>
      ))}
      {cells.map((day, index) => {
        if (!day) return <div key={`blank-${index}`} className="aspect-square" />;

        const date = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const summary = dayMap.get(date) ?? {
          date,
          scheduled: 0,
          completed: 0,
          completion_rate: 0,
          fully_completed: false,
        };

        return (
          <div
            key={date}
            title={`${date}: ${summary.completed}/${summary.scheduled}`}
            className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium ${getColor(
              summary.completion_rate,
              summary.scheduled
            )}`}
          >
            {day}
          </div>
        );
      })}
    </div>
  );
}
