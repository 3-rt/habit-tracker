'use client';

import { useState } from 'react';
import type { HabitWithSteps } from '@/lib/types';
import HabitForm from '@/components/manage/HabitForm';
import HabitList from '@/components/manage/HabitList';

export default function ManagePage() {
  const [editingHabit, setEditingHabit] = useState<HabitWithSteps | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSave = () => {
    setEditingHabit(undefined);
    setRefreshKey((k) => k + 1);
  };

  const handleCancel = () => {
    setEditingHabit(undefined);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manage Habits</h1>
        <a
          href="/"
          className="text-sm text-info hover:underline transition-colors"
        >
          Back to Dashboard
        </a>
      </header>

      <div className="space-y-6">
        <HabitForm
          key={editingHabit?.id ?? 'new'}
          habit={editingHabit}
          onSave={handleSave}
          onCancel={editingHabit ? handleCancel : undefined}
        />
        <HabitList onEdit={setEditingHabit} refreshKey={refreshKey} />
      </div>
    </main>
  );
}
