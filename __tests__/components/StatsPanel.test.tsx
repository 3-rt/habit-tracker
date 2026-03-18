import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import StatsPanel from '@/components/dashboard/StatsPanel';

describe('StatsPanel', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the monthly card and refetches when navigating months', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      const month = url.includes('month=2026-02') ? '2026-02' : '2026-03';

      return {
        json: async () => ({
          stats: [{ habit_id: 1, habit_name: 'Read', current_streak: 4, longest_streak: 4, completion_rate_7d: 57 }],
          weeklySummary: [
            { date: '2026-03-16', completed: 1, total: 2 },
            { date: '2026-03-17', completed: 2, total: 2 },
          ],
          monthlySummary: {
            month,
            days: [
              {
                date: `${month}-01`,
                scheduled: 0,
                completed: 0,
                completion_rate: 0,
                fully_completed: false,
              },
              {
                date: `${month}-02`,
                scheduled: 2,
                completed: 2,
                completion_rate: 1,
                fully_completed: true,
              },
            ],
            fully_completed_days: month === '2026-03' ? 9 : 7,
            completion_rate: month === '2026-03' ? 0.78 : 0.64,
            longest_streak_in_month: month === '2026-03' ? 6 : 4,
          },
        }),
      };
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<StatsPanel />);

    await waitFor(() => {
      expect(screen.getByText('This Month')).toBeDefined();
    });

    expect(screen.getByText('This Week')).toBeDefined();
    const fullDaysCard = screen.getByText('Fully completed days').parentElement;
    expect(fullDaysCard).toBeTruthy();
    expect(within(fullDaysCard as HTMLElement).getByText('9')).toBeDefined();
    expect(screen.getByText('78%')).toBeDefined();
    expect(screen.getByText('6 days')).toBeDefined();

    fireEvent.click(screen.getByLabelText('Previous month'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/stats?month=2026-02');
    });
  });
});
