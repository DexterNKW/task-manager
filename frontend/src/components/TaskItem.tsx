"use client";

import type { Task } from "@/types";

interface TaskItemProps {
  task: Task;
  isEditing: boolean;
  editTitle: string;
  editDueDate: string;
  onEditTitleChange: (value: string) => void;
  onEditDueDateChange: (value: string) => void;
  onStartEditing: (task: Task) => void;
  onCancelEditing: () => void;
  onSaveEdit: (task: Task) => void;
  onToggle: (task: Task) => void;
  onDelete: (id: number) => void;
}

export function TaskItem({
  task,
  isEditing,
  editTitle,
  editDueDate,
  onEditTitleChange,
  onEditDueDateChange,
  onStartEditing,
  onCancelEditing,
  onSaveEdit,
  onToggle,
  onDelete,
}: TaskItemProps) {
  function handleDeleteClick() {
    if (window.confirm(`Delete task "${task.title}"?`)) {
      onDelete(task.id);
    }
  }

  return (
    <li className="flex items-center gap-3 bg-white border border-gray-200 rounded-md px-4 py-3 shadow-sm">
      {isEditing ? (
        <>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => onEditTitleChange(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={editDueDate}
            onChange={(e) => onEditDueDateChange(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {editDueDate && (
            <button
              type="button"
              onClick={() => onEditDueDateChange("")}
              className="text-gray-500 hover:text-gray-700 text-xs whitespace-nowrap"
            >
              Remove date
            </button>
          )}
          <button
            onClick={() => onSaveEdit(task)}
            className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
          >
            Save
          </button>
          <button onClick={onCancelEditing} className="text-gray-500 hover:text-gray-700 text-xs px-2">
            Cancel
          </button>
        </>
      ) : (
        <>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task)}
            className="h-4 w-4 accent-blue-600"
          />
          <span
            className={`flex-1 text-sm ${
              task.completed ? "line-through text-gray-400" : "text-gray-800"
            }`}
          >
            {task.title}
          </span>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
          </span>
          <button
            onClick={() => onStartEditing(task)}
            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
          >
            Edit
          </button>
          <button onClick={handleDeleteClick} className="text-red-600 hover:text-red-800 text-xs font-medium">
            Delete
          </button>
        </>
      )}
    </li>
  );
}
