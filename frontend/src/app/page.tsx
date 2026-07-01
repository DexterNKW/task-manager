"use client";

import { useEffect, useState } from "react";

interface Task {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
  dueDate: string | null;
}

const API_URL = "http://localhost:3000/api/tasks";

type Filter = "all" | "active" | "completed";

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
    <main className="max-w-xl mx-auto mt-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Task Manager</h1>

      <form onSubmit={handleAddTask} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New task..."
          className="flex-1 border rounded px-3 py-2"
        />
        <input
          type="date"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add"}
        </button>
      </form>

      {error && <p className="text-red-600 mb-4">Error: {error}</p>}

      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter("all")} className={filter === "all" ? "font-bold underline" : ""}>All</button>
        <button onClick={() => setFilter("active")} className={filter === "active" ? "font-bold underline" : ""}>Active</button>
        <button onClick={() => setFilter("completed")} className={filter === "completed" ? "font-bold underline" : ""}>Completed</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p className="text-gray-500">No tasks present.</p>
      ) : filteredTasks.length === 0 ? (
        <p className="text-gray-500">No tasks match this filter.</p>
      ) : (
        <ul className="space-y-2">
          {filteredTasks.map((task) => (
            <li key={task.id} className="flex items-center gap-3 border rounded px-3 py-2">
              {editingId === task.id ? (
                <>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 border rounded px-2 py-1"
                  />
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="border rounded px-2 py-1"
                  />
                  <button onClick={() => handleSaveEdit(task)} className="text-green-600 text-sm">
                    Save
                  </button>
                  <button onClick={cancelEditing} className="text-gray-500 text-sm">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggle(task)}
                  />
                  <span className={`flex-1 ${task.completed ? "line-through text-gray-400" : ""}`}>
                    {task.title}
                  </span>
                  <span className="text-gray-500">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                  </span>
                  <button onClick={() => startEditing(task)} className="text-blue-600 text-sm">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(task.id)} className="text-red-600 text-sm">
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}