"use client";

import { useEffect, useState } from "react";
import { FilterBar, type Filter } from "@/components/FilterBar";
import { TaskForm } from "@/components/TaskForm";
import { TaskItem } from "@/components/TaskItem";
import { ApiError, apiRequest } from "@/lib/api";
import { toDateInputValue } from "@/lib/due-date";
import type { Task } from "@/types";

interface TaskBoardProps {
  token: string;
  onSessionExpired: () => void;
}

export function TaskBoard({ token, onSessionExpired }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  const filteredTasks = tasks.filter((task) => {
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  function handleError(err: unknown) {
    // An expired or revoked token cannot be fixed from here: back to sign-in.
    if (err instanceof ApiError && err.status === 401) {
      onSessionExpired();
      return;
    }
    setError(err instanceof Error ? err.message : "Unknown error");
  }

  useEffect(() => {
    apiRequest<Task[]>("/api/tasks", { token })
      .then((data) => setTasks(data))
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) onSessionExpired();
        else setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => setLoading(false));
  }, [token, onSessionExpired]);

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    try {
      const createdTask = await apiRequest<Task>("/api/tasks", {
        method: "POST",
        token,
        body: { title: newTitle, dueDate: newDueDate ? newDueDate : null },
      });
      setTasks((prev) => [...prev, createdTask]);
      setNewTitle("");
      setNewDueDate("");
    } catch (err) {
      handleError(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(task: Task) {
    try {
      const updatedTask = await apiRequest<Task>(`/api/tasks/${task.id}`, {
        method: "PUT",
        token,
        body: { completed: !task.completed },
      });
      setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    } catch (err) {
      handleError(err);
    }
  }

  async function handleDelete(id: number) {
    try {
      await apiRequest<void>(`/api/tasks/${id}`, { method: "DELETE", token });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      handleError(err);
    }
  }

  function startEditing(task: Task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDueDate(toDateInputValue(task.dueDate));
  }

  function cancelEditing() {
    setEditingId(null);
    setEditTitle("");
    setEditDueDate("");
  }

  async function handleSaveEdit(task: Task) {
    if (!editTitle.trim()) return;

    try {
      const updatedTask = await apiRequest<Task>(`/api/tasks/${task.id}`, {
        method: "PUT",
        token,
        body: { title: editTitle, dueDate: editDueDate ? editDueDate : null },
      });
      setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
      cancelEditing();
    } catch (err) {
      handleError(err);
    }
  }

  return (
    <>
      <TaskForm
        title={newTitle}
        dueDate={newDueDate}
        submitting={submitting}
        onTitleChange={setNewTitle}
        onDueDateChange={setNewDueDate}
        onSubmit={handleAddTask}
      />

      {error && (
        <p role="alert" className="text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4 text-sm">
          Error: {error}
        </p>
      )}

      <FilterBar filter={filter} onChange={setFilter} />

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : tasks.length === 0 ? (
        <p className="text-gray-500 text-sm">No tasks present.</p>
      ) : filteredTasks.length === 0 ? (
        <p className="text-gray-500 text-sm">No tasks match this filter.</p>
      ) : (
        <ul className="space-y-2">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isEditing={editingId === task.id}
              editTitle={editTitle}
              editDueDate={editDueDate}
              onEditTitleChange={setEditTitle}
              onEditDueDateChange={setEditDueDate}
              onStartEditing={startEditing}
              onCancelEditing={cancelEditing}
              onSaveEdit={handleSaveEdit}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}
    </>
  );
}
