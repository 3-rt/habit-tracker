'use client';

import type { Entry } from '@/lib/types';

interface EntryHistoryProps {
  entries: Entry[];
  unit?: string | null;
}

export default function EntryHistory({ entries, unit }: EntryHistoryProps) {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="bg-surface rounded-xl p-5">
      <h3 className="text-sm font-semibold mb-3">Entry History</h3>
      {sorted.length === 0 ? (
        <p className="text-gray-400 text-sm">No entries yet.</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {sorted.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between bg-surface-light rounded-lg px-4 py-2.5 text-sm"
            >
              <span className="text-gray-300">{entry.date}</span>
              <div className="flex items-center gap-3">
                {entry.value !== null && (
                  <span className="text-info font-medium">
                    {entry.value}{unit ? ` ${unit}` : ''}
                  </span>
                )}
                {entry.note && (
                  <span className="text-gray-400 text-xs max-w-[200px] truncate" title={entry.note}>
                    {entry.note}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
