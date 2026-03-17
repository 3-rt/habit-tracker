'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { Entry } from '@/lib/types';

interface TrendChartProps {
  entries: Entry[];
  target?: number | null;
  unit?: string | null;
}

export default function TrendChart({ entries, target, unit }: TrendChartProps) {
  const data = entries
    .filter((e) => e.value !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      date: e.date.slice(5), // "MM-DD"
      value: e.value,
    }));

  if (data.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3">Trend</h3>
        <p className="text-gray-400 text-sm">No data yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-5">
      <h3 className="text-sm font-semibold mb-3">
        Trend {unit ? `(${unit})` : ''}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} />
          <YAxis tick={{ fontSize: 11, fill: '#888' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: 8 }}
            labelStyle={{ color: '#aaa' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={{ r: 3, fill: '#60a5fa' }}
          />
          {target != null && (
            <ReferenceLine
              y={target}
              stroke="#4ade80"
              strokeDasharray="5 5"
              label={{ value: `Target: ${target}`, fill: '#4ade80', fontSize: 11 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
