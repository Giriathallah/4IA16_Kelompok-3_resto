"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { SearchInput } from "@/components/user/searchInput";
import { CategoryFilter } from "@/components/user/categoryFilter";
import { MenuGrid } from "@/components/user/menuGrid";
import { MENU_CATEGORIES, type Category, type MenuItem } from "@/lib/shop";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

type ApiProduct = {
  id: string;
  name: string;
  price: number;
  category: Category; // "MAIN" | "APPETIZER" | "DRINK"
  stock: number;
  isActive: boolean;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

type ListResponse = {
  items: ApiProduct[];
  page: number;
  perPage: number;
  total: number;
};

function buildQuery(params: { q?: string; category?: "all" | Category }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.category && params.category !== "all")
    sp.set("category", params.category);
  sp.set("active", "true"); // only show active items to users
  sp.set("perPage", "60"); // pull a sensible chunk
  sp.set("sort", "createdAt_desc"); // latest first
  return sp.toString();
}

export default function HomePage() {
  const { add } = useCart();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<"all" | Category>("all");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MenuItem[]>([]);

  const fetchItems = useCallback(
    async (signal?: AbortSignal) => {
      const qs = buildQuery({ q, category });
      const res = await fetch(`/api/products?${qs}`, {
        cache: "no-store",
        signal,
      });
      if (!res.ok) throw new Error(`Gagal memuat menu (${res.status})`);
      const data: ListResponse = await res.json();
      // map API Product -> MenuItem
      const mapped: MenuItem[] = data.items.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        image: p.imageUrl ?? "", // MenuCard expects `image`
        // optional fields (not in schema, safe defaults for UI)
        rating: undefined,
        time: undefined,
        description: undefined,
      }));
      return mapped;
    },
    [q, category]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    fetchItems(ctrl.signal)
      .then((mapped) => setItems(mapped))
      .catch((e: any) => {
        if (e.name !== "AbortError")
          toast.error(e.message ?? "Gagal memuat menu");
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [fetchItems]);

  const onAdd = useCallback((m: MenuItem) => add(m), [add]);

  // (opsional) fallback client-side filter jika mau double-guard
  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((it) => {
      const okCat = category === "all" || it.category === category;
      const okTerm = !term || it.name.toLowerCase().includes(term);
      return okCat && okTerm;
    });
  }, [items, q, category]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Search for dishes…"
          />
        </div>
        <CategoryFilter
          categories={MENU_CATEGORIES}
          value={category}
          onChange={setCategory}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border p-4">
              <div className="h-40 w-full rounded-xl bg-muted animate-pulse" />
              <div className="mt-4 h-4 w-3/4 bg-muted rounded animate-pulse" />
              <div className="mt-2 h-4 w-1/2 bg-muted rounded animate-pulse" />
              <div className="mt-4 h-10 w-full bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <MenuGrid items={visible} onAdd={onAdd} />
      )}
    </div>
  );
}
