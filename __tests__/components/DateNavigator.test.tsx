import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import DateNavigator from '@/components/dashboard/DateNavigator';

describe('DateNavigator', () => {
  it('allows navigating to future dates from today', () => {
    const onDateChange = vi.fn();

    render(<DateNavigator date="2026-03-17" onDateChange={onDateChange} />);

    const nextDayButton = screen.getByLabelText('Next day');
    expect(nextDayButton.getAttribute('disabled')).toBeNull();

    fireEvent.click(nextDayButton);

    expect(onDateChange).toHaveBeenCalledWith('2026-03-18');
  });
});
