import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import HabitChecklistItem from '@/components/dashboard/HabitChecklistItem';

describe('HabitChecklistItem', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders habit name', () => {
    render(
      <HabitChecklistItem
        habit={{ id: 1, name: 'Meditate', type: 'yes_no', schedule: { type: 'daily' }, unit: null, target: null, created_at: '', archived_at: null }}
        entry={null}
        date="2026-03-17"
        onUpdate={() => {}}
      />
    );
    expect(screen.getByText('Meditate')).toBeDefined();
  });

  it('posts toggled multi-step completion when a step is checked', async () => {
    const fetchMock = vi.fn(async () => ({
      json: async () => ({ ok: true }),
    }));
    const onUpdate = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(
      <HabitChecklistItem
        habit={{ id: 2, name: 'Morning routine', type: 'multi_step', schedule: { type: 'daily' }, unit: null, target: null, sort_order: 1, created_at: '', archived_at: null }}
        entry={null}
        date="2026-03-18"
        onUpdate={onUpdate}
        steps={[
          { id: 11, habit_id: 2, name: 'Brush teeth', sort_order: 1 },
          { id: 12, habit_id: 2, name: 'Moisturize', sort_order: 2 },
        ]}
      />
    );

    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Brush teeth' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        habit_id: 2,
        date: '2026-03-18',
        steps: [
          { habit_step_id: 11, completed: 1 },
          { habit_step_id: 12, completed: 0 },
        ],
      }),
    });

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });
  });

  it('toggles a multi-step item when the step label is clicked', async () => {
    const fetchMock = vi.fn(async () => ({
      json: async () => ({ ok: true }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    render(
      <HabitChecklistItem
        habit={{ id: 2, name: 'Morning routine', type: 'multi_step', schedule: { type: 'daily' }, unit: null, target: null, sort_order: 1, created_at: '', archived_at: null }}
        entry={null}
        date="2026-03-18"
        onUpdate={() => {}}
        steps={[
          { id: 11, habit_id: 2, name: 'Brush teeth', sort_order: 1 },
          { id: 12, habit_id: 2, name: 'Moisturize', sort_order: 2 },
        ]}
      />
    );

    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getByText('Brush teeth'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it('renders multi-step items as real checkboxes', () => {
    render(
      <HabitChecklistItem
        habit={{ id: 2, name: 'Morning routine', type: 'multi_step', schedule: { type: 'daily' }, unit: null, target: null, sort_order: 1, created_at: '', archived_at: null }}
        entry={null}
        date="2026-03-18"
        onUpdate={() => {}}
        steps={[
          { id: 11, habit_id: 2, name: 'Brush teeth', sort_order: 1 },
          { id: 12, habit_id: 2, name: 'Moisturize', sort_order: 2 },
        ]}
      />
    );

    fireEvent.click(screen.getAllByRole('button')[0]);

    expect(screen.getByRole('checkbox', { name: 'Brush teeth' })).toBeDefined();
    expect(screen.getByRole('checkbox', { name: 'Moisturize' })).toBeDefined();
  });

  it('keeps multi-step toggles disabled until refresh completes', async () => {
    const fetchMock = vi.fn(async () => ({
      json: async () => ({ ok: true }),
    }));
    let resolveUpdate: (() => void) | null = null;
    const onUpdate = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveUpdate = resolve;
        })
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <HabitChecklistItem
        habit={{ id: 2, name: 'Morning routine', type: 'multi_step', schedule: { type: 'daily' }, unit: null, target: null, sort_order: 1, created_at: '', archived_at: null }}
        entry={null}
        date="2026-03-18"
        onUpdate={onUpdate}
        steps={[
          { id: 11, habit_id: 2, name: 'Brush teeth', sort_order: 1 },
          { id: 12, habit_id: 2, name: 'Moisturize', sort_order: 2 },
        ]}
      />
    );

    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getByText('Brush teeth'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByText('Moisturize'));

    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveUpdate?.();
    });

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });
  });

  it('rebuilds missing entry steps from the habit steps when an empty multi-step entry exists', async () => {
    const fetchMock = vi.fn(async () => ({
      json: async () => ({ ok: true }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    render(
      <HabitChecklistItem
        habit={{ id: 2, name: 'Night routine', type: 'multi_step', schedule: { type: 'daily' }, unit: null, target: null, sort_order: 1, created_at: '', archived_at: null }}
        entry={{
          id: 50,
          habit_id: 2,
          date: '2026-03-18',
          value: null,
          note: null,
          created_at: '',
          updated_at: '',
          steps: [],
        }}
        date="2026-03-18"
        onUpdate={() => {}}
        steps={[
          { id: 11, habit_id: 2, name: 'Shower', sort_order: 1 },
          { id: 12, habit_id: 2, name: 'Brush Teeth', sort_order: 2 },
          { id: 13, habit_id: 2, name: 'Skincare', sort_order: 3 },
          { id: 14, habit_id: 2, name: 'Read', sort_order: 4 },
        ]}
      />
    );

    expect(screen.getByText('0/4')).toBeDefined();

    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Shower' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/entries', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        habit_id: 2,
        date: '2026-03-18',
        steps: [
          { habit_step_id: 11, completed: 1 },
          { habit_step_id: 12, completed: 0 },
          { habit_step_id: 13, completed: 0 },
          { habit_step_id: 14, completed: 0 },
        ],
      }),
    });
  });
});
