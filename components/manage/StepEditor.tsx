'use client';

import { useState } from 'react';

interface Step {
  name: string;
}

interface StepEditorProps {
  steps: Step[];
  onChange: (steps: Step[]) => void;
}

export default function StepEditor({ steps, onChange }: StepEditorProps) {
  const [newStep, setNewStep] = useState('');

  const addStep = () => {
    const trimmed = newStep.trim();
    if (!trimmed) return;
    onChange([...steps, { name: trimmed }]);
    setNewStep('');
  };

  const removeStep = (index: number) => {
    onChange(steps.filter((_, i) => i !== index));
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const updated = [...steps];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">Steps</label>
      {steps.length > 0 && (
        <ul className="space-y-1">
          {steps.map((step, i) => (
            <li
              key={i}
              className="flex items-center gap-2 bg-surface-light rounded px-3 py-2 text-sm"
            >
              <span className="text-gray-400 w-5 text-center">{i + 1}.</span>
              <span className="flex-1">{step.name}</span>
              <button
                type="button"
                onClick={() => moveStep(i, -1)}
                disabled={i === 0}
                className="text-gray-400 hover:text-white disabled:opacity-30 text-xs"
                aria-label={`Move ${step.name} up`}
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveStep(i, 1)}
                disabled={i === steps.length - 1}
                className="text-gray-400 hover:text-white disabled:opacity-30 text-xs"
                aria-label={`Move ${step.name} down`}
              >
                ▼
              </button>
              <button
                type="button"
                onClick={() => removeStep(i)}
                className="text-pending hover:text-red-400 text-xs ml-1"
                aria-label={`Remove ${step.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={newStep}
          onChange={(e) => setNewStep(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addStep();
            }
          }}
          placeholder="Add a step..."
          className="flex-1 bg-surface-light border border-gray-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-info"
        />
        <button
          type="button"
          onClick={addStep}
          className="bg-info/20 text-info px-3 py-1.5 rounded text-sm hover:bg-info/30 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}
