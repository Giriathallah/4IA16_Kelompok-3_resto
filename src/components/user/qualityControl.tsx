"use client";
import { Minus, Plus } from "lucide-react";

export function QuantityControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(value - 1)}
        className="p-2 rounded-lg hover:bg-accent"
        aria-label="Decrease"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="w-8 text-center font-medium">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="p-2 rounded-lg hover:bg-accent"
        aria-label="Increase"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
