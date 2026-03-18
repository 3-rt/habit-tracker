import HabitChecklist from '@/components/dashboard/HabitChecklist';
import StatsPanel from '@/components/dashboard/StatsPanel';

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Habit Tracker</h1>
        <div className="flex items-center gap-4">
          <a
            href="/insights"
            className="text-sm text-info hover:underline transition-colors"
          >
            Insights
          </a>
          <a
            href="/manage"
            className="text-sm text-info hover:underline transition-colors"
          >
            Manage Habits
          </a>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-6">
        <HabitChecklist />
        <StatsPanel />
      </div>
    </main>
  );
}
