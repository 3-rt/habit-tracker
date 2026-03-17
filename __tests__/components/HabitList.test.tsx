import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import HabitList from '@/components/manage/HabitList';

describe('HabitList', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders active habits in saved order and persists drag reordering', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();

      if (url === '/api/habits?include_archived=true') {
        return {
          json: async () => [
            {
              id: 1,
              name: 'Morning skincare',
              type: 'yes_no',
              schedule: { type: 'daily' },
              unit: null,
              target: null,
              sort_order: 1,
              created_at: '',
              archived_at: null,
            },
            {
              id: 2,
              name: 'Go to the gym',
              type: 'yes_no',
              schedule: { type: 'daily' },
              unit: null,
              target: null,
              sort_order: 2,
              created_at: '',
              archived_at: null,
            },
            {
              id: 3,
              name: 'Archived',
              type: 'yes_no',
              schedule: { type: 'daily' },
              unit: null,
              target: null,
              sort_order: 3,
              created_at: '',
              archived_at: '2026-03-17T00:00:00Z',
            },
          ],
        };
      }

      if (url === '/api/habits/reorder' && init?.method === 'PUT') {
        return {
          ok: true,
          json: async () => [
            {
              id: 2,
              name: 'Go to the gym',
              type: 'yes_no',
              schedule: { type: 'daily' },
              unit: null,
              target: null,
              sort_order: 1,
              created_at: '',
              archived_at: null,
              steps: [],
            },
            {
              id: 1,
              name: 'Morning skincare',
              type: 'yes_no',
              schedule: { type: 'daily' },
              unit: null,
              target: null,
              sort_order: 2,
              created_at: '',
              archived_at: null,
              steps: [],
            },
          ],
        };
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<HabitList onEdit={() => {}} refreshKey={0} />);

    await waitFor(() => {
      expect(screen.getByText('Morning skincare')).toBeDefined();
    });

    expect(screen.getAllByRole('link').map((node) => node.textContent)).toEqual([
      'Morning skincare',
      'Go to the gym',
      'Archived',
    ]);

    fireEvent.dragStart(screen.getByLabelText('Drag Go to the gym'));
    fireEvent.dragOver(screen.getByLabelText('Drag Morning skincare'));
    fireEvent.drop(screen.getByLabelText('Drag Morning skincare'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/habits/reorder',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ habitIds: [2, 1] }),
        })
      );
    });
  });
});
