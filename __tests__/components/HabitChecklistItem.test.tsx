import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HabitChecklistItem from '@/components/dashboard/HabitChecklistItem';

describe('HabitChecklistItem', () => {
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
});
