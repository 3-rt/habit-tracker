'use client';

import { useEffect, useState } from 'react';
import type { MonthlySummary } from '@/lib/types';
import MonthlyHeatmap from '@/components/dashboard/MonthlyHeatmap';

interface InsightsResponse {
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

export default function InsightsPage() {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(getCurrentMonth);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/stats?month=${month}`);
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Failed to fetch insights:', error);
      }
      setLoading(false);
    }

    fetchStats();
  }, [month]);

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
        <div className="space-y-4">
          <div className="h-8 w-40 bg-surface-light rounded animate-pulse" />
          <div className="h-96 bg-surface-light rounded-xl animate-pulse" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <a href="/" className="text-xs text-info hover:underline transition-colors">
            &larr; Dashboard
          </a>
          <h1 className="text-2xl font-bold mt-1">Monthly Consistency</h1>
        </div>
      </header>

      <section className="bg-surface rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">This Month</h2>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
      </section>
    </main>
  );
}
