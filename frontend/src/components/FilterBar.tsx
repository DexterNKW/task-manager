"use client";

export type Filter = "all" | "active" | "completed";

const FILTERS: Filter[] = ["all", "active", "completed"];

interface FilterBarProps {
  filter: Filter;
  onChange: (filter: Filter) => void;
}

export function FilterBar({ filter, onChange }: FilterBarProps) {
  return (
    <div className="flex gap-1 mb-4 bg-white border border-gray-200 rounded-md p-1 w-fit">
      {FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`px-3 py-1 rounded text-sm capitalize transition-colors ${
            filter === f ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
