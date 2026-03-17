import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CalendarView from '@/components/detail/CalendarView';

describe('CalendarView', () => {
  it('renders days of the month', () => {
    render(
      <CalendarView entries={[]} month="2026-03" schedule={{ type: 'daily' }} />
    );
    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByText('31')).toBeDefined();
  });
});
