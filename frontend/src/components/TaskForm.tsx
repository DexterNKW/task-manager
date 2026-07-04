"use client";

interface TaskFormProps {
  title: string;
  dueDate: string;
  submitting: boolean;
  onTitleChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function TaskForm({
  title,
  dueDate,
  submitting,
  onTitleChange,
  onDueDateChange,
  onSubmit,
}: TaskFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2 mb-6">
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="New task..."
        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => onDueDateChange(e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md text-sm disabled:opacity-50 transition-colors"
      >
        {submitting ? "Adding..." : "Add"}
      </button>
    </form>
  );
}
