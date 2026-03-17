'use client';

import { useState } from 'react';

interface NumericInputProps {
  initialValue: number | null;
  unit: string | null;
  target: number | null;
  onSave: (value: number) => void;
  onCancel: () => void;
}

export default function NumericInput({ initialValue, unit, target, onSave, onCancel }: NumericInputProps) {
  const [value, setValue] = useState(initialValue?.toString() ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(value);
    if (!isNaN(num)) onSave(num);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-20 px-2 py-1 bg-surface-light rounded text-sm text-white border border-surface-light focus:border-info focus:outline-none"
        autoFocus
        step="any"
        placeholder={target?.toString() ?? '0'}
      />
      {unit && <span className="text-xs text-gray-400">{unit}</span>}
      {target && <span className="text-xs text-gray-500">/ {target}</span>}
      <button type="submit" className="text-xs px-2 py-1 bg-done/20 text-done rounded hover:bg-done/30 transition-colors">
        Save
      </button>
      <button type="button" onClick={onCancel} className="text-xs px-2 py-1 text-gray-400 hover:text-white transition-colors">
        Cancel
      </button>
    </form>
  );
}
