"use client";
import { Category } from "@/lib/shop";

export function CategoryFilter({
  categories,
  value,
  onChange,
}: {
  categories: { id: Category; name: string }[];
  value: "all" | Category;
  onChange: (v: "all" | Category) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as any)}
      className="px-4 py-3 rounded-xl border bg-card focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
    >
      <option value="all">All Categories</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
