"use client";
import type { MenuItem } from "@/lib/shop";
import { MenuCard } from "./menuCard";

export function MenuGrid({
  items,
  onAdd,
}: {
  items: MenuItem[];
  onAdd: (m: MenuItem) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <MenuCard key={item.id} item={item} onAdd={onAdd} />
      ))}
    </div>
  );
}
