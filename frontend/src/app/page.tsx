"use client";

import { useEffect, useState } from "react";
import { FilterBar, type Filter } from "@/components/FilterBar";
import { TaskForm } from "@/components/TaskForm";
import { TaskItem } from "@/components/TaskItem";
import type { Task } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/tasks";

function toDateInputValue(dueDate: string | null): string {
  return dueDate ? dueDate.slice(0, 10) : "";
}

export default function Home() {
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

  useEffect(() => {
    fetchTasks();
  }, []);

  function fetchTasks() {
    setLoading(true);
    setError(null);
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Error loading tasks");
        return res.json();
      })
      .then((data: Task[]) => setTasks(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, dueDate: newDueDate ? newDueDate : null }),
      });
      if (!res.ok) throw new Error("Error creating task");
      const createdTask: Task = await res.json();
      setTasks((prev) => [...prev, createdTask]);
      setNewTitle("");
      setNewDueDate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(task: Task) {
    try {
      const res = await fetch(`${API_URL}/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (!res.ok) throw new Error("Error updating task");
      const updatedTask: Task = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error deleting task");
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
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
      const res = await fetch(`${API_URL}/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          dueDate: editDueDate ? editDueDate : null,
        }),
      });
      if (!res.ok) throw new Error("Error updating task");
      const updatedTask: Task = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
      cancelEditing();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  return (
    <main className="max-w-2xl mx-auto mt-12 px-4 pb-12">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Task Manager</h1>

      <TaskForm
        title={newTitle}
        dueDate={newDueDate}
        submitting={submitting}
        onTitleChange={setNewTitle}
        onDueDateChange={setNewDueDate}
        onSubmit={handleAddTask}
      />

      {error && (
        <p className="text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4 text-sm">
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
    </main>
  );
}
