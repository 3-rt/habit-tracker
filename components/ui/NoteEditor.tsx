'use client';

import { useState } from 'react';

interface NoteEditorProps {
  initialNote: string | null;
  onSave: (note: string) => void;
  onCancel: () => void;
}

export default function NoteEditor({ initialNote, onSave, onCancel }: NoteEditorProps) {
  const [note, setNote] = useState(initialNote ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(note);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full px-3 py-2 bg-surface-light rounded text-sm text-white border border-surface-light focus:border-info focus:outline-none resize-none"
        rows={2}
        autoFocus
        placeholder="Add a note..."
      />
      <div className="flex gap-2 mt-1">
        <button type="submit" className="text-xs px-2 py-1 bg-done/20 text-done rounded hover:bg-done/30 transition-colors">
          Save
        </button>
        <button type="button" onClick={onCancel} className="text-xs px-2 py-1 text-gray-400 hover:text-white transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
