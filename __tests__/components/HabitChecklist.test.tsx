import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import HabitChecklist from '@/components/dashboard/HabitChecklist';

describe('HabitChecklist', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-18T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shows only habits scheduled for the selected date', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url === '/api/habits') {
        return {
          json: async () => [
            {
              id: 1,
              name: 'Tuesday habit',
              type: 'yes_no',
              schedule: { type: 'weekly', days: ['tue'] },
              unit: null,
              target: null,
              created_at: '',
              archived_at: null,
            },
            {
              id: 2,
              name: 'Wednesday habit',
              type: 'yes_no',
              schedule: { type: 'weekly', days: ['wed'] },
              unit: null,
              target: null,
              created_at: '',
              archived_at: null,
            },
          ],
        };
      }

      if (url === '/api/entries?date=2026-03-18') {
        return {
          json: async () => [],
        };
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<HabitChecklist />);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('Wednesday habit')).toBeDefined();
    expect(screen.queryByText('Tuesday habit')).toBeNull();
  });

  it('preserves API order after filtering visible habits', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url === '/api/habits') {
        return {
          json: async () => [
            {
              id: 1,
              name: 'Morning skincare',
              type: 'yes_no',
              schedule: { type: 'weekly', days: ['wed'] },
              unit: null,
              target: null,
              sort_order: 2,
              created_at: '',
              archived_at: null,
            },
            {
              id: 2,
              name: 'Go to the gym',
              type: 'yes_no',
              schedule: { type: 'weekly', days: ['wed'] },
              unit: null,
              target: null,
              sort_order: 1,
              created_at: '',
              archived_at: null,
            },
            {
              id: 3,
              name: 'Tuesday habit',
              type: 'yes_no',
              schedule: { type: 'weekly', days: ['tue'] },
              unit: null,
              target: null,
              sort_order: 3,
              created_at: '',
              archived_at: null,
            },
          ],
        };
      }

      if (url === '/api/entries?date=2026-03-18') {
        return {
          json: async () => [],
        };
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<HabitChecklist />);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const skincare = screen.getByText('Morning skincare');
    const gym = screen.getByText('Go to the gym');

    expect(skincare.compareDocumentPosition(gym) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText('Tuesday habit')).toBeNull();
  });
});
