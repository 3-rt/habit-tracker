import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

vi.mock('@/components/dashboard/HabitChecklist', () => ({
  default: () => <div>Checklist</div>,
}));

vi.mock('@/components/dashboard/StatsPanel', () => ({
  default: () => <div>Stats</div>,
}));

describe('Home', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('links to the insights page', () => {
    render(<Home />);

    const insightsLink = screen.getByRole('link', { name: 'Insights' });
    expect(insightsLink.getAttribute('href')).toBe('/insights');
  });
});
