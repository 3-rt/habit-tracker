import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import StatsPanel from '@/components/dashboard/StatsPanel';

describe('StatsPanel', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders weekly stats without the monthly card', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      return {
        json: async () => ({
          stats: [{ habit_id: 1, habit_name: 'Read', current_streak: 4, longest_streak: 4, completion_rate_7d: 57 }],
          weeklySummary: [
            { date: '2026-03-16', completed: 1, total: 2 },
            { date: '2026-03-17', completed: 2, total: 2 },
          ],
        }),
      };
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<StatsPanel />);

    await waitFor(() => {
      expect(screen.getByText('This Week')).toBeDefined();
    });

    expect(screen.getByText('This Week')).toBeDefined();
    expect(screen.getByText('Streaks')).toBeDefined();
    expect(screen.getByText('Weekly Heatmap')).toBeDefined();
    expect(screen.queryByText('This Month')).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith('/api/stats');
  });
});
