'use client';

import { useState, useEffect } from 'react';
import type { HabitStats, MonthlySummary, WeeklySummary } from '@/lib/types';
import WeeklyHeatmap from './WeeklyHeatmap';
import MonthlyHeatmap from './MonthlyHeatmap';

interface StatsResponse {
  stats: HabitStats[];
  weeklySummary: WeeklySummary[];
  monthlySummary: MonthlySummary;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(month: string, delta: number): string {
  const [year, monthNum] = month.split('-').map(Number);
  const date = new Date(year, monthNum - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(month: string): string {
  const [year, monthNum] = month.split('-').map(Number);
  return new Date(year, monthNum - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export default function StatsPanel() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(getCurrentMonth);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/stats?month=${month}`);
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
      setLoading(false);
    }
    fetchStats();
  }, [month]);

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

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">This Month</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMonth((current) => shiftMonth(current, -1))}
                className="p-1.5 rounded-md bg-surface-light hover:bg-surface-light/80 transition-colors"
                aria-label="Previous month"
              >
                &larr;
              </button>
              <span className="text-sm font-medium min-w-[120px] text-center">{formatMonth(month)}</span>
              <button
                onClick={() => setMonth((current) => shiftMonth(current, 1))}
                className="p-1.5 rounded-md bg-surface-light hover:bg-surface-light/80 transition-colors"
                aria-label="Next month"
              >
                &rarr;
              </button>
            </div>
          </div>

          <MonthlyHeatmap month={data?.monthlySummary.month ?? month} days={data?.monthlySummary.days ?? []} />

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-surface-light rounded-lg p-3">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Fully completed days</div>
              <div className="text-2xl font-bold text-done mt-1">{data?.monthlySummary.fully_completed_days ?? 0}</div>
            </div>
            <div className="bg-surface-light rounded-lg p-3">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Monthly completion</div>
              <div className="text-2xl font-bold mt-1">
                {Math.round((data?.monthlySummary.completion_rate ?? 0) * 100)}%
              </div>
            </div>
            <div className="bg-surface-light rounded-lg p-3">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Longest streak</div>
              <div className="text-2xl font-bold mt-1">{data?.monthlySummary.longest_streak_in_month ?? 0} days</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
