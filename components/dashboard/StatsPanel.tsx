'use client';

import { useState, useEffect } from 'react';
import type { HabitStats, WeeklySummary } from '@/lib/types';
import WeeklyHeatmap from './WeeklyHeatmap';

interface StatsResponse {
  stats: HabitStats[];
  weeklySummary: WeeklySummary[];
}

export default function StatsPanel() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  const weeklyCompletionRate = data?.weeklySummary
    ? (() => {
        const totalCompleted = data.weeklySummary.reduce((sum, d) => sum + d.completed, 0);
        const totalPossible = data.weeklySummary.reduce((sum, d) => sum + d.total, 0);
        return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
      })()
    : 0;

  if (loading) {
    return (
      <div className="flex-1">
        <div className="bg-surface rounded-xl p-5 space-y-4">
          <div className="h-6 w-32 bg-surface-light rounded animate-pulse" />
          <div className="h-20 bg-surface-light rounded animate-pulse" />
          <div className="h-6 w-24 bg-surface-light rounded animate-pulse" />
          <div className="h-32 bg-surface-light rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="bg-surface rounded-xl p-5 space-y-6">
        {/* Weekly completion rate */}
        <div>
          <h2 className="text-lg font-semibold mb-3">This Week</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-done">{weeklyCompletionRate}%</span>
            <span className="text-sm text-gray-400">completion rate</span>
          </div>
        </div>

        {/* Streaks */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Streaks</h3>
          {data?.stats && data.stats.length > 0 ? (
            <div className="space-y-2">
              {data.stats.map((stat) => (
                <div key={stat.habit_id} className="flex items-center justify-between">
                  <span className="text-sm">{stat.habit_name}</span>
                  <span className="text-sm font-medium">
                    {stat.current_streak > 0 && (
                      <span className="mr-1" role="img" aria-label="fire">🔥</span>
                    )}
                    {stat.current_streak} day{stat.current_streak !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No streak data yet.</p>
          )}
        </div>

        {/* Weekly Heatmap */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Weekly Heatmap</h3>
          <WeeklyHeatmap data={data?.weeklySummary ?? []} />
        </div>
      </div>
    </div>
  );
}
