"use client";
import { Plus, Star, Clock } from "lucide-react";
import type { MenuItem } from "@/lib/shop";

export function MenuCard({
  item,
  onAdd,
}: {
  item: MenuItem;
  onAdd: (m: MenuItem) => void;
}) {
  const formatPrice = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border">
      <div className="relative">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-48 object-cover"
        />
        {item.rating && (
          <div className="absolute top-4 right-4 bg-accent px-2 py-1 rounded-lg flex items-center gap-1">
            <Star className="w-4 h-4 text-primary fill-current" />
            <span className="text-sm font-medium text-primary">
              {item.rating}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold">{item.name}</h3>
          {item.time && (
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Clock className="w-4 h-4" />
              <span>{item.time}</span>
            </div>
          )}
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {item.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary">
            {formatPrice(item.price)}
          </span>
          <button
            onClick={() => onAdd(item)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:opacity-90 transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
