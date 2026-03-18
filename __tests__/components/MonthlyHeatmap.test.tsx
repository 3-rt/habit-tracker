import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import MonthlyHeatmap from '@/components/dashboard/MonthlyHeatmap';

describe('MonthlyHeatmap', () => {
  it('renders the selected month with neutral and strong completion states', () => {
    render(
      <MonthlyHeatmap
        month="2026-03"
        days={[
          {
            date: '2026-03-01',
            scheduled: 0,
            completed: 0,
            completion_rate: 0,
            fully_completed: false,
          },
          {
            date: '2026-03-02',
            scheduled: 2,
            completed: 2,
            completion_rate: 1,
            fully_completed: true,
          },
        ]}
      />
    );

    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByText('31')).toBeDefined();

    const neutralDay = screen.getByTitle('2026-03-01: 0/0');
    const strongDay = screen.getByTitle('2026-03-02: 2/2');

    expect(neutralDay.className).toContain('bg-surface-light');
    expect(strongDay.className).toContain('bg-done');
  });
});
