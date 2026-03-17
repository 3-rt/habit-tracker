import HabitChecklist from '@/components/dashboard/HabitChecklist';

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Habit Tracker</h1>
        <a
          href="/manage"
          className="text-sm text-info hover:underline transition-colors"
        >
          Manage Habits
        </a>
      </header>

      <div className="flex flex-col md:flex-row gap-6">
        <HabitChecklist />
        <div className="flex-1">
          <div className="bg-surface rounded-xl p-5 text-gray-400 text-sm">
            Stats panel coming soon...
          </div>
        </div>
      </div>
    </main>
  );
}
