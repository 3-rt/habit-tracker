import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HabitForm from '@/components/manage/HabitForm';

describe('HabitForm', () => {
  it('renders form fields', () => {
    render(<HabitForm onSave={() => {}} />);
    expect(screen.getByLabelText('Name')).toBeDefined();
    expect(screen.getByLabelText('Type')).toBeDefined();
  });
});
