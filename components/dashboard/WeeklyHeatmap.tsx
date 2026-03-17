'use client';

import type { WeeklySummary } from '@/lib/types';

interface WeeklyHeatmapProps {
  data: WeeklySummary[];
}

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getColorIntensity(completed: number, total: number): string {
  if (total === 0) return 'bg-surface-light';
  const ratio = completed / total;
  if (ratio >= 1) return 'bg-done';
  if (ratio >= 0.75) return 'bg-done/75';
  if (ratio >= 0.5) return 'bg-done/50';
  if (ratio >= 0.25) return 'bg-done/25';
  if (ratio > 0) return 'bg-done/10';
  return 'bg-surface-light';
}

export default function WeeklyHeatmap({ data }: WeeklyHeatmapProps) {
  // Ensure we have 7 days, fill missing with zeros
  const padded: WeeklySummary[] = [];
  for (let i = 0; i < 7; i++) {
    padded.push(data[i] ?? { date: '', completed: 0, total: 0 });
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {dayLabels.map((label, i) => (
        <div key={label} className="text-center">
          <div className="text-xs text-gray-500 mb-1">{label}</div>
          <div
            className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium ${getColorIntensity(
              padded[i].completed,
              padded[i].total
            )}`}
            title={padded[i].date ? `${padded[i].date}: ${padded[i].completed}/${padded[i].total}` : 'No data'}
          >
            {padded[i].total > 0 ? `${padded[i].completed}/${padded[i].total}` : '-'}
          </div>
        </div>
      ))}
    </div>
  );
}
